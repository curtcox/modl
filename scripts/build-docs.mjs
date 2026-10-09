#!/usr/bin/env node
// Builds the documentation pages in docs/ from the templates in docs-src/.
//
//   node scripts/build-docs.mjs          write docs/*.html
//   node scripts/build-docs.mjs --check  exit 1 if docs/*.html is out of date
//
// Templates are HTML fragments with two extra elements:
//
//   <modl-example title="Optional caption" pos="a:120,200 b:360,200">
//   a -> b
//   </modl-example>
//
// becomes a highlighted source listing with an "Open in editor" link whose URL fragment carries the source
// (and optional node positions) in the editor's #h1= format. The content is raw modl source, not HTML.
//
//   <modl-link src="a -> b\nb red" pos="...">try it</modl-link>
//
// becomes an inline link to the editor. In src, \n is a line break and HTML entities are decoded.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "docs-src");
const OUT_DIR = join(ROOT, "docs");
const EDITOR = "../";

const PAGES = [
  { slug: "index", title: "Overview" },
  { slug: "structure", title: "Source structure" },
  { slug: "nodes", title: "Nodes" },
  { slug: "edges", title: "Edges" },
  { slug: "attributes", title: "Attributes" },
  { slug: "styles", title: "Sizes, shapes, lines & colors" },
  { slug: "links", title: "Links & image nodes" },
  { slug: "sharing", title: "Sharing & positions" },
  { slug: "gotchas", title: "Gotchas" },
  { slug: "reference", title: "Grammar reference" },
  { slug: "examples", title: "Example gallery" },
];

// Must match the reserved vocabulary in index.html
const NODE_SIZES = ["tiny", "small", "normal", "big", "bigger", "huge"];
const NODE_SHAPES = ["none", "circle", "square", "diamond", "triangle", "hex"];
const EDGE_STYLES = ["solid", "dashed", "dotted", "bold"];
const COLORS = {
  gray: "#9aa4b2", black: "#1f2937", white: "#f8fafc", red: "#ef4444", orange: "#f97316",
  yellow: "#eab308", green: "#22c55e", teal: "#14b8a6", blue: "#3b82f6", purple: "#a855f7",
  pink: "#ec4899", brown: "#92400e",
};

const isColor = (t) => Object.prototype.hasOwnProperty.call(COLORS, t);
const isValidId = (id) => /^[A-Za-z0-9_:\-]+$/.test(id);
const looksLikeUrl = (t) => t.startsWith("/") || t.startsWith("http://") || t.startsWith("https://")
  || t.startsWith("mailto:") || t.startsWith("www.");

function escapeHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function decodeEntities(s) {
  return s.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

// -----------------------------
// Editor links
// -----------------------------
function parsePos(spec) {
  const pos = {};
  if (!spec) return pos;
  for (const entry of spec.trim().split(/\s+/)) {
    const m = /^([A-Za-z0-9_:\-]+):(-?\d+),(-?\d+)$/.exec(entry);
    if (!m) throw new Error(`bad pos entry "${entry}"`);
    pos[m[1]] = [Number(m[2]), Number(m[3])];
  }
  return pos;
}

function editorHref(src, pos) {
  const json = JSON.stringify({ src, pos });
  return `${EDITOR}#h1=${Buffer.from(json, "utf8").toString("base64url")}`;
}

// A 256t string holding content of at most 64 bytes inline: 6 bytes of length, then the content, in base64url
function inlineCidHref(src) {
  const bytes = Buffer.from(src, "utf8");
  if (bytes.length > 64) throw new Error(`inline CID content is ${bytes.length} bytes; the limit is 64`);
  const length = Buffer.alloc(6);
  length.writeUIntBE(bytes.length, 0, 6);
  return `${EDITOR}#${length.toString("base64url")}${bytes.toString("base64url")}`;
}

// -----------------------------
// Highlighting: classifies tokens the same way parseSource in index.html does
// -----------------------------
function span(cls, text, style) {
  if (!text) return "";
  return `<span class="${cls}"${style ? ` style="${style}"` : ""}>${escapeHtml(text)}</span>`;
}

function colorSpan(cls, name) {
  return span(cls, name, `--c:${COLORS[name]}`);
}

// Splits into alternating whitespace / token pieces, keeping everything
function pieces(s) {
  return s.split(/(\s+)/).filter((p) => p !== "");
}

function highlightAttrs(text, kind) {
  let out = "";
  let slot = 0; // 0 size, 1 style, 2 color, 3 url, 4 text
  let inText = false;
  let textBuf = "";
  for (const p of pieces(text)) {
    if (/^\s+$/.test(p)) {
      if (inText) textBuf += p;
      else out += p;
      continue;
    }
    if (!inText) {
      if (slot <= 0 && NODE_SIZES.includes(p)) { out += span("m-size", p); slot = 1; continue; }
      const styles = kind === "node" ? NODE_SHAPES : EDGE_STYLES;
      if (slot <= 1 && styles.includes(p)) { out += span(kind === "node" ? "m-shape" : "m-line", p); slot = 2; continue; }
      if (slot <= 2 && isColor(p)) { out += colorSpan("m-color", p); slot = 3; continue; }
      if (slot <= 3 && looksLikeUrl(p)) { out += span("m-url", p); slot = 4; continue; }
      inText = true;
    }
    textBuf += p;
  }
  const trailing = /\s+$/.exec(textBuf)?.[0] || "";
  return out + span("m-text", textBuf.slice(0, textBuf.length - trailing.length)) + trailing;
}

function highlightId(tok) {
  return isValidId(tok) ? span("m-id", tok) : span("m-bad", tok);
}

function highlightCode(code) {
  if (!code.trim()) return code;
  if (isColor(code.trim())) {
    const lead = /^\s*/.exec(code)[0];
    const name = code.trim();
    return lead + colorSpan("m-bg", name) + code.slice(lead.length + name.length);
  }
  if (code.includes("->")) {
    const parts = code.split("->");
    // Empty segments are skipped, so attributes belong to the last non-empty one
    const lastIdx = parts.findLastIndex((seg) => seg.trim());
    let out = "";
    parts.forEach((seg, i) => {
      if (i > 0) out += span("m-arrow", "->");
      const ps = pieces(seg);
      let seenId = false;
      let rest = "";
      let idx = 0;
      for (; idx < ps.length; idx++) {
        const p = ps[idx];
        if (/^\s+$/.test(p)) { out += p; continue; }
        out += highlightId(p);
        seenId = true;
        idx++;
        break;
      }
      rest = ps.slice(idx).join("");
      if (!seenId) return;
      if (i === lastIdx) out += highlightAttrs(rest, "edge");
      else {
        const lead = /^\s*/.exec(rest)[0];
        const trail = /\s*$/.exec(rest.slice(lead.length))[0];
        out += lead + span("m-ignored", rest.slice(lead.length, rest.length - trail.length)) + trail;
      }
    });
    return out;
  }
  const lead = /^\s*/.exec(code)[0];
  const body = code.slice(lead.length);
  const m = /^(\S+)([\s\S]*)$/.exec(body);
  return lead + highlightId(m[1]) + highlightAttrs(m[2], "node");
}

function highlightLine(raw) {
  if (raw.trim().startsWith("#")) return span("m-comment", raw);
  const idx = raw.search(/\s#/);
  if (idx >= 0) {
    const ws = /^\s+/.exec(raw.slice(idx))[0];
    return highlightCode(raw.slice(0, idx)) + ws + span("m-comment", raw.slice(idx + ws.length));
  }
  return highlightCode(raw);
}

function highlight(src) {
  return src.replace(/\n$/, "").split("\n").map(highlightLine).join("\n");
}

// -----------------------------
// Templates
// -----------------------------
function dedent(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)[0].length));
  return lines.map((l) => l.slice(indent)).join("\n") + "\n";
}

