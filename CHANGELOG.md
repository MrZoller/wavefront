# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project bootstrap: Vite + React + TypeScript + Tailwind v4 + Vitest.
- Repo scaffolding: `.gitignore`, MIT `LICENSE`, ESLint + Prettier + EditorConfig configs,
  CI workflow (`lint → format → test → build`).
- Design tokens for the dark "lab-instrument" aesthetic (`src/design/tokens.ts` + CSS vars).
- Module registry + track navigation shell (sidebar, track overview, module host) — all
  navigation composed from the registry.
- Shared viz library: DPR-aware `useCanvas` hook and a generic `TimeSeriesPlot`.
- Documentation set: `ARCHITECTURE.md`, `docs/README.md`, and the Direction Finding track page.
