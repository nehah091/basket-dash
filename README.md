# Basket Dash

A 60-second, timer-based catch game built with React + Vite.

## Live Demo

- URL: https://nehah091.github.io/basket-dash/
- Share this link with anyone; it runs entirely in the browser.

## How to Play

- Use `Left` and `Right` arrow keys to move the basket.
- Catch falling objects to increase your score.
- Play continues for 60 seconds. When time’s up, you’ll see your final score and a Replay button.

## Features

- Smooth basket movement tuned by difficulty (Easy, Medium, Hard).
- Varied falling objects (circles, squares, stars) with color themes.
- Non-blocking celebrations on score milestones.
- Timer-only gameplay (no lives) with a “Time Up” overlay and Replay.

## Local Development

```sh
npm install
npm run dev
```

- Open the local URL shown in the terminal (typically `http://localhost:5173`).
- Edit files under `src/` to iterate.

## Deploy (GitHub Pages)

- The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.
- On push to `main`, it builds and publishes automatically to GitHub Pages.
- Vite base path is set dynamically via `VITE_BASE` to ensure assets load under `/basket-dash/`.

## Troubleshooting

- If the page is blank, check the repo’s **Actions** tab for a failed workflow.
- Confirm repo **Settings → Pages → Build and deployment** is set to **GitHub Actions**.
- Re-run the latest deploy workflow if needed.

## License

- Personal project; feel free to play and share the live link.