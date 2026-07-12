# fauxfetus

An experimental music collective website created in service of a small, incestuous group of young artists located in the Northwestern suburbs of Philadelphia in the early 2000s.

This project has seen many iterations. It's current form is a static site generated entirely from MP3 metadata and served by Sveltekit.

[https://fauxfetus.net]

## Packages

- The [generator](./packages/data-generator/) package generates the site data from the MP3 files

## Development

### Server

The development server runs with

```
pnpm dev
```

Or you can build, and run a preview server with

```
pnpm preview
```

Or, you can build, run the preview server, and open it to your local network with

```
pnpm preview:local
```

### Data generation

If you change any audio, ensure you regenerate the data files with

```
pnpm generate:data
```

### Code guardrails

Run code checks with

```
pnpm check
```

And lint with

```
pnpm lint
```

Format the entire codebase with

```
pnpm format
```

## Deployment

### Deploy the build

Deploy the build to push everything to the server

```
pnpm deploy:build
```

### Release new version

You'll need to update the `CHANGELOG.md` before running

```
pnpm bump [patch|minor|major]
```
