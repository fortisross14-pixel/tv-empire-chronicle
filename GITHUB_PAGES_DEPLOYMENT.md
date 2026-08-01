# GitHub Pages deployment

This project deploys the compiled `dist` directory through `.github/workflows/pages.yml`.

## One-time repository setting

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` or `master`, or run the workflow manually from **Actions**.
5. Open the completed workflow's **deploy** job to see the published URL.

## Why the previous workflow returned 404

The old workflow only ran the build test. It never uploaded `dist` as a Pages artifact and never invoked the Pages deployment action. A successful green build therefore created no website.

The Vite configuration now also uses `base: './'`, so generated JavaScript and CSS paths work when the site is hosted below a repository path such as `/tv-empire-chronicle/`.
