# Salyra UI / theme-studio

Components in harmony with your stack.

## Install

`npm install @salyra-ui/theme-studio`

Choose a framework entry: `@salyra-ui/theme-studio/svelte`, `/react`, `/vue`, `/angular`, `/astro` or `/vanilla`. The package root exports framework-independent helpers. Framework peers are optional. Import `@salyra-ui/theme-studio/styles.min.css` once for the default styles.

Each npm package contains built runtime files, declarations, compact framework compiler inputs and CSS under dist, with no sourcemaps. Vanilla includes standard and minified JS/CSS variants. Theme studio depends on color picker.

## Development

Use Node 22.19 or newer. Run `npm ci`, `npm test`, `npm run check`, `npm run check:docs`, `npm run test:ssr`, `npm run pack:all`, `npm run check:release` and `npm run build:site`.

This repository contains only theme-studio. The other Salyra UI package is installed from npm for shared documentation and integration checks.

[Documentation](https://salyra-ui.github.io/theme-studio/docs.html?kit=theme-studio) · [Examples](https://salyra-ui.github.io/theme-studio/generator.html)

[Package API and migration](packages/theme-studio/README.md)
