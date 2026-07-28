# Vite Portfolio 

## Week 8 - npm, ES Modules, and Vite

This portfolio was migrated from a static HTML/CSS/JS site into an npm + Vite project as part of Week 8. The JavaScript is now split into ES Modules: `src/api.js` handles the GitHub Repositories fetch logic 
(`fetchRepos()`, `repoCard()`); `src/projects.js` wires up the Projects section's category filter tabs (`initProjectFilters()`); `src/site.js` contains everything else - the wave animation, page-switching 
navigation, hero/nav alignment syncing, and the contact form -  each wrapped in its own exported init function; and `src/main.js` is wiring only, importing from the other three modules and calling their init 
functions on `DOMContentLoaded`, plus handling the repo-fetching flow with `try / catch / finally`. The site builds cleanly with `npm run build` and is deployed to GitHub Pages via the `gh-pages` branch.

## Development

```bash
npm install
npm run dev
```

## Build & Preview

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally to sanity-check before deploying
```

## Deploy

```bash
npm run build
npx gh-pages -d dist
```