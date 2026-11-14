<?php
/**
 * Album-zip sidecar endpoint for www.fauxfetus.net.
 *
 * GET /dl/?a={artistSlug}&b={albumSlug}
 *
 * Validates the pair against the deployed data/catalog.json, then:
 *   - cache hit:  302 to /dl/cache/{artistSlug}--{albumSlug}--{hash8}.zip
 *                 (Apache serves the static file directly: Range/resume
 *                 support, no PHP worker held while the client downloads)
 *   - cache miss: builds the zip into cache/tmp-* with ZipArchive (STORE
 *                 compression - roughly disk-copy speed), atomically
 *                 renames it into place, prunes superseded versions of
 *                 that album, then 302s.
 *
 * No user input ever touches the filesystem: GET params only *select* an
 * album. Every path this script stats, archives or deletes is validated:
 *   - audio file list: strictly from catalog.json's `audioUrl` fields,
 *     each re-validated against `^[A-Za-z0-9_/ .!&-]+$` (the observed
 *     path charset) plus explicit '..' / NUL / absolute-path rejection;
 *   - cache operations: every path is asserted to live literally under
 *     cache/ (textual check for paths we build; realpath check for paths
 *     that exist, e.g. from glob);
 *   - deletion: only version-hash-shaped files (exact [0-9a-f]{8}.zip
 *     suffix) for the requested album, plus tmp-* leftovers.
 *
 * Architecture + testing: plans/audio-downloads.md. Deployed by
 * scripts/deploy.sh (excluding cache/, which persists across deploys).
 */

declare(strict_types=1);

const CATALOG_JSON = __DIR__ . '/../data/catalog.json';
const AUDIO_DIR = __DIR__ . '/../audio';
const CACHE_DIR = __DIR__ . '/cache';
const TMP_PREFIX = 'tmp-';
const TMP_MAX_AGE = 3600;
const VERSION_HEX_LEN = 8;

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');

/** Emit an error status with a one-line body and stop. */
function fail(int $code, string $message): never
{
	http_response_code($code);
	exit($message . "\n");
}

/** Redirect to a cache URL (302; browsers ignore the body). */
function redirect(string $zipUrl, string $version): never
{
	header('X-Zip-Version: ' . $version);
	header('Location: ' . $zipUrl, true, 302);
	exit("zip ready\n");
}

/** Audio path from the catalog (charset: observed across the audio tree). */
const AUDIO_PATH_RE = '/^[A-Za-z0-9_\/ .!&-]+$/';

/** True for a path we are ABOUT to create/use under cache/ (textual). */
function isCachePath(string $path): bool
{
	return str_starts_with($path, CACHE_DIR . '/')
		&& strlen($path) > strlen(CACHE_DIR) + 1
		&& !str_contains($path, '..')
		&& !str_contains($path, "\0");
}

/** True for a path that EXISTS and resolves inside cache/ (realpath). */
function isCacheFile(string $path): bool
{
	$real = realpath($path);
	if ($real === false || !is_file($real)) {
		return false;
	}
	return isCachePath($real);
}

/**
 * Zip entry folder name from display names: characters that are dangerous
 * inside zip entry names / Windows paths become hyphens, e.g.
 * "Bornpilot / Welcome Wizard Split" -> "Bornpilot - Welcome Wizard Split".
 */
function sanitizeFolderName(string $name): string
{
	$name = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '-', $name);
	$name = trim(preg_replace('/\s+/', ' ', $name) ?? $name, " \t\n\r.");
	return $name !== '' ? $name : 'album';
}

if (!class_exists('ZipArchive')) {
	fail(503, 'server PHP is missing the zip extension');
}

$artistSlug = isset($_GET['a']) ? (string) $_GET['a'] : '';
$albumSlug = isset($_GET['b']) ? (string) $_GET['b'] : '';
if (
	!preg_match('/^[a-z0-9-]{1,120}$/', $artistSlug)
	|| !preg_match('/^[a-z0-9-]{1,120}$/', $albumSlug)
) {
	fail(400, 'bad params: expected /dl/?a={artistSlug}&b={albumSlug}');
}

$catalogJson = @file_get_contents(CATALOG_JSON);
if ($catalogJson === false) {
	fail(500, 'catalog unavailable');
}
$catalog = json_decode($catalogJson, true);
if (!is_array($catalog)) {
	fail(500, 'catalog malformed');
}

// Find the requested album via the artistSlug/albumSlug pair (globally
// unique in the catalog; bare album slugs collide across artists).
$artist = null;
$album = null;
foreach ($catalog as $candidateArtist) {
	if (($candidateArtist['slug'] ?? null) !== $artistSlug) {
		continue;
	}
	foreach ($candidateArtist['albums'] ?? [] as $candidateAlbum) {
		if (($candidateAlbum['slug'] ?? null) === $albumSlug) {
			$artist = $candidateArtist;
			$album = $candidateAlbum;
			break 2;
		}
	}
}
if ($artist === null || $album === null) {
	fail(404, 'unknown album');
}

