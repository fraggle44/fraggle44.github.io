# The Excellent Internet

A public shelf of excellent keeps. Not a blog, and not an archive of every daily candidate.

Live site: [https://fraggle44.github.io](https://fraggle44.github.io)

The pages are static HTML built from YAML. Browsing works without JavaScript.

## Add a keep

Edit [`data/links.yml`](data/links.yml). That file is the source of truth. Only add a site after it has been actively agreed as a keep. Skips and sites that are only queued do not belong here — the note at the top of the file names the current exclusions.

```yaml
- id: short-id
  title: Display name
  url: https://example.com/
  kept_on: 2026-09-16
  category: spiritual
  blurb: One line on why it is kept.
  status: live
```

- `category` must be one of the ids in [`data/categories.yml`](data/categories.yml): `maps-place`, `spiritual`, `science-wonder`, `tools`, `weather-sky`, `travel-transit`, `other`.
- `status: live` is what gets published. Anything else is left off the shelf.
- `blurb` is the one line on the card, with the title, URL, category, and `kept_on`.
- To rename a drawer or change its order, edit `data/categories.yml`. An empty category still has a page.

## Local preview

Requires Node 20 or newer.

```bash
npm install
npm run serve
```

Open [http://localhost:8080](http://localhost:8080). Saving a YAML or template file rebuilds the pages.

```bash
npm run build
npm run check
```

`npm run build` writes `_site/`. `npm run check` confirms the seven seeded keeps, refuses known non-keeps, and checks that the built pages need no client script.

## Deploy

This repository is the GitHub user site `fraggle44.github.io`, so the published URL is the domain root, not a project path.

1. Merge to `main`.
2. The **Deploy GitHub Pages** workflow builds the site and deploys the `_site` artifact.
3. In the repository, **Settings → Pages → Build and deployment** must be **GitHub Actions**, not a branch.

No custom domain. No password. Analytics are not part of this site.

Fonts (Fraunces, Literata, DM Mono) are SIL Open Font License and are copied into the built site with their license texts.
