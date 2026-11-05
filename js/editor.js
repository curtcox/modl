import{config,type,fromDocument,serializeLegacy,encodeState,urlState,documents,HashBinStore}from'./fragment-config.js';
import{LocalDrafts,createStorage,HashBinPanel,createShell,mountMobileTabs,createShareDialog,createQrDialog,OfflineClient}from'../vendor/fragment-kit-v0.3.4/src/index.js';
function optionalStorage(kind){try{return globalThis[kind];}catch{return undefined;}}
function localOverride(name,fallback){const value=new URL(location.href).searchParams.get(name);try{const url=new URL(value);if(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))return url.origin;}catch{}return fallback;}
const API_BASE=localOverride('api','https://hashbin.org'),CONTENT_BASE=localOverride('content','https://256t.us'),IS_LOCAL_API=API_BASE!=='https://hashbin.org';
const clientId=IS_LOCAL_API?new URL(location.href).searchParams.get('client_id')||config.hashbinClientId:config.hashbinClientId;
const callback=new URL(location.href);callback.hash='';callback.pathname=callback.pathname.replace(/index\.html$/,'');for(const key of [...callback.searchParams.keys()])if(!IS_LOCAL_API||!['api','content','client_id'].includes(key))callback.searchParams.delete(key);
const store=new HashBinStore({clientId,redirectUri:callback.href,legacyStorage:optionalStorage('localStorage'),apiBase:API_BASE,contentBase:CONTENT_BASE,...IS_LOCAL_API?{loadSDK:()=>import(API_BASE+'/sdk/v0.4.0/hashbin.js'),fetchSource:(url,options)=>fetch(url.replace('https://256t.us/',CONTENT_BASE+'/'),options)}:{}});
(async()=>{
 const originalHeader=document.querySelector('.topbar');
 const shell=createShell({config,container:document.querySelector('.app')});
 const renderButton=document.createElement('button');renderButton.id='render';renderButton.textContent='Render';
 const shareButton=document.getElementById('btnCopy'),qrButton=document.getElementById('btnQr');shareButton.textContent='Share';qrButton.textContent='QR';
 shell.toolbar.append(renderButton,shareButton,qrButton);
 for(const id of ['btnViewSource','btnViewDiagram','btnViewHelp','btnViewSplit','btnCommit','btnReset'])shell.drawer.body.append(document.getElementById(id));
 shell.status.append(originalHeader.querySelector('.status'));originalHeader.remove();
 document.getElementById('saveDialog').remove();document.getElementById('qrDialog').remove();
 shell.header.querySelector('.fk-more').id='more-toggle';
 const drafts=new LocalDrafts({storage:createStorage({prefix:config.storagePrefix}),key:'draft',serialize:value=>JSON.stringify(fromDocument(value)),parse:text=>type.normalize(JSON.parse(text))});
 let initialized=false,autoRun=true,viewMode='split',mobileTabs,navigationRevision=0,lastNavigation,qrSave=false,gestureFingerprint;

  // -----------------------------
  // Reserved vocab
  // -----------------------------
  const NODE_SIZES = ["tiny", "small", "normal", "big", "bigger", "huge"];
  const NODE_SHAPES = ["none", "circle", "square", "diamond", "triangle", "hex"];
  const EDGE_STYLES = ["solid", "dashed", "dotted", "bold"];

  const COLORS = {
    gray:   "#9aa4b2",
    black:  "#1f2937",
    white:  "#f8fafc",
    red:    "#ef4444",
    orange: "#f97316",
    yellow: "#eab308",
    green:  "#22c55e",
    teal:   "#14b8a6",
    blue:   "#3b82f6",
    purple: "#a855f7",
    pink:   "#ec4899",
    brown:  "#92400e",
  };

  // -----------------------------
  // UI wiring
  // -----------------------------
  const $src = document.getElementById("src");
  const $svg = document.getElementById("svg");
  const $parseStatus = document.getElementById("parseStatus");
  const $hashStatus = document.getElementById("hashStatus");
  const $errorBox = document.getElementById("errorBox");
  const $savedState = document.getElementById("savedState");
  const $svgWrap = document.querySelector(".svgWrap");
  const $btnZoomOut = document.getElementById("btnZoomOut");
  const $btnZoomIn = document.getElementById("btnZoomIn");

  const $app = document.querySelector(".app");
  const $btnViewSource = document.getElementById("btnViewSource");
  const $btnViewDiagram = document.getElementById("btnViewDiagram");
  const $btnViewHelp = document.getElementById("btnViewHelp");
  const $btnViewSplit = document.getElementById("btnViewSplit");

  const $shapeList = document.getElementById("shapeList");
  const $sizeList = document.getElementById("sizeList");
  const $colorList = document.getElementById("colorList");
  const $lineStyleList = document.getElementById("lineStyleList");

  function fillList(ul, items, renderItem) {
    ul.innerHTML = "";
    for (const it of items) {
      const li = document.createElement("li");
      if (renderItem) renderItem(li, it);
      else li.textContent = it;
      ul.appendChild(li);
    }
  }

  function mkSwatch() {
    const s = document.createElement("span");
    s.className = "swatch";
    return s;
  }

  function setSvg(el, svg) {
    el.innerHTML = svg;
  }

  function shapeSvg(shape, stroke) {
    const s = stroke || "rgba(232,237,243,0.9)";
    const f = "rgba(232,237,243,0.15)";
    if (shape === "none") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><text x="12" y="9" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="10" font-weight="800" fill="${s}">Aa</text></svg>`;
    }
    if (shape === "circle") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="6" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
    }
    if (shape === "square") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2" width="12" height="12" rx="3" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
    }
    if (shape === "diamond") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><polygon points="12,1 21,8 12,15 3,8" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
    }
    if (shape === "triangle") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><polygon points="12,1 21,15 3,15" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
    }
    if (shape === "hex") {
      return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><polygon points="7,1 17,1 22,8 17,15 7,15 2,8" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
    }
    return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="6" fill="${f}" stroke="${s}" stroke-width="2"/></svg>`;
  }

  function lineSvg(style, stroke) {
    const s = stroke || "rgba(232,237,243,0.9)";
    const dash = (style === "dashed") ? "7 5" : (style === "dotted") ? "2 5" : "";
    const w = (style === "bold") ? 3.5 : 2.2;
    return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="22" y2="8" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${dash}"/></svg>`;
  }

  fillList($shapeList, NODE_SHAPES, (li, shape) => {
    li.className = "sample";
    const sw = mkSwatch();
    setSvg(sw, shapeSvg(shape));
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = shape;
    li.appendChild(sw);
    li.appendChild(label);
  });

  fillList($sizeList, NODE_SIZES, (li, size) => {
    li.className = "sample";
    const sw = mkSwatch();
    const sc = nodeScale(size);
    const max = nodeScale("huge") || 1;
    const nsc = Math.max(0.06, Math.min(1, sc / max));
    const fontSize = 2.5 + 10.5 * nsc;
    setSvg(sw, `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><text x="12" y="9" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="${fontSize}" font-weight="800" fill="rgba(232,237,243,0.9)">A</text></svg>`);
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = size;
    li.appendChild(sw);
    li.appendChild(label);
  });

  fillList($lineStyleList, EDGE_STYLES, (li, style) => {
    li.className = "sample";
    const sw = mkSwatch();
    setSvg(sw, lineSvg(style));
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = style;
    li.appendChild(sw);
    li.appendChild(label);
  });

  fillList($colorList, Object.keys(COLORS), (li, name) => {
    li.className = "sample";
    const sw = document.createElement("span");
    sw.className = "swatch color";
    sw.style.background = COLORS[name];
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = name;
    li.appendChild(sw);
    li.appendChild(label);
  });

  function setViewMode(mode,persist=false) {
    mode=['source','diagram','help'].includes(mode)?mode:'split';viewMode=mode;
    $app.classList.remove("mode-source", "mode-diagram", "mode-help");
    if (mode === "source") $app.classList.add("mode-source");
    if (mode === "diagram") $app.classList.add("mode-diagram");
    if (mode === "help") $app.classList.add("mode-help");

    const is = (m) => mode === m;
    $btnViewSource.classList.toggle("active", is("source"));
    $btnViewDiagram.classList.toggle("active", is("diagram"));
    $btnViewHelp.classList.toggle("active", is("help"));
    $btnViewSplit.classList.toggle("active", is("split"));

    $btnViewSource.setAttribute("aria-pressed", String(is("source")));
    $btnViewDiagram.setAttribute("aria-pressed", String(is("diagram")));
    $btnViewHelp.setAttribute("aria-pressed", String(is("help")));
    $btnViewSplit.setAttribute("aria-pressed", String(is("split")));
    mobileTabs?.select(mode==='diagram'?1:0);
    if(persist&&initialized){drafts.attempt(snapshotState(),true);syncHash();shell.drawer.dialog.close();}
  }

  $btnViewSource.addEventListener("click", () => setViewMode("source",true));
  $btnViewDiagram.addEventListener("click", () => setViewMode("diagram",true));
  $btnViewHelp.addEventListener("click", () => setViewMode("help",true));
  $btnViewSplit.addEventListener("click", () => setViewMode("split",true));

  setViewMode("split",true);

  let saved=null;
  const savePayload=serializeLegacy;
  const cidFromHash=hash=>store.cid(hash);
  const stateFromContent=documents.parse;
  function showLoadError(message){$errorBox.classList.add('show');$errorBox.textContent=message;$parseStatus.textContent='Load failed';$parseStatus.className='err';panel.status.textContent=message;}
  function snapshotState({flush=false}={}){
   if(flush)clearTimeout(parseTimer);
   if(flush&&autoRun&&state.src!==$src.value){state=fromDocument(type.normalize({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode}));renderAll();}
   return fromDocument(type.normalize({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode}));
  }
  const fingerprint=()=>JSON.stringify({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode});
  function updateSavedState(){
   $savedState.textContent='Not saved';$savedState.className='savedState';if(!saved)return;
   let dirty=true;try{dirty=savePayload(snapshotState())!==saved.payload;}catch{}
   const link=document.createElement('a');link.href=CONTENT_BASE+'/'+saved.cid;link.target='_blank';link.rel='noopener noreferrer';link.textContent=saved.cid.slice(0,8)+'…'+saved.cid.slice(-6);link.title=saved.cid;
   $savedState.className=dirty?'savedState dirty':'savedState';$savedState.replaceChildren(document.createTextNode(dirty?'Unsaved changes since ':'Saved as '),link);
  }
  function updateHashStatus(){$hashStatus.textContent='hash: '+location.hash.length+' chars';}
  function syncHash({replace=true}={}){
   try{
    const snapshot=snapshotState(),payload=savePayload(snapshot);
    if(gestureFingerprint&&payload!==gestureFingerprint)drafts.attempt(snapshot,true);else drafts.attempt(snapshot);
    let href=urlState.build(snapshot,{url:location.href,run:autoRun,view:viewMode==='split'?undefined:viewMode}).href;
    if(saved&&payload===saved.payload)href=urlState.link(href,saved.cid);
    if(replace)history.replaceState(null,'',href);else history.pushState(null,'',href);
    lastNavigation=location.href;updateHashStatus();updateSavedState();
   }catch(error){showLoadError(error.message);}
  }
  function cancelInteractions(){
   clearTimeout(parseTimer);clearTimeout(dragHashTimer);if(dragRaf){cancelAnimationFrame(dragRaf);dragRaf=0;}
   const pointer=dragging?.pointerId??panning?.pointerId;dragging=null;panning=null;gestureFingerprint=null;
   if(pointer!==undefined)try{$svg.releasePointerCapture(pointer);}catch{}$svgWrap.classList.remove('panning');
  }
  function applyDocument(value,cid=null,options={}){
   const doc=type.normalize(value);autoRun=options.run??doc.modl.autorun;
   setViewMode(options.view??doc.modl.view);
   applyState(fromDocument(doc),{fromHash:true});
   if(autoRun)renderAll();else{$svg.replaceChildren();diagram=null;$parseStatus.textContent='Press Render';}
   saved=cid?{cid,payload:savePayload(snapshotState())}:null;updateSavedState();
  }
  const pendingOptions=new Map();
  const panel=new HashBinPanel({store,urlState,container:shell.drawer.body,getSnapshot:()=>snapshotState({flush:true}),getFingerprint:fingerprint,
   onLoad:(doc,cid)=>{drafts.opened();cancelInteractions();applyDocument(doc,cid,pendingOptions.get(cid));syncHash();shell.drawer.dialog.close();},
   onSaved:cid=>{saved={cid,payload:savePayload(snapshotState())};syncHash({replace:false});if(qrSave){qrSave=false;panel.dialog.close();qr.open(urlState.link(location.href,cid));}}
  });
  panel.dialog.addEventListener('close',()=>{qrSave=false;});
  const load=panel.load.bind(panel);panel.load=input=>{input=input.trim();navigationRevision++;cancelInteractions();const cid=store.cid(input),options={};try{const url=new URL(input);if(url.searchParams.has('run'))options.run=url.searchParams.get('run')!=='0';if(url.searchParams.has('view'))options.view=url.searchParams.get('view');}catch{}if(cid)pendingOptions.set(cid,options);return load(input);};
  const share=createShareDialog({urlState,getSnapshot:()=>snapshotState({flush:true}),onSave:()=>panel.openSave()});
  shareButton.onclick=()=>{try{share.open();document.getElementById('share-run').checked=autoRun;document.getElementById('share-run').dispatchEvent(new Event('change'));}catch(error){showLoadError(error.message);}};
  const qr=createQrDialog({config,urlState,onLoad:outcome=>{const incoming=new URL(outcome.kind==='cid'?urlState.link(location.href,outcome.cid):outcome.href),url=new URL(location.href);url.search=incoming.search;url.hash=incoming.hash;history.pushState(null,'',url);return openURL(url.href);},onSave:()=>{qrSave=true;qr.dialog.close();return panel.openSave();}});
  qrButton.onclick=()=>{try{qr.open(urlState.build(snapshotState({flush:true}),{run:autoRun,view:viewMode==='split'?undefined:viewMode}).href);}catch(error){showLoadError(error.message);}};
  renderButton.onclick=()=>{try{state=fromDocument(type.normalize({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode}));renderAll();syncHash();}catch(error){showLoadError(error.message);}};
  document.getElementById('btnReset').onclick=()=>{navigationRevision++;panel.cancelLoad();cancelInteractions();drafts.opened();autoRun=true;setViewMode('split');saved=null;applyState(makeDefaultState());renderAll();drafts.attempt(snapshotState(),true);syncHash();shell.drawer.dialog.close();};
  document.getElementById('btnCommit').onclick=()=>{drafts.attempt(snapshotState({flush:true}),true);syncHash({replace:false});shell.drawer.dialog.close();};
  drafts.mount(shell.drawer.body,doc=>{navigationRevision++;panel.cancelLoad();cancelInteractions();applyDocument(doc);syncHash();},doc=>doc.src);
  const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const backup=document.createElement('button');backup.textContent='Download diagram';backup.onclick=()=>{try{download(new Blob([savePayload(snapshotState({flush:true}))],{type:'application/json'}),'diagram.json');}catch(error){showLoadError(error.message);}};shell.drawer.body.append(backup);
  const fileLabel=document.createElement('label'),file=document.createElement('input');fileLabel.textContent='Open diagram file';file.type='file';file.accept='.json,.modl,.txt';file.setAttribute('aria-label','Open diagram file');fileLabel.append(file);shell.drawer.body.append(fileLabel);
  file.onchange=async()=>{const selected=file.files[0];file.value='';if(!selected)return;const revision=++navigationRevision;panel.cancelLoad();cancelInteractions();try{if(selected.size>config.maxBytes)throw Error('Diagram file exceeds 5 MiB.');const data=await selected.slice(0,config.maxBytes+1).arrayBuffer();if(revision!==navigationRevision)return;const value=documents.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));drafts.opened();applyDocument(value);syncHash();shell.drawer.dialog.close();}catch(error){if(revision===navigationRevision)showLoadError(error.message);}};
  mobileTabs=mountMobileTabs({container:shell.toolbar,panels:[{label:'Code',panel:document.querySelector('.left')},{label:'Preview',panel:document.querySelector('.right')}],onChange:index=>{if(initialized&&autoRun&&index===1&&matchMedia('(max-width:767px)').matches)requestAnimationFrame(renderAll);}});

  // -----------------------------
  // Parsing DSL
  // -----------------------------
  // Splits a line into pieces: {type: "ws" | "arrow" | "comment", raw} and {type: "word", raw, value, quoted}.
  // A quote opens a string only at the start of a word or right after a closing quote, and only if the same
  // quote character closes it later on the line; otherwise it is an ordinary character. Inside a string,
  // "->", "#" and whitespace are text. Strings and plain characters with nothing between them form one word.
  function lexLine(line) {
    const pieces = [];
    const isWS = (c) => /\s/.test(c);
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      if (isWS(c)) {
        let j = i;
        while (j < line.length && isWS(line[j])) j++;
        pieces.push({ type: "ws", raw: line.slice(i, j) });
        i = j;
      } else if (c === "#" && (i === 0 || isWS(line[i - 1]))) {
        pieces.push({ type: "comment", raw: line.slice(i) });
        break;
      } else if (line.startsWith("->", i)) {
        pieces.push({ type: "arrow", raw: "->" });
        i += 2;
      } else {
        const start = i;
        let value = "";
        let quoted = false;
        let canOpen = true;
        while (i < line.length && !isWS(line[i]) && !line.startsWith("->", i)) {
          const q = line[i];
          const close = (canOpen && (q === '"' || q === "'")) ? line.indexOf(q, i + 1) : -1;
          if (close >= 0) {
            value += line.slice(i + 1, close);
            quoted = true;
            i = close + 1;
          } else {
            value += q;
            canOpen = false;
            i++;
          }
        }
        pieces.push({ type: "word", raw: line.slice(start, i), value, quoted });
      }
    }
    return pieces;
  }

  function looksLikeUrlToken(tok) {
    if (!tok) return false;
    if (tok.startsWith("/")) return true;
    if (tok.startsWith("http://") || tok.startsWith("https://")) return true;
    if (tok.startsWith("mailto:")) return true;
    if (tok.startsWith("www.")) return true;
    return false;
  }

  function normalizeUrl(tok) {
    if (!tok) return "";
    if (tok.startsWith("/")) return "https://" + tok.slice(1);
    if (tok.startsWith("www.")) return "https://" + tok;
    return tok;
  }

  function isValidId(id) {
    // Keep it simple; allow common graph ids
    return /^[A-Za-z0-9_:\-]+$/.test(id);
  }

  // Quoted ids may hold any characters, but not nothing
  function idError(word, lineNo) {
    if (word.quoted) return word.value ? "" : `Line ${lineNo+1}: empty node id`;
    return isValidId(word.value) ? "" : `Line ${lineNo+1}: invalid node id "${word.value}"`;
  }

  function parseAttrs(words, kind) {
    // Order: style, color, url, text
    // But each optional, so we detect by reserved sets. Quoted words are never keywords or URLs.
    const tokens = words.map(w => w.quoted ? null : w.value);
    let i = 0;

    let size = "";
    let style = "";
    let color = "";
    let url = "";
    let text = "";

    if (tokens[i]) {
      if (kind === "node") {
        if (NODE_SIZES.includes(tokens[i])) {
          size = tokens[i++];
        }
        if (tokens[i] && NODE_SHAPES.includes(tokens[i])) {
          style = tokens[i++]; // shape
        }
      } else if (kind === "edge") {
        if (NODE_SIZES.includes(tokens[i])) {
          size = tokens[i++];
        }
        if (tokens[i] && EDGE_STYLES.includes(tokens[i])) {
          style = tokens[i++]; // line style
        }
      }
    }

    if (tokens[i] && Object.prototype.hasOwnProperty.call(COLORS, tokens[i])) {
      color = tokens[i++];
    }

    if (tokens[i] && looksLikeUrlToken(tokens[i])) {
      url = normalizeUrl(tokens[i++]);
    }

    const textGiven = i < words.length;
    if (textGiven) {
      text = words.slice(i).map(w => w.value).join(" ");
    }

    return { size, style, color, url, text, textGiven };
  }

  function parseSource(src) {
    const nodes = new Map(); // id -> {id, size, shape, color, url, text}
    const edges = [];        // {from,to, size,style,color,url,text, key}
    let background = "";

    const errors = [];
    const lines = src.split(/\r?\n/);

    function ensureNode(id) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          size: "normal",
          shape: "circle",
          color: "gray",
          url: "",
          text: "",
          sizeGiven: false,
          shapeGiven: false,
        });
      }
      return nodes.get(id);
    }

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      const pieces = lexLine(lines[lineNo]);
      const words = pieces.filter(p => p.type === "word");
      const hasArrow = pieces.some(p => p.type === "arrow");
      if (!words.length && !hasArrow) continue;

      if (!hasArrow && words.length === 1 && !words[0].quoted
          && Object.prototype.hasOwnProperty.call(COLORS, words[0].value)) {
        background = words[0].value;
        continue;
      }

      if (hasArrow) {
        // Edge line (possibly chain)
        const segs = [[]];
        for (const p of pieces) {
          if (p.type === "arrow") segs.push([]);
          else if (p.type === "word") segs[segs.length - 1].push(p);
        }
        const nonEmpty = segs.filter(s => s.length);
        if (nonEmpty.length < 2) {
          errors.push(`Line ${lineNo+1}: malformed edge line`);
          continue;
        }

        // Last segment may contain attrs after the last node id
        const lastWords = nonEmpty[nonEmpty.length - 1];

        const chainIds = [];
        for (let i = 0; i < nonEmpty.length - 1; i++) {
          const err = idError(nonEmpty[i][0], lineNo);
          if (err) {
            errors.push(err);
            continue;
          }
          chainIds.push(nonEmpty[i][0].value);
        }

        const lastErr = idError(lastWords[0], lineNo);
        if (lastErr) {
          errors.push(lastErr);
          continue;
        }
        chainIds.push(lastWords[0].value);

        const attrs = parseAttrs(lastWords.slice(1), "edge");
        // Apply to every edge in chain
        for (let i = 0; i < chainIds.length - 1; i++) {
          const from = chainIds[i];
          const to = chainIds[i + 1];
          ensureNode(from);
          ensureNode(to);

          edges.push({
            from, to,
            size: attrs.size || "normal",
            style: attrs.style || "solid",
            color: attrs.color || "gray",
            url: attrs.url || "",
            text: attrs.text || "",
            key: `${from}->${to}#${edges.length}` // allow duplicates
          });
        }
      } else {
        // Node line
        const err = idError(words[0], lineNo);
        if (err) {
          errors.push(err);
          continue;
        }
        const attrs = parseAttrs(words.slice(1), "node");
        const n = ensureNode(words[0].value);
        if (attrs.size) { n.size = attrs.size; n.sizeGiven = true; }
        if (attrs.style) { n.shape = attrs.style; n.shapeGiven = true; }
        if (attrs.color) n.color = attrs.color;
        if (attrs.url) n.url = attrs.url;
        if (attrs.textGiven) n.text = attrs.text;
        // Without text we keep prior text, so a later bare "id" line won't wipe it; "" clears it explicitly.
      }
    }

    // Prune accidental empty duplicates? We'll just keep as parsed.

    return { nodes, edges, background, errors };
  }

  // -----------------------------
  // Layout + Rendering (SVG)
  // -----------------------------
  const NODE_W = 110;
  const NODE_H = 64;

  function nodeScale(size) {
    if (size === "tiny") return 0.25;
    if (size === "small") return 0.5;
    if (size === "big") return 2.0;
    if (size === "bigger") return 4.0;
    if (size === "huge") return 8.0;
    return 1.0; // normal
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    const v = parseInt(h, 16);
    if (h.length !== 6 || Number.isNaN(v)) return { r: 200, g: 200, b: 200 };
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function rgba(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r, g, b].map(v => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function ensurePositions(diagram) {
    const rect = $svg.getBoundingClientRect();
    const W = Math.max(400, rect.width);
    const H = Math.max(300, rect.height);

    const ids = Array.from(diagram.nodes.keys()).sort();
    const missing = ids.filter(id => !state.pos[id] || !Array.isArray(state.pos[id]));

    if (missing.length === 0) return;

    // Place missing nodes around a circle
    const cx = W * 0.5;
    const cy = H * 0.5;
    const r = Math.min(W, H) * 0.32;

    // Count total for stable distribution
    const all = ids;
    for (let i = 0; i < all.length; i++) {
      const id = all[i];
      if (state.pos[id]) continue;
      const ang = (i / Math.max(1, all.length)) * Math.PI * 2;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      state.pos[id] = [Math.round(x), Math.round(y)];
    }
  }

  // Screen = translation + scale * world. Keep the camera out of saved positions.
  const ZOOM_MIN = 0.001;
  const ZOOM_MAX = 1000;

  function zoomViewport(viewport, factor, centerX, centerY) {
    if (![factor, centerX, centerY].every(Number.isFinite) || factor <= 0) return false;
    const nextScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.scale * factor));
    if (nextScale === viewport.scale) return false;
    const worldX = (centerX - viewport.tx) / viewport.scale;
    const worldY = (centerY - viewport.ty) / viewport.scale;
    const tx = centerX - worldX * nextScale;
    const ty = centerY - worldY * nextScale;
    if (![tx, ty].every(Number.isFinite)) return false;
    Object.assign(viewport, { scale: nextScale, tx, ty });
    return true;
  }

  const ZOOM_STEP = 1.2;
  let viewport = { scale: 1, tx: 0, ty: 0 };
  let viewportGroup = null;

  function applyViewportTransform() {
    if (!viewportGroup) return;
    viewportGroup.setAttribute("transform", `translate(${viewport.tx} ${viewport.ty}) scale(${viewport.scale})`);
    $svg.toggleAttribute('data-modl-simple', viewport.scale < 0.1 || viewport.scale > 8);
    document.getElementById('zoomScale').textContent = `${Number(viewport.scale.toPrecision(4))}×`;
  }

  function zoomAt(factor, centerX, centerY) {
    if (dragging || panning || !zoomViewport(viewport, factor, centerX, centerY)) return;
    applyViewportTransform();
  }

  function zoomFromCenter(factor) {
    const box = $svg.viewBox.baseVal;
    zoomAt(factor, box.x + box.width / 2, box.y + box.height / 2);
  }

  function prunePositions(diagram) {
    const live = new Set(diagram.nodes.keys());
    for (const id of Object.keys(state.pos)) {
      if (!live.has(id)) delete state.pos[id];
    }
  }

  function svgPointFromEvent(evt) {
    const pt = $svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = $svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const p = pt.matrixTransform(inv);
    return { x: p.x, y: p.y };
  }

  function applyEdgeStyle(style, colorName) {
    const color = COLORS[colorName] || COLORS.gray;
    const props = {
      stroke: color,
      "stroke-width": (style === "bold") ? 3.5 : 2.2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-dasharray": "",
    };
    if (style === "dashed") props["stroke-dasharray"] = "10 7";
    if (style === "dotted") props["stroke-dasharray"] = "2 7";
    return props;
  }

  function markerIdFor(colorName) {
    return `arrow-${colorName}`;
  }

  function buildMarkers(defsEl) {
    // Create one arrow marker per color name to match edge stroke.
    for (const name of Object.keys(COLORS)) {
      const col = COLORS[name];
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", markerIdFor(name));
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "5");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      path.setAttribute("fill", col);

      marker.appendChild(path);
      defsEl.appendChild(marker);
    }
  }

  function nodeRadius(shape, size) {
    // Rough collision/edge endpoint offset
    const sc = nodeScale(size);
    if (shape === "none") return 4 * sc;
    if (shape === "circle") return Math.max(NODE_W, NODE_H) * 0.32 * sc;
    if (shape === "triangle" || shape === "diamond" || shape === "hex") return Math.max(NODE_W, NODE_H) * 0.36 * sc;
    return Math.max(NODE_W, NODE_H) * 0.34 * sc; // square-ish
  }

  // -----------------------------
  // Image nodes: a node whose URL is a displayable image shows that image
  // -----------------------------
  const IMAGE_EXTENSION = /\.(svg|png|apng|jpe?g|gif|webp|avif|bmp|ico)$/i;
  const images = new Map(); // url -> { status: "loading" | "ok" | "failed", width, height }
  let imageRenderRaf = 0;

  function hasImageExtension(url) {
    try { return IMAGE_EXTENSION.test(new URL(url).pathname); } catch { return false; }
  }

  // URLs without an image extension are probed by loading them as an image; the node switches over if that works.
  // Returns null while the URL isn't known to be an image. width/height are 0 until known (or if the image has
  // no intrinsic size, like an SVG without width/height).
  function nodeImage(url) {
    if (!/^https?:\/\//i.test(url)) return null;
    let entry = images.get(url);
    if (!entry) {
      entry = { status: "loading", width: 0, height: 0 };
      images.set(url, entry);
      const img = new Image();
      img.onload = () => {
        entry.status = "ok";
        entry.width = img.naturalWidth;
        entry.height = img.naturalHeight;
        if (!imageRenderRaf) {
          imageRenderRaf = requestAnimationFrame(() => {
            imageRenderRaf = 0;
            renderAll();
          });
        }
      };
      img.onerror = () => {
        entry.status = "failed";
        if (hasImageExtension(url)) renderAll();
      };
      img.src = url;
    }
    if (entry.status === "ok") return entry;
    if (entry.status === "loading" && hasImageExtension(url)) return entry;
    return null;
  }

  // An explicit size fits the image in that size's box; otherwise it's shown at its natural size
  function imageNodeSize(n, img) {
    if (!n.sizeGiven && img.width && img.height) return { w: img.width, h: img.height };
    const sc = nodeScale(n.size);
    const boxW = NODE_W * sc, boxH = NODE_H * sc;
    if (!img.width || !img.height) return { w: boxW, h: boxH };
    const k = Math.min(boxW / img.width, boxH / img.height);
    return { w: img.width * k, h: img.height * k };
  }

  // Distance from the center of a convex polygon (points relative to that center) to its edge along (ux, uy)
  function rayExit(points, ux, uy) {
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const [px, py] = points[i];
      const [qx, qy] = points[(i + 1) % points.length];
      const ex = qx - px, ey = qy - py;
      const den = ux * ey - uy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = (px * ey - py * ex) / den;
      const s = (px * uy - py * ux) / den;
      if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) best = Math.min(best, t);
    }
    return Number.isFinite(best) ? best : 0;
  }

  function rectPoints(hw, hh) {
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  }

  // Geometry of an image node relative to its center, or null if the node isn't showing an image.
  // An explicitly given shape becomes a frame drawn around the image.
  function imageLayout(n) {
    const img = n.url ? nodeImage(n.url) : null;
    if (!img) return null;
    const { w, h } = imageNodeSize(n, img);
    const sc = n.sizeGiven ? nodeScale(n.size) : 1;
    const shape = (n.shapeGiven && NODE_SHAPES.includes(n.shape) && n.shape !== "none") ? n.shape : "";
    const pad = shape ? Math.max(3, 6 * sc) : 0;
    const W = w / 2 + pad, H = h / 2 + pad;

    let frame = null;
    let outline;
    if (shape === "circle") {
      frame = { r: Math.hypot(W, H) };
    } else if (shape === "square") {
      frame = { points: rectPoints(W, H), rx: Math.min(12 * sc, W, H) };
    } else if (shape === "diamond") {
      frame = { points: [[0, -2 * H], [2 * W, 0], [0, 2 * H], [-2 * W, 0]] };
    } else if (shape === "triangle") {
      frame = { points: [[0, -3 * H], [2 * W, H], [-2 * W, H]] };
    } else if (shape === "hex") {
      const hw = W / 0.55;
      frame = { points: [[-W, -H], [W, -H], [hw, 0], [W, H], [-W, H], [-hw, 0]] };
    }
    if (frame && frame.points) outline = frame.points;
    else if (!frame) outline = rectPoints(w / 2 + 2, h / 2 + 2);

    const bounds = frame && frame.r
      ? { left: -frame.r, top: -frame.r, right: frame.r, bottom: frame.r }
      : {
          left: Math.min(...outline.map(p => p[0])),
          top: Math.min(...outline.map(p => p[1])),
          right: Math.max(...outline.map(p => p[0])),
          bottom: Math.max(...outline.map(p => p[1])),
        };

    return {
      w, h, sc, frame, bounds,
      reach: (ux, uy) => (frame && frame.r) ? frame.r : rayExit(outline, ux, uy),
    };
  }

  // reachA/reachB give the distance from a node's center to its edge in a direction
  function edgeEndpoints(a, b, reachA, reachB) {
    const ax = a[0], ay = a[1];
    const bx = b[0], by = b[1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;

    const ra = reachA(ux, uy);
    const rb = reachB(-ux, -uy);

    const x1 = ax + ux * ra;
    const y1 = ay + uy * ra;
    const x2 = bx - ux * rb;
    const y2 = by - uy * rb;

    return { x1, y1, x2, y2, ux, uy, len };
  }

  function truncateLabel(s, n) {
    if (!s) return "";
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function render(diagram) {
    // Setup svg coordinate system in pixels
    const rect = $svg.getBoundingClientRect();
    const W = Math.max(400, rect.width);
    const H = Math.max(300, rect.height);

    $svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    $svg.style.touchAction = "none";
    $svg.innerHTML = "";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    buildMarkers(defs);
    const detailStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    detailStyle.textContent = 'svg[data-modl-simple] [filter] { filter: none; }';
    defs.appendChild(detailStyle);
    $svg.appendChild(defs);

    // A subtle grid background
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", W); bg.setAttribute("height", H);
    bg.setAttribute("fill", diagram.background ? COLORS[diagram.background] || "transparent" : "transparent");
    bg.style.cursor = "grab";
    bg.addEventListener("pointerdown", (ev) => startPan(ev));
    $svg.appendChild(bg);

    // Draw edges under nodes
    viewportGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    viewportGroup.appendChild(edgeLayer);
    viewportGroup.appendChild(nodeLayer);
    $svg.appendChild(viewportGroup);
    applyViewportTransform();

    const imageLayouts = new Map();
    for (const [id, n] of diagram.nodes.entries()) {
      const layout = imageLayout(n);
      if (layout) imageLayouts.set(id, layout);
    }
    const reachOf = (node) => {
      const layout = imageLayouts.get(node.id);
      return layout ? layout.reach : () => nodeRadius(node.shape, node.size);
    };

    // Edge rendering
    for (const e of diagram.edges) {
      const fromPos = state.pos[e.from];
      const toPos = state.pos[e.to];
      const fromNode = diagram.nodes.get(e.from);
      const toNode = diagram.nodes.get(e.to);
      if (!fromPos || !toPos || !fromNode || !toNode) continue;

      const { x1, y1, x2, y2, ux, uy } = edgeEndpoints(fromPos, toPos, reachOf(fromNode), reachOf(toNode));

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Visible stroke
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);

      const styleProps = applyEdgeStyle(e.style || "solid", e.color || "gray");
      for (const [k, v] of Object.entries(styleProps)) p.setAttribute(k, v);

      p.setAttribute("fill", "none");
      p.setAttribute("marker-end", `url(#${markerIdFor(e.color || "gray")})`);

      // Hover text
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      const tText = [
        `${e.from} -> ${e.to}`,
        e.text ? `text: ${e.text}` : "",
        e.url ? `link: ${e.url}` : ""
      ].filter(Boolean).join("\n");
      title.textContent = tText;
      p.appendChild(title);

      // Click overlay for edges (fatter invisible stroke)
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hit.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
      hit.setAttribute("fill", "none");
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "14");
      hit.style.cursor = e.url ? "pointer" : "default";
      hit.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (e.url) safeOpen(e.url);
      });

      // Edge label (optional)
      if (e.text) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const edgeTextScale = nodeScale(e.size || "normal");
        // Offset label slightly perpendicular
        const px = -uy, py = ux;
        const tx = mx + px * 10;
        const ty = my + py * 10;

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", tx);
        label.setAttribute("y", ty);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");
        label.setAttribute("font-size", String(Math.max(10, Math.round(12 * edgeTextScale))));
        label.setAttribute("fill", "rgba(232,237,243,0.85)");
        label.setAttribute("paint-order", "stroke");
        label.setAttribute("stroke", "rgba(0,0,0,0.6)");
        label.setAttribute("stroke-width", "3");
        label.style.pointerEvents = "none";
        label.textContent = truncateLabel(e.text, 28);
        g.appendChild(label);
      }

      g.appendChild(p);
      g.appendChild(hit);
      edgeLayer.appendChild(g);
    }

    // Node rendering
    for (const [id, n] of diagram.nodes.entries()) {
      const pos = state.pos[id];
      if (!pos) continue;
      const x = pos[0], y = pos[1];

      const sc = nodeScale(n.size);
      const w = NODE_W * sc;
      const h = NODE_H * sc;

      const col = COLORS[n.color] || COLORS.gray;
      const fillCol = rgba(col, 0.18);
      const strokeCol = rgba(col, 0.85);
      const labelCol = luminance(col) < 0.38 ? "rgba(248,250,252,0.95)" : "rgba(15,23,42,0.92)";

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-node-id", id);
      g.style.cursor = "grab";

      // Hover text
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      const tText = [
        id,
        n.text ? `text: ${n.text}` : "",
        n.url ? `link: ${n.url}` : ""
      ].filter(Boolean).join("\n");
      title.textContent = tText;
      g.appendChild(title);

      const layout = imageLayouts.get(id);
      if (layout) {
        renderImageNode(g, n, id, x, y, layout, fillCol, strokeCol);
        g.addEventListener("pointerdown", (ev) => startDrag(ev, id));
        nodeLayer.appendChild(g);
        continue;
      }

      // Shape
      const shape = (n.shape && NODE_SHAPES.includes(n.shape)) ? n.shape : "circle";
      let el;

      if (shape === "none") {
        el = null;
      } else if (shape === "circle") {
        el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        el.setAttribute("cx", x);
        el.setAttribute("cy", y);
        el.setAttribute("r", Math.min(w, h) * 0.42);
      } else if (shape === "square") {
        el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("x", x - w / 2);
        el.setAttribute("y", y - h / 2);
        el.setAttribute("width", w);
        el.setAttribute("height", h);
        el.setAttribute("rx", 12 * sc);
      } else if (shape === "diamond") {
        el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pts = [
          [x, y - h/2],
          [x + w/2, y],
          [x, y + h/2],
          [x - w/2, y],
        ].map(p => p.join(",")).join(" ");
        el.setAttribute("points", pts);
      } else if (shape === "triangle") {
        el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pts = [
          [x, y - h/2],
          [x + w/2, y + h/2],
          [x - w/2, y + h/2],
        ].map(p => p.join(",")).join(" ");
        el.setAttribute("points", pts);
      } else if (shape === "hex") {
        el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const hw = w/2, hh = h/2;
        const pts = [
          [x - hw*0.55, y - hh],
          [x + hw*0.55, y - hh],
          [x + hw,      y],
          [x + hw*0.55, y + hh],
          [x - hw*0.55, y + hh],
          [x - hw,      y],
        ].map(p => p.join(",")).join(" ");
        el.setAttribute("points", pts);
      } else {
        // fallback
        el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        el.setAttribute("cx", x);
        el.setAttribute("cy", y);
        el.setAttribute("r", Math.min(w, h) * 0.42);
      }

      if (el) {
        el.setAttribute("fill", fillCol);
        el.setAttribute("stroke", strokeCol);
        el.setAttribute("stroke-width", "2.2");
        el.setAttribute("filter", "drop-shadow(0px 8px 18px rgba(0,0,0,0.45))");
        el.style.pointerEvents = "all";

        // Click to follow link
        if (n.url) {
          el.style.cursor = "pointer";
          el.addEventListener("click", (ev) => {
            // If dragging, ignore click (handled by drag logic)
            if (dragging && dragging.id === id) return;
            ev.stopPropagation();
            safeOpen(n.url);
          });
        }

        g.appendChild(el);
      } else {
        // Invisible hit target so "none" nodes remain draggable/clickable.
        const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hit.setAttribute("x", x - w / 2);
        hit.setAttribute("y", y - h / 2);
        hit.setAttribute("width", w);
        hit.setAttribute("height", h);
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("stroke", "none");
        hit.style.pointerEvents = "all";
        if (n.url) {
          hit.style.cursor = "pointer";
          hit.addEventListener("click", (ev) => {
            if (dragging && dragging.id === id) return;
            ev.stopPropagation();
            safeOpen(n.url);
          });
        }
        g.appendChild(hit);
      }

      // Label: prefer node text; fallback to id
      const labelText = n.text ? truncateLabel(n.text, 22) : id;
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", x);
      textEl.setAttribute("y", y);
      textEl.setAttribute("text-anchor", "middle");
      textEl.setAttribute("dominant-baseline", "middle");
      textEl.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");
      textEl.setAttribute("font-size", String(Math.max(10, Math.round(13 * sc))));
      textEl.setAttribute("font-weight", "700");
      textEl.setAttribute("fill", (shape === "none") ? strokeCol : labelCol);
      textEl.style.pointerEvents = "none";
      textEl.textContent = labelText;

      g.appendChild(textEl);

      // Drag handlers
      g.addEventListener("pointerdown", (ev) => startDrag(ev, id));

      nodeLayer.appendChild(g);
    }
  }

  function renderImageNode(g, n, id, x, y, layout, fillCol, strokeCol) {
    const { w, h, sc, frame, bounds } = layout;
    const shadow = "drop-shadow(0px 8px 18px rgba(0,0,0,0.45))";

    if (frame) {
      let el;
      if (frame.r) {
        el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        el.setAttribute("cx", x);
        el.setAttribute("cy", y);
        el.setAttribute("r", frame.r);
      } else if (frame.rx !== undefined) {
        el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("x", x + bounds.left);
        el.setAttribute("y", y + bounds.top);
        el.setAttribute("width", bounds.right - bounds.left);
        el.setAttribute("height", bounds.bottom - bounds.top);
        el.setAttribute("rx", frame.rx);
      } else {
        el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        el.setAttribute("points", frame.points.map(([px, py]) => `${x + px},${y + py}`).join(" "));
      }
      el.setAttribute("fill", fillCol);
      el.setAttribute("stroke", strokeCol);
      el.setAttribute("stroke-width", "2.2");
      el.setAttribute("filter", shadow);
      el.style.pointerEvents = "none";
      g.appendChild(el);
    }

    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("href", n.url);
    image.setAttribute("x", x - w / 2);
    image.setAttribute("y", y - h / 2);
    image.setAttribute("width", w);
    image.setAttribute("height", h);
    image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    if (!frame) image.setAttribute("filter", shadow);
    image.style.pointerEvents = "none";
    g.appendChild(image);

    // Transparent hit target covering the whole node so it stays draggable/clickable
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("x", x + bounds.left);
    hit.setAttribute("y", y + bounds.top);
    hit.setAttribute("width", bounds.right - bounds.left);
    hit.setAttribute("height", bounds.bottom - bounds.top);
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("stroke", "none");
    hit.style.pointerEvents = "all";
    hit.style.cursor = "pointer";
    hit.addEventListener("click", (ev) => {
      if (dragging && dragging.id === id) return;
      ev.stopPropagation();
      safeOpen(n.url);
    });
    g.appendChild(hit);

    if (n.text) {
      const fontSize = Math.max(10, Math.round(13 * sc));
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", x);
      textEl.setAttribute("y", y + bounds.bottom + 4 + fontSize / 2);
      textEl.setAttribute("text-anchor", "middle");
      textEl.setAttribute("dominant-baseline", "middle");
      textEl.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");
      textEl.setAttribute("font-size", String(fontSize));
      textEl.setAttribute("font-weight", "700");
      textEl.setAttribute("fill", "rgba(232,237,243,0.92)");
      textEl.setAttribute("paint-order", "stroke");
      textEl.setAttribute("stroke", "rgba(0,0,0,0.6)");
      textEl.setAttribute("stroke-width", "3");
      textEl.style.pointerEvents = "none";
      textEl.textContent = truncateLabel(n.text, 22);
      g.appendChild(textEl);
    }
  }

  function safeOpen(url) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      location.href = url;
    }
  }

  let lastNavTime = 0;
  function openUrl(url) {
    if (!url) return;
    const now = performance.now();
    if (now - lastNavTime < 250) return;
    lastNavTime = now;
    safeOpen(url);
  }

  // -----------------------------
  // Dragging
  // -----------------------------
  let dragging = null;
  let dragMoved = false;
  let dragRaf = 0;
  let dragHashTimer = 0;
  let panning = null;

  function startDrag(ev, id) {
    // Only left click / primary pointer
    if (ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (dragging || panning) return;
    const p = svgPointFromEvent(ev);
    const cur = state.pos[id];
    dragging = {
      id,
      x: cur[0], y: cur[1],
      startX: p.x, startY: p.y,
      clientX: ev.clientX, clientY: ev.clientY,
      pointerId: ev.pointerId
    };
    dragMoved = false;
    $svg.setPointerCapture(ev.pointerId);
  }

  function moveDrag(ev) {
    if (!dragging || ev.pointerId !== dragging.pointerId) return;
    // Fractional world positions matter: rounding at 1000x causes 1000px jumps.
    // Use deltas to avoid subtracting two large world-space coordinates.
    const p = svgPointFromEvent(ev);
    const nx = dragging.x + (p.x - dragging.startX) / viewport.scale;
    const ny = dragging.y + (p.y - dragging.startY) / viewport.scale;
    if (![nx, ny].every(Number.isFinite)) return;
    const id = dragging.id;
    if (Math.hypot(ev.clientX - dragging.clientX, ev.clientY - dragging.clientY) >= 3) dragMoved = true;
    if (!dragMoved) return;

    state.pos[id] = [nx, ny];

    // Throttle full render to animation frames
    if (!dragRaf) {
      dragRaf = requestAnimationFrame(() => {
        dragRaf = 0;
        renderAll();
      });
    }

    // Debounce hash updates while dragging (still all state in URL)
    clearTimeout(dragHashTimer);
    dragHashTimer = setTimeout(() => syncHash({ replace: true }), 120);
  }

  function startPan(ev) {
    if (![0, 1].includes(ev.button) || dragging || panning) return;
    ev.preventDefault();
    const p = svgPointFromEvent(ev);
    panning = {
      pointerId: ev.pointerId,
      startX: p.x,
      startY: p.y,
      tx: viewport.tx,
      ty: viewport.ty,
    };
    $svgWrap.classList.add("panning");
    $svg.setPointerCapture(ev.pointerId);
  }

  function movePan(ev) {
    if (!panning || ev.pointerId !== panning.pointerId) return;
    const p = svgPointFromEvent(ev);
    viewport.tx = panning.tx + (p.x - panning.startX);
    viewport.ty = panning.ty + (p.y - panning.startY);
    applyViewportTransform();
  }

  function endPan() {
    if (!panning) return;
    const pointerId = panning.pointerId;
    panning = null;
    try { $svg.releasePointerCapture(pointerId); } catch {}
    $svgWrap.classList.remove("panning");
  }

  function endDrag(ev) {
    if (!dragging || ev.pointerId !== dragging.pointerId) return;
    const finishedId = dragging.id;
    const finishedMoved = dragMoved;
    const pointerId = dragging.pointerId;
    dragging = null;
    clearTimeout(dragHashTimer);
    try { $svg.releasePointerCapture(pointerId); } catch {}
    if (finishedMoved) {
      syncHash({ replace: true });
    } else if (ev.type === 'pointerup') {
      const n = diagram && diagram.nodes ? diagram.nodes.get(finishedId) : null;
      if (n && n.url) openUrl(n.url);
    }
  }

  // Middle drag can pan even when a deeply zoomed node covers the whole canvas.
  $svg.addEventListener('pointerdown', ev => { if (ev.button === 1) startPan(ev); }, true);
  $svg.addEventListener("pointermove", (ev) => {
    moveDrag(ev);
    movePan(ev);
  });
  $svg.addEventListener("pointerup", (ev) => {
    endDrag(ev);
    if (panning?.pointerId === ev.pointerId) endPan();
  });
  $svg.addEventListener("pointercancel", (ev) => {
    endDrag(ev);
    if (panning?.pointerId === ev.pointerId) endPan();
  });
  $svg.addEventListener('lostpointercapture', ev => {
    endDrag(ev);
    if (panning?.pointerId === ev.pointerId) endPan();
  });


    $svg.addEventListener('wheel', event => {
      event.preventDefault();
      if (!event.deltaY) return;
      const p = svgPointFromEvent(event);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? $svg.viewBox.baseVal.height : 1;
      zoomAt(Math.exp(Math.max(-2, Math.min(2, -event.deltaY * unit * 0.002))), p.x, p.y);
    }, { passive: false });
  $btnZoomOut.addEventListener("click", () => zoomFromCenter(1 / ZOOM_STEP));
  $btnZoomIn.addEventListener("click", () => zoomFromCenter(ZOOM_STEP));
  document.getElementById('btnResetView').addEventListener('click', () => {
    if (dragging || panning) return;
    viewport = { scale: 1, tx: 0, ty: 0 };
    applyViewportTransform();
  });

  // -----------------------------
  // App state + rendering loop
  // -----------------------------
  let state = makeDefaultState();
  let diagram = null;
  let parseTimer = 0;

  function makeDefaultState() {
    return {
      src: [
        "# Diagram Editor — edit this text, then copy the URL",
        "",
        "# nodes (id  [size] [shape] [color] [url] [text...])",
        "n square red /google.com Node N",
        "m circle blue /wikipedia.org Node M",
        "t triangle green /example.com Triangle",
        "",
        "# edges (a -> b (-> c...)  [size] [lineStyle] [color] [url] [text...])",
        "n -> m solid purple /news.ycombinator.com N to M",
        "m -> t small dotted teal /slashdot.org Dotted link",
        "t -> n dashed orange /github.com Back edge",
        "",
        "# you can define nodes implicitly by referencing them in edges:",
        "a -> b -> c bold yellow /example.com Chain applies to each edge",
        "",
      ].join("\n"),
      pos: {}
    };
  }

  function applyState(newState, { replace = true, fromHash = false } = {}) {
    state = fromDocument(type.normalize(newState));

    // Put src into editor (without retriggering too hard)
    if ($src.value !== state.src) $src.value = state.src;

    updateHashStatus();
  }

  function renderAll() {
    const parsed = parseSource(state.src);

    if (parsed.errors.length) {
      $parseStatus.textContent = "Parse errors";
      $parseStatus.className = "err";
      $errorBox.classList.add("show");
      $errorBox.textContent = parsed.errors.join("\n");
    } else {
      $parseStatus.textContent = "OK";
      $parseStatus.className = "ok";
      $errorBox.classList.remove("show");
      $errorBox.textContent = "";
    }

    diagram = { nodes: parsed.nodes, edges: parsed.edges, background: parsed.background };

    ensurePositions(diagram);
    prunePositions(diagram);

    render(diagram);
    updateHashStatus();
    updateSavedState();
  }

  const offline=new OfflineClient({url:'./service-worker.js',onStatus:result=>{shell.offlineStatus.textContent=result.ready?'Available offline':'Offline setup incomplete';},onUpdate:()=>{update.hidden=false;shell.offlineStatus.textContent='Offline update ready';}});
  const repair=document.createElement('button'),update=document.createElement('button');repair.id='offline-repair';repair.textContent='Repair offline copy';update.id='offline-update';update.textContent='Update and reload';update.hidden=true;shell.drawer.body.append(repair,update);
  repair.onclick=()=>offline.repair().catch(error=>{shell.offlineStatus.textContent=error.message;});update.onclick=()=>{syncHash();offline.activateUpdate();};
  let controlled=Boolean(navigator.serviceWorker?.controller);navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(controlled){syncHash();location.reload();}controlled=true;});
  async function openURL(href){
   const revision=++navigationRevision;lastNavigation=href;panel.cancelLoad();cancelInteractions();drafts.opened();
   try{
    const intent=urlState.parse(href),url=new URL(href),options={};
    if(url.searchParams.has('run'))options.run=intent.run;if(intent.view)options.view=intent.view;
    if(intent.kind==='publish'){
     const result=await store.published(intent.hash);if(revision!==navigationRevision)return;
     if(result?.snapshot){applyDocument(result.snapshot,result.cid??null,options);syncHash();}
     if(result){panel.status.textContent=result.error||'Saved to HashBin.';shell.drawer.open();}
    }else if(intent.kind==='source'){applyDocument(intent.doc,null,options);}
    else if(intent.kind==='cid'){panel.status.textContent='Loading from HashBin…';const doc=await store.load(intent.cid);if(revision!==navigationRevision)return;applyDocument(doc,intent.cid,options);panel.status.textContent='Loaded from HashBin.';}
    else if(intent.kind==='example'){
     const{catalog}=await import('./gallery-catalog.js');if(revision!==navigationRevision)return;const example=catalog.find(example=>example.id===intent.id);if(!example)throw Error('Unknown diagram example.');applyDocument(example.document,null,options);syncHash();
    }else if(intent.kind==='none'){autoRun=true;setViewMode('split');applyState(makeDefaultState());renderAll();syncHash();}
    else throw Error('This diagram link is not supported.');
   }catch(error){if(revision===navigationRevision)showLoadError(error.message);}
  }
  $src.addEventListener('input',()=>{
   const revision=++navigationRevision;panel.cancelLoad();clearTimeout(parseTimer);saved=null;
   drafts.attempt({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode},true);
   parseTimer=setTimeout(()=>{if(revision!==navigationRevision)return;try{type.normalize({src:$src.value,pos:state.pos});if(autoRun){state.src=$src.value;renderAll();}syncHash();}catch(error){showLoadError(error.message);}},160);
  });
  $svg.addEventListener('pointerdown',()=>{navigationRevision++;panel.cancelLoad();try{gestureFingerprint=savePayload(snapshotState());}catch{}},true);
  for(const name of ['pointerup','pointercancel'])$svg.addEventListener(name,()=>queueMicrotask(()=>{gestureFingerprint=null;}));
  window.addEventListener('resize',()=>{if(autoRun)renderAll();});
  const navigate=()=>{if(lastNavigation!==location.href)void openURL(location.href);};window.addEventListener('hashchange',navigate);window.addEventListener('popstate',navigate);
  window.addEventListener('beforeunload',()=>{drafts.attempt({src:$src.value,pos:state.pos,autorun:autoRun,view:viewMode});});
  globalThis.ModlApp={getSource:()=>$src.value,getSnapshot:()=>snapshotState(),openURL,setSource:src=>{$src.value=src;$src.dispatchEvent(new Event('input',{bubbles:true}));},render:()=>renderButton.click(),store,panel};
  await openURL(location.href);initialized=true;document.body.dataset.ready='true';
  store.retireLegacyTokens().catch(()=>{});
  offline.init().catch(error=>{shell.offlineStatus.textContent=error.message;});
})();
