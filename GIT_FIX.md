# GitHub `vite: Permission denied` repair

The failing repository has a non-executable or accidentally tracked `node_modules/.bin/vite` file.
Version 0.2.2 no longer executes that shim during CI. It imports Vite from Node through
`scripts/ci-build.mjs`, and `.gitignore` prevents dependencies from being committed again.

## Apply to an existing repository

Run these commands from the repository root:

```bash
rm -rf node_modules
git rm -r --cached node_modules 2>/dev/null || true
npm install
git add .gitignore package.json scripts/ci-build.mjs .github/workflows/ci.yml package-lock.json
git commit -m "Fix Vite permissions and CI install"
git push
```

On Windows PowerShell, use:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
git rm -r --cached node_modules
npm install
git add .gitignore package.json scripts/ci-build.mjs .github/workflows/ci.yml package-lock.json
git commit -m "Fix Vite permissions and CI install"
git push
```

If `git rm` reports that `node_modules` is not tracked, that is good; continue with the remaining commands.
