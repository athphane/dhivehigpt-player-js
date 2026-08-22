---
title: Requirements
sidebar_position: 1.1
---

The core player has **no runtime dependencies** — it works with a plain `<script>` tag or any bundler.

The optional framework wrappers require the matching framework as a peer dependency, only if you import that subpath:

- `@javaabu/dhivehigpt-player/react` requires [React 17+](https://react.dev/) and `react-dom`.
- `@javaabu/dhivehigpt-player/vue` requires [Vue 3+](https://vuejs.org/).

Neither is required (or installed) if you only use the core `@javaabu/dhivehigpt-player` entry point.
