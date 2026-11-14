# UAV360 articles

Original articles are stored in `content/articles/*.json`. Each published entry is rendered at `/articles/<slug>/` and added to the `/articles/` card listing and sitemap on every normal site build. They are separate from the automatically aggregated news and digest archive.

To publish a new article, add its JSON entry and a cover under `src/assets/articles/`. Use a unique lowercase hyphenated slug, a publication date in YYYY-MM-DD format, a title, description, category, period, cover path and alt text. Sections contain an optional heading and paragraphs with text and source numbers. Sources contain a label and HTTPS URL. Set status to `published` when ready; draft entries are excluded from the public build. Cards are ordered newest first.

Run `npm run build` with the normal public site configuration. The existing GitHub Pages workflow deploys pushes to main, including editorial content and cover assets. No extra database table, external image hotlink or publishing service is required.
