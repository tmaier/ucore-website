# Project guidance

- Treat `prototype/` as a local design reference only; do not add it to Git. The Substrate handoff in `prototype/` (README, `tokens.css`, and `reference/*.dc.html`) is the visual and interaction authority.
- Keep the site static and use Starlight only for documentation under `/docs/`.
- `src/data/picker.json` is the single source of published picker combinations. Keep full image references explicit and validate changes with `just check`.
- Preserve prototype route slugs and heading IDs. Keep technical commands tied to the upstream sources noted in the page content.
- Use the existing Astro shell and CSS tokens; avoid adding a component framework or utility CSS framework.
- Keep Cloudflare Pages settings in the hosting project unless they are build inputs required by this repository.