// Ordered, de-duplicated file list, re-validated defensively even though
// the catalog is build-generated: fail loudly rather than zip a malicious
// or malformed path.
$relFiles = [];
$seenUrls = [];
foreach ($album['tracks'] ?? [] as $track) {
	$rel = (string) ($track['audioUrl'] ?? '');
	if (isset($seenUrls[$rel])) {
		continue; // same audioUrl repeated on an album: archive the file once
	}
	if (
		$rel === ''
		|| !preg_match(AUDIO_PATH_RE, $rel)
		|| str_contains($rel, '..')
		|| str_starts_with($rel, '/')
		|| str_ends_with($rel, '/')
		|| str_contains($rel, "\0")
	) {
		fail(500, 'malformed audioUrl in catalog: ' . basename($rel));
	}
	$seenUrls[$rel] = true;
	$relFiles[] = $rel;
}
if (count($relFiles) === 0) {
	fail(404, 'album has no tracks');
}

// All-or-nothing: refuse with a retry hint rather than caching a partial
// archive (e.g. a deploy mid-flight between the audio/ and data/ rsyncs).
foreach ($relFiles as $rel) {
	if (!is_file(AUDIO_DIR . '/' . $rel)) {
		fail(503, 'album audio temporarily unavailable (deploy in progress?); try again shortly: '
			. $artistSlug . '/' . $albumSlug . ': ' . $rel);
	}
}

// Version fingerprint: catalog content (md5) combined with each audio
// file's size+mtime. Different album content => different cache file name,
// so no browser/proxy cache can ever serve a stale zip; meanwhile rsync
// only touches mtimes of files it actually changed, so untouched albums
// keep the same version across no-op deploys.
$hashSource = md5($catalogJson);
foreach ($relFiles as $rel) {
	$stat = stat(AUDIO_DIR . '/' . $rel);
	if ($stat === false) {
		fail(503, 'audio stat failed: ' . $rel);
	}
	$hashSource .= $rel . ':' . $stat['size'] . ':' . $stat['mtime'] . ';';
}
$version = substr(hash('sha256', $hashSource), 0, VERSION_HEX_LEN);

$prefix = $artistSlug . '--' . $albumSlug . '--';
$baseName = $prefix . $version . '.zip';
$finalPath = CACHE_DIR . '/' . $baseName;
$finalUrl = '/dl/cache/' . $baseName;
if (!isCachePath($finalPath)) {
	fail(500, 'internal path error');
}

if (isCacheFile($finalPath)) {
	header('X-Zip-Cache: hit');
	redirect($finalUrl, $version);
}
header('X-Zip-Cache: miss');

if (!is_dir(CACHE_DIR) && !mkdir(CACHE_DIR, 0755, true)) {
	fail(500, 'cannot create cache dir');
}

// Best-effort sweep of stale tmp files left by crashed/killed generations.
foreach (glob(CACHE_DIR . '/' . TMP_PREFIX . '*.zip') ?: [] as $tmpPath) {
	if (isCacheFile($tmpPath) && time() - (int) filemtime($tmpPath) > TMP_MAX_AGE) {
		unlink($tmpPath);
	}
}

$zipFolder = sanitizeFolderName(
	(string) ($artist['name'] ?? $artistSlug) . ' - ' . (string) ($album['name'] ?? $albumSlug)
);
$tmpPath = CACHE_DIR . '/' . TMP_PREFIX . uniqid('', true) . '.zip';
if (!isCachePath($tmpPath)) {
	fail(500, 'internal tmp path error');
}

$zip = new ZipArchive();
$openCode = $zip->open($tmpPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
if ($openCode !== true) {
	fail(500, 'could not open zip for writing (code ' . (string) $openCode . ')');
}
$zip->setArchiveComment('www.fauxfetus.net - ' . $zipFolder);
foreach ($relFiles as $rel) {
	$localName = $zipFolder . '/' . basename($rel);
	if (!$zip->addFile(AUDIO_DIR . '/' . $rel, $localName)) {
		$zip->close();
		if (isCacheFile($tmpPath)) {
			unlink($tmpPath);
		}
		fail(500, 'zip addFile failed: ' . $rel);
	}
	// MP3s are already compressed; STORE keeps build time at disk-copy speed.
	$zip->setCompressionName($localName, ZipArchive::CM_STORE);
}
if (!$zip->close()) {
	if (isCacheFile($tmpPath)) {
		unlink($tmpPath);
	}
	fail(500, 'zip streaming failed');
}

if (!rename($tmpPath, $finalPath)) {
	if (isCacheFile($tmpPath)) {
		unlink($tmpPath);
	}
	fail(500, 'zip publish failed');
}
chmod($finalPath, 0644);

// Prune superseded versions of THIS album only: paths must resolve inside
// cache/ and carry the exact hash-length hex suffix, so no other album's
// cache files (or anything else) can ever match this glob + regex pair.
$versionPattern = '~^' . preg_quote($prefix, '~') . '[0-9a-f]{' . VERSION_HEX_LEN . '}\.zip$~';
foreach (glob(CACHE_DIR . '/' . $prefix . '*.zip') ?: [] as $oldPath) {
	if ($oldPath !== $finalPath && isCacheFile($oldPath) && preg_match($versionPattern, basename($oldPath))) {
		unlink($oldPath);
	}
}

redirect($finalUrl, $version);