function attrs(s) {
  const out = {};
  for (const m of s.matchAll(/([a-z-]+)(?:="([^"]*)")?/g)) out[m[1]] = m[2] === undefined ? "" : decodeEntities(m[2]);
  return out;
}

let exampleCount = 0;

function renderExample(attrText, body) {
  const a = attrs(attrText);
  const src = dedent(body);
  const href = editorHref(src, parsePos(a.pos));
  exampleCount++;
  const caption = a.title ? `<figcaption>${escapeHtml(a.title)}</figcaption>` : "";
  return `<figure class="example">
${caption}<pre class="modl"><code>${highlight(src)}</code></pre>
<a class="open" href="${escapeHtml(href)}">Open in editor</a>
</figure>`;
}

function renderLink(attrText, body) {
  const a = attrs(attrText);
  const src = a.src.replaceAll("\\n", "\n");
  const href = ("inline" in a) ? inlineCidHref(src) : editorHref(src + "\n", parsePos(a.pos));
  exampleCount++;
  return `<a class="try" href="${escapeHtml(href)}">${body}</a>`;
}

// Attribute values may contain ">" (as in src="a -> b"), so tags are matched attribute by attribute
const ATTRS = String.raw`((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*`;

function expand(template) {
  return template
    .replace(new RegExp(`<modl-example${ATTRS}>([\\s\\S]*?)</modl-example>`, "g"), (_, a, body) => renderExample(a, body))
    .replace(new RegExp(`<modl-link${ATTRS}>([\\s\\S]*?)</modl-link>`, "g"), (_, a, body) => renderLink(a, body));
}

function nav(current) {
  return PAGES.map((p) => {
    const cls = p.slug === current ? ' class="current" aria-current="page"' : "";
    return `      <li><a href="${p.slug}.html"${cls}>${escapeHtml(p.title)}</a></li>`;
  }).join("\n");
}

function pager(i) {
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  return `<nav class="pager">
      ${prev ? `<a class="prev" href="${prev.slug}.html">← ${escapeHtml(prev.title)}</a>` : "<span></span>"}
      ${next ? `<a class="next" href="${next.slug}.html">${escapeHtml(next.title)} →</a>` : "<span></span>"}
    </nav>`;
}

function page(p, i, body) {
  const title = p.slug === "index" ? "modl documentation" : `${p.title} · modl documentation`;
  return `<!doctype html>
<!-- Generated by scripts/build-docs.mjs from docs-src/${p.slug}.html. Edit the template, not this file. -->
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="docs.css" />
</head>
<body>
<header class="top">
  <a class="brand" href="index.html">modl <span>Manual Override Diagram Language</span></a>
  <a class="btn" href="${EDITOR}">Open the editor</a>
</header>
<div class="layout">
  <nav class="side" aria-label="Documentation">
    <ol>
${nav(p.slug)}
    </ol>
  </nav>
  <main>
${body.trim()}
    ${pager(i)}
  </main>
</div>
</body>
</html>
`;
}

function build() {
  const outputs = new Map();
  const known = new Set(PAGES.map((p) => `${p.slug}.html`));
  for (const f of readdirSync(SRC_DIR)) {
    if (f.endsWith(".html") && !known.has(f)) throw new Error(`docs-src/${f} isn't listed in PAGES`);
  }
  PAGES.forEach((p, i) => {
    const template = readFileSync(join(SRC_DIR, `${p.slug}.html`), "utf8");
    outputs.set(join(OUT_DIR, `${p.slug}.html`), page(p, i, expand(template)));
  });
  return outputs;
}

const outputs = build();
if (process.argv.includes("--check")) {
  const stale = [...outputs].filter(([file, html]) => {
    try { return readFileSync(file, "utf8") !== html; } catch { return true; }
  }).map(([file]) => file);
  if (stale.length) {
    console.error(`Out of date (run node scripts/build-docs.mjs):\n${stale.join("\n")}`);
    process.exit(1);
  }
  console.log(`docs/ is up to date (${outputs.size} pages, ${exampleCount} example links)`);
} else {
  for (const [file, html] of outputs) writeFileSync(file, html);
  console.log(`Wrote ${outputs.size} pages with ${exampleCount} example links`);
}
