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
npm ci
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

## Shared controls

MODL pins Fragment Kit v0.3.4 as native modules. Render, Share and QR sit in the
toolbar. More holds source/diagram/help/split views, HashBin load/save, explicit
draft recovery, diagram backup files and offline repair/update. On phones Code
and Preview are tabs. Docs and Gallery are available in the header and More.
The gallery keeps the twelve original documentation gallery diagrams and their
positions; covers use MODL's original SVG renderer.

Share retains h1 links for older readers and includes manual-run and view options.
Existing bare source, compressed/doc links, CIDs and Publish returns still load.
New v1 links can be read; writers stay on h1 until the fleet reader rollout is complete.
Explicit links leave local drafts intact. Editing after opening a link archives prior
work for deliberate recovery. All new storage and cache names use the modl prefix.
HashBin saves require approval on HashBin; no app-origin credentials are retained.
Old public Publish transactions remain readable for this registered client.

The app's complete static ship list is hash-verified for offline use. Offline readiness
covers the local application and documentation, including their images. External image
nodes still need their original hosts. Repair verifies the current copy; Update and
reload activates a waiting verified version while preserving source and positions.

Development validation: npm test, npm run check, npm run docs, npm run gallery,
npm run offline. With a server on port 8012 run the shared contracts using
FRAGMENT_KIT_CONTRACT_CONFIG=testing-contract.config.mjs and the native Playwright
suite. tests/browser/deep-zoom.cjs independently checks the original geometry,
fractional positions and SVG raster export. Native parser and rendering blocks are
checked byte-for-byte against the recorded baseline, not regenerated by migration.

Ports (`a[err] -> b[3]`), nested brace groups, additional flowchart shapes,
double edges, layered layout and source display controls are described in
[Ports, groups and source views](docs/pipeline-features.html). The standalone
parser lives in `js/parse.js`; its source spans use UTF-16 column offsets.

## Embedding the renderer

`js/render.js` exports `renderDiagram(svg, model, options)` and `nodeScale`.
Parse with `parseSource` from `js/parse.js`, then pass positions, optional review
marks and viewport. The returned `viewportGroup` lets hosts update the camera.
Drag, pan and link callbacks belong to the host; `imageInfo` supplies cached
image dimensions. Rendering itself performs no storage, network or navigation.
The editor uses this same module, preserving native shapes and styling.
