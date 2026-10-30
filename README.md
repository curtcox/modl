# modl
Manual Override Diagram Language

Live: https://curtcox.github.io/modl/

`index.html` is a self-contained single-page diagram editor, originally developed as
[`diagram.html`](https://github.com/curtcox/SFWA/blob/main/diagram.html) in
[curtcox/SFWA](https://github.com/curtcox/SFWA). It is deployed to GitHub Pages by
`.github/workflows/deploy-pages.yml` on every push to `main`.

Language documentation: https://curtcox.github.io/modl/docs/

The pages in `docs/` are generated from the templates in `docs-src/` by `node scripts/build-docs.mjs`, which turns each
`<modl-example>` block into a highlighted listing with an "Open in editor" link carrying the source in a `#h1=` URL.
Edit the templates, run the script, and commit both; the deploy workflow fails if `docs/` is out of date.

Diagrams can be saved to [HashBin](https://hashbin.org). Each save is approved on hashbin.org through HashBin Publish,
so this page never holds a HashBin credential. A URL whose
fragment is a [256t](https://256t.org) string, such as `https://curtcox.github.io/modl/#<256t string>`,
loads that diagram from HashBin. The HashBin support is ported from
[`diagram-oauth.html`](https://github.com/curtcox/hashbin.org/blob/main/scripts/reports/pages/diagram-oauth.html)
in curtcox/hashbin.org. `CLIENT_ID` in `index.html` is the "Manual Override Diagram Language" app registered
at https://hashbin.org/developers with the redirect URI `https://curtcox.github.io/modl/`.


## Deep zoom

The editor supports **0.001×–1000×** zoom. Use the wheel to zoom under the cursor,
left-drag the background to pan, or middle-drag anywhere to pan when a node fills
the canvas. The −/+ buttons zoom around the view center; **Reset view** returns to
1×. Node dragging keeps fractional positions in saved links. Decorative shadows
are suppressed below 0.1× and above 8× to keep high-zoom dragging responsive.

This is a bounded prototype. Tiny nodes become subpixel at minimum zoom, large
coordinate origins need rebasing, and dense diagrams still rebuild the full SVG.
See the [investigation and measurements](https://github.com/curtcox/ManimOnline/blob/main/docs/modl-deep-zoom.md).

To verify locally:

```sh
node scripts/build-docs.mjs --check
npm install --no-save playwright
npx playwright install chromium firefox webkit
python3 -m http.server 8001
# In a second terminal:
node tests/browser/deep-zoom.cjs http://localhost:8001/ chromium firefox webkit
```

The browser test also accepts the deployed editor URL. It checks the zoom limits,
cursor anchor, high-zoom fractional dragging, middle-button panning, SVG
serialization/rasterization, reset/buttons and position persistence through a
reload. HashBin requests are blocked; it does not sign in or spend account funds.
Normal nodes at 0.001× are too small for reliable native mouse targeting; zoom in
to edit them. Playwright Firefox may fail to launch on recent macOS with
"Could not find profile folder"; CI runs all three engines on Ubuntu.

## Canonical HashBin address

The production app is [https://modl.hashbin.page/](https://modl.hashbin.page/). The GitHub Pages copy is kept for moving old drafts through **Move saved work** or **Download backup**. Transfers copy only this app's documents and public settings, keep the old copy, and never copy HashBin credentials or Python filesystem permissions. Deployment is managed by [HashBin's first-party deployment tool](https://github.com/curtcox/hashbin.org/blob/main/scripts/deploy-owned-apps.mjs).
