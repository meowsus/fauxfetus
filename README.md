# fauxfetus

An experimental music collective website created in service of a small, incestuous group of young artists located in the Northwestern suburbs of Philadelphia in the early 2000s.

This project has seen many iterations. It's current form is a static site generated entirely from MP3 metadata and served by Sveltekit.

[https://fauxfetus.net]

## Packages

- The [generator](./packages/generator/) package generates the site data from the MP3 files

## Deployment

### Generate data

If audio has been added or a mp3s metadata has been modified, run:

```
pnpm data:generate
```

### Release new version

You'll need to update the `CHANGELOG.md` before running

```
pnpm release [patch|minor|major]
```

### Deploy the build

Finally, deploy the build to push everything to the server

```
pnpm deploy:build
```
