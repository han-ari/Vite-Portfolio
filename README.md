# Week 8 Starter Kit — npm + Vite Portfolio

This is a working [Vite](https://vite.dev) project. The HTML and CSS are
already complete — your job is to fill in the three `src/` JavaScript
modules (look for 🔨 in each file) and move your real content into
`index.html`.

## 1. Install & run

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173/` URL. Leave this running while
you work — every file you save updates the browser instantly.

## 2. What to edit

| File | What to do |
|---|---|
| `index.html` | Replace the placeholder name/text with your real content. |
| `src/style.css` | Already complete — no changes needed. |
| `src/projects.js` | Your real projects array + `projectCard()` + `renderProjects()`. |
| `src/api.js` | Your Week 7 `fetchRepos()` + `repoCard()` — just add `export`. |
| `src/main.js` | Import from both files above, set `USERNAME`, write `initRepos()`. |

## 3. Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally so you can check it
```

`dist/` contains plain HTML/CSS/JS — no Vite required to run it. That's
what you deploy.

## 4. Deploy to GitHub Pages

1. Open `vite.config.js` and uncomment the `base` line, replacing
   `your-repo-name` with your actual GitHub repo name:
   ```js
   base: '/your-repo-name/',
   ```
   (Skip this step only if you're deploying to a custom domain instead
   of `username.github.io/repo-name/`.)
2. Run `npm run build` again.
3. Push the **contents of `dist/`** to a `gh-pages` branch — either by
   hand or with the [`gh-pages`](https://www.npmjs.com/package/gh-pages)
   npm package:
   ```bash
   npm install gh-pages --save-dev
   npx gh-pages -d dist
   ```
4. In your repo's Settings → Pages, set the source to the `gh-pages`
   branch.

## Common issues

- **Blank page on GitHub Pages, works locally** — almost always a
  missing or wrong `base` path in `vite.config.js`. Check it matches
  your repo name exactly, including capitalization.
- **`npm run dev` shows an import error** — check the file path and
  spelling in your `import` statement; it must match the real filename,
  including the `.js` extension.
- **Repos section shows "Could not load repositories"** — check that
  `USERNAME` in `src/main.js` is set to a real GitHub username, and that
  you haven't hit GitHub's 60 requests/hour unauthenticated rate limit.
