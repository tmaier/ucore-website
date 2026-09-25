# projectucore.org

The uCore project website, built as a static Astro site with Starlight documentation at `/docs/`.

The local `prototype/` directory contains the Substrate design handoff and is the visual authority. It is gitignored.

## Requirements

- Node.js 22 or newer
- pnpm 11.24.0
- Just

## Development

```sh
pnpm install --frozen-lockfile
just dev
```

Run the same checks as CI and generate the production site with:

```sh
just check
```

Pagefind's index is generated during the production build. After `just check`, run `just preview` to try the built-site search locally.

To verify the image picker supports a smaller fixture manifest:

```sh
just fixture
```

The production build is static output in `dist/`. Cloudflare Pages uses `pnpm install --frozen-lockfile && pnpm build` with `dist` as the output directory and Node.js 22.

## Content sources

The image picker is maintained in `src/data/picker.json`. Its 27 full image references were checked against the uCore README and workflow at revision `75ec7d8d10bc8af6fe23a284ea108bacd50f3173` on September 18, 2026. The Butane auto-rebase example is copied from the same revision. Announcement publication dates and original source links are retained in the content collection; docs pages record their source and review date.

The site adapts documentation from [ublue-os/ucore](https://github.com/ublue-os/ucore), licensed under Apache-2.0. The upstream project README remains the current source for build and release details; site content should be refreshed deliberately when that source changes.

## Hosting

Cloudflare Pages is configured through project settings and Git integration. Set the custom domain to `projectucore.org`; hostname redirects, if needed, are managed there. The site canonical origin is `https://projectucore.org`.
