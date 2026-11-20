# Project website (GitHub Pages)

Static, no build step, no external requests (system fonts, local images). English at `/`, Italian at `/it/`.

- Publish: the workflow `.github/workflows/pages.yml` deploys this folder on every push to `main` that touches `website/`. In the repository settings choose **Pages → Source: GitHub Actions**.
- Custom domain: add it in Pages settings and a `CNAME` file here once the domain is bought ([../docs/project_management/decisions/EMAIL_HOSTING_DOMAIN.md](../docs/project_management/decisions/EMAIL_HOSTING_DOMAIN.md)).
- Screenshots: `node scripts/e2e.js <dir>` regenerates them from demo data; copy and shrink the ones you want into `assets/`.
- Edit the text in both `index.html` files; keep claims in line with [../docs/project_management/STATUS.md](../docs/project_management/STATUS.md).
