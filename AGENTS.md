# MODL

Buildless native ES modules; Node 22.12+ for development tools. No production bundler.
The original DSL parser, layout, SVG renderer, zoom, drag and pan code is app-owned.
scripts/check.mjs verifies those blocks and vocabulary against engine-integrity.json.
Preserve fractional positions, h1 links, untyped legacy envelopes and native SVG export.

Shared URL, Publish, QR, drafts, mobile and offline contracts:
vendor/fragment-kit-v0.4.3/docs/contracts.md. Explicit links win over drafts.
Bound inputs before decoding, verify CIDs and reject stale asynchronous loads.
Publish must enter synchronously from the confirm click after SDK initialization.
Keep credentials on HashBin; prefix all storage and caches. Do not edit pinned vendor bytes.
docs-src is authoritative; regenerate docs with npm run docs.
scripts/public-assets.mjs is the complete deployment allowlist; exclude tools/tests.
Run npm test, npm run check, shared contracts and native browser tests after runtime changes.
Report the browsers that actually ran. Never move release tags.
Canonical deployment belongs to hashbin.org; status must reflect actual remote state.
