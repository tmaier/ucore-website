# Local and CI gate.
[private]
default:
    @just --list

# Type-check, validate the image matrix, build, and check generated routes.
check:
    pnpm astro check
    pnpm validate:picker
    pnpm astro build
    pnpm check:site

dev:
    pnpm astro dev --host

preview:
    pnpm astro preview --host

fixture:
    ASTRO_OUT_DIR=./fixture-dist PICKER_FIXTURE=1 pnpm astro build
    node scripts/check-site.mjs --dir ./fixture-dist --fixture
