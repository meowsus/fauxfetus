import type { Track } from '@fauxfetus/generator';
import { createContext } from 'svelte';
import type { Writable } from 'svelte/store';

export type PlayerState = {
	isLoading: boolean;
	isPlaying: boolean;
	isRadio: boolean;

	allTracks: Track[];
	playlist: Track[];

	currentTrackIndex: number | null;

	// Progress state, synced from Gapless5 via callbacks
	position: number; // current playback position in ms
	duration: number; // current track total duration in ms
};

/**
 * Imperative actions that bridge the Svelte UI with the Gapless5 audio engine.
 * Initialized with no-op defaults in the layout; replaced with real
 * Gapless5-bound actions once the Player component creates the engine on mount.
 */
export type PlayerActions = {
	/** Replace playlist with new tracks and start from the given index. */
	loadPlaylist: (tracks: Track[], startIndex: number, options?: { isRadio?: boolean }) => void;

	play: () => void;
	pause: () => void;
	togglePlay: () => void;
	prev: () => void;
	next: () => void;
};

/** No-op defaults so components can safely call actions before Gapless5 initializes. */
export const defaultPlayerActions: PlayerActions = {
	loadPlaylist: () => {},
	play: () => {},
	pause: () => {},
	togglePlay: () => {},
	prev: () => {},
	next: () => {}
};

export const [getPlayerContext, setPlayerContext] = createContext<Writable<PlayerState>>();
export const [getPlayerActions, setPlayerActions] = createContext<Writable<PlayerActions>>();
