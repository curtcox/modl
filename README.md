# modl
Manual Override Diagram Language

Live: https://curtcox.github.io/modl/

`index.html` is a self-contained single-page diagram editor, originally developed as
[`diagram.html`](https://github.com/curtcox/SFWA/blob/main/diagram.html) in
[curtcox/SFWA](https://github.com/curtcox/SFWA). It is deployed to GitHub Pages by
`.github/workflows/deploy-pages.yml` on every push to `main`.

Diagrams can be saved to [HashBin](https://hashbin.org) (signing in with HashBin OAuth). A URL whose
fragment is a [256t](https://256t.org) string, such as `https://curtcox.github.io/modl/#<256t string>`,
loads that diagram from HashBin. The HashBin support is ported from
[`diagram-oauth.html`](https://github.com/curtcox/hashbin.org/blob/main/scripts/reports/pages/diagram-oauth.html)
in curtcox/hashbin.org. `CLIENT_ID` in `index.html` is the "Manual Override Diagram Language" app registered
at https://hashbin.org/developers with the redirect URI `https://curtcox.github.io/modl/`.
