import {renderDiagram, nodeScale} from './render.js';
import {layeredPositions, groupBounds, extraShape, marksFromURL} from './diagram-features.js';
import { NODE_SIZES, NODE_SHAPES, EDGE_STYLES, COLORS, lexLine, parseAttrs, parseSource, normalizeUrl } from './parse.js';
import{config,type,fromDocument,serializeLegacy,encodeState,urlState,documents,HashBinStore}from'./fragment-config.js';
import{LocalDrafts,createStorage,HashBinPanel,createShell,mountMobileTabs,createShareDialog,createQrDialog,OfflineClient}from'../vendor/fragment-kit-v0.3.5/src/index.js';
function optionalStorage(kind){try{return globalThis[kind];}catch{return undefined;}}
function localOverride(name,fallback){const value=new URL(location.href).searchParams.get(name);try{const url=new URL(value);if(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))return url.origin;}catch{}return fallback;}
const API_BASE=localOverride('api','https://hashbin.org'),CONTENT_BASE=localOverride('content','https://256t.us'),IS_LOCAL_API=API_BASE!=='https://hashbin.org';
const clientId=IS_LOCAL_API?new URL(location.href).searchParams.get('client_id')||config.hashbinClientId:config.hashbinClientId;
const callback=new URL(location.href);callback.hash='';callback.pathname=callback.pathname.replace(/index\.html$/,'');for(const key of [...callback.searchParams.keys()])if(!IS_LOCAL_API||!['api','content','client_id'].includes(key))callback.searchParams.delete(key);
const store=new HashBinStore({clientId,redirectUri:callback.href,legacyStorage:optionalStorage('localStorage'),apiBase:API_BASE,contentBase:CONTENT_BASE,...IS_LOCAL_API?{loadSDK:()=>import(API_BASE+'/sdk/v0.4.0/hashbin.js'),fetchSource:(url,options)=>fetch(url.replace('https://256t.us/',CONTENT_BASE+'/'),options)}:{}});
(async()=>{
 const originalHeader=document.querySelector('.topbar');
 const shell=createShell({config,container:document.querySelector('.app')});
 const renderButton=document.createElement('button');renderButton.id='render';renderButton.textContent='Render once';renderButton.hidden=true;shell.drawer.body.append(renderButton);
 const shareButton=document.getElementById('btnCopy'),qrButton=document.getElementById('btnQr');shareButton.textContent='Share';qrButton.textContent='QR';
 shell.toolbar.append(shareButton,qrButton);
 for(const id of ['btnViewSource','btnViewDiagram','btnViewHelp','btnViewSplit','btnCommit','btnReset'])shell.drawer.body.append(document.getElementById(id));
 for(const id of ['btnViewSource','btnViewDiagram','btnViewSplit'])document.getElementById(id).hidden=true;
 originalHeader.querySelector('#parseStatus')?.setAttribute('data-fk-primary-status','');shell.status.append(originalHeader.querySelector('.status'));originalHeader.remove();
 document.getElementById('saveDialog').remove();document.getElementById('qrDialog').remove();
 shell.header.querySelector('.fk-more').id='more-toggle';
 const drafts=new LocalDrafts({storage:createStorage({prefix:config.storagePrefix}),key:'draft',serialize:value=>JSON.stringify(fromDocument(value)),parse:text=>type.normalize(JSON.parse(text))});
 let syncingView=false,initialized=false,autoRun=true,viewMode='split',mobileTabs,navigationRevision=0,lastNavigation,qrSave=false,gestureFingerprint;

  // -----------------------------
  // Reserved vocab
  // -----------------------------
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
    const custom=extraShape(shape,12,8,18,12);
    if(custom)return `<svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg"><${custom[0]} ${Object.entries(custom[1]).map(([k,v])=>`${k}="${v}"`).join(' ')} fill="rgba(232,237,243,.15)" stroke="currentColor"/></svg>`;
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
    syncingView=true;mobileTabs?.select(mode==='split'?'split':mode==='diagram'?1:0);syncingView=false;
    if(persist&&initialized){drafts.attempt(snapshotState(),true);syncHash();shell.drawer.dialog.close();}
    if(initialized&&autoRun)requestAnimationFrame(renderAll);
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
  const rawLabel=document.createElement('label'),rawToggle=document.createElement('input');rawToggle.type='checkbox';rawToggle.id='show-raw-text';rawLabel.append(rawToggle,' Show text as written');shell.drawer.body.append(rawLabel);
  rawToggle.onchange=()=>{state.rawText=rawToggle.checked;renderAll();syncHash();};
  const pragmaPreview=document.createElement('pre');pragmaPreview.id='pragma-preview';pragmaPreview.setAttribute('aria-label','Highlighted gripeline pragmas');$src.after(pragmaPreview);
  function highlightPragmas(){pragmaPreview.replaceChildren();for(const line of $src.value.split(/\r?\n/)){const comment=lexLine(line).find(p=>p.type==='comment');if(comment&&/^#gl(?:\s|$)/.test(comment.raw)){const mark=document.createElement('mark');mark.textContent=comment.raw;pragmaPreview.append(mark,'\n');}}}
  function snapshotState({flush=false}={}){
   if(flush)clearTimeout(parseTimer);
   if(flush&&autoRun&&state.src!==$src.value){state=fromDocument(type.normalize({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode}));renderAll();}
   return fromDocument(type.normalize({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode}));
  }
  const fingerprint=()=>JSON.stringify({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode});
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
   const doc=type.normalize(value);autoRun=options.run??doc.modl.autorun;renderButton.hidden=autoRun;
   setViewMode(options.view??doc.modl.view);
   applyState(fromDocument(doc),{fromHash:true});
   if(autoRun)renderAll();else{$svg.replaceChildren();diagram=null;$parseStatus.textContent='Automatic rendering is off — use Render once in More';}
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
  renderButton.onclick=()=>{try{state=fromDocument(type.normalize({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode}));renderAll();syncHash();shell.drawer.dialog.close();}catch(error){showLoadError(error.message);}};
  document.getElementById('btnReset').onclick=()=>{navigationRevision++;panel.cancelLoad();cancelInteractions();drafts.opened();autoRun=true;renderButton.hidden=true;setViewMode('split');saved=null;applyState(makeDefaultState());renderAll();drafts.attempt(snapshotState(),true);syncHash();shell.drawer.dialog.close();};
  document.getElementById('btnCommit').onclick=()=>{drafts.attempt(snapshotState({flush:true}),true);syncHash({replace:false});shell.drawer.dialog.close();};
  drafts.mount(shell.drawer.body,doc=>{navigationRevision++;panel.cancelLoad();cancelInteractions();applyDocument(doc);syncHash();},doc=>doc.src);
  const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);};
  const backup=document.createElement('button');backup.textContent='Download diagram';backup.onclick=()=>{try{download(new Blob([savePayload(snapshotState({flush:true}))],{type:'application/json'}),'diagram.json');}catch(error){showLoadError(error.message);}};shell.drawer.body.append(backup);
  const fileLabel=document.createElement('label'),file=document.createElement('input');fileLabel.textContent='Open diagram file';file.type='file';file.accept='.json,.modl,.txt';file.setAttribute('aria-label','Open diagram file');fileLabel.append(file);shell.drawer.body.append(fileLabel);
  file.onchange=async()=>{const selected=file.files[0];file.value='';if(!selected)return;const revision=++navigationRevision;panel.cancelLoad();cancelInteractions();try{if(selected.size>config.maxBytes)throw Error('Diagram file exceeds 5 MiB.');const data=await selected.slice(0,config.maxBytes+1).arrayBuffer();if(revision!==navigationRevision)return;const value=documents.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));drafts.opened();applyDocument(value);syncHash();shell.drawer.dialog.close();}catch(error){if(revision===navigationRevision)showLoadError(error.message);}};
  mobileTabs=mountMobileTabs({desktop:true,container:shell.toolbar,panels:[{label:'Text',panel:document.querySelector('.left')},{label:'Diagram',panel:document.querySelector('.right')}],onChange:index=>{const next=index===-1?'split':index===1?'diagram':'source';if(initialized&&!syncingView&&next!==viewMode)setViewMode(next,true);}});
  const textTab=shell.toolbar.querySelector('[role=tab]');
  const leaveHelp=()=>{if(viewMode==='help')setViewMode('source',true);};
  textTab.addEventListener('click',leaveHelp);textTab.addEventListener('keydown',event=>{if(event.key==='Home')leaveHelp();});
  mobileTabs.select(viewMode==='split'?'split':viewMode==='diagram'?1:0);

  // -----------------------------
  // Layout + Rendering (SVG)
  // -----------------------------
  function ensurePositions(diagram) {
    const rect = $svg.getBoundingClientRect();
    const W = Math.max(400, rect.width);
    const H = Math.max(300, rect.height);

    const ids = Array.from(diagram.nodes.keys()).sort();
    const missing = ids.filter(id => !state.pos[id] || !Array.isArray(state.pos[id]));

    if (missing.length === 0) return;

    layeredPositions(diagram, state.pos);
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
  function render(diagram) {
    ({viewportGroup} = renderDiagram($svg, diagram, {
      positions: state.pos, rawText: state.rawText, viewport,
      marks: marksFromURL(location.href), imageInfo: nodeImage,
      getDragging: () => dragging, onDrag: startDrag, onPan: startPan, onLink: safeOpen,
    }));
    applyViewportTransform();
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

    rawToggle.checked=Boolean(state.rawText);
    updateHashStatus();
  }

  function renderAll() {
    highlightPragmas();
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
     const{catalog}=await import('./gallery-catalog.js');if(revision!==navigationRevision)return;const{legacyExamples}=await import('./legacy-examples.js');if(revision!==navigationRevision)return;const example=catalog.find(example=>example.id===intent.id)??(legacyExamples[intent.id]?{document:legacyExamples[intent.id]}:null);if(!example)throw Error('Unknown diagram example.');applyDocument(example.document,null,options);syncHash();
    }else if(intent.kind==='none'){applyDocument({...makeDefaultState(),autorun:intent.run,view:options.view??(matchMedia('(max-width:767px)').matches?'source':'split')},null,options);syncHash();}
    else throw Error('This diagram link is not supported.');
   }catch(error){if(revision===navigationRevision)showLoadError(error.message);}
  }
  $src.addEventListener('input',()=>{
   const revision=++navigationRevision;panel.cancelLoad();clearTimeout(parseTimer);saved=null;
   drafts.attempt({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode},true);
   parseTimer=setTimeout(()=>{if(revision!==navigationRevision)return;try{type.normalize({src:$src.value,pos:state.pos});if(autoRun){state.src=$src.value;renderAll();}syncHash();}catch(error){showLoadError(error.message);}},160);
  });
  $svg.addEventListener('pointerdown',()=>{navigationRevision++;panel.cancelLoad();try{gestureFingerprint=savePayload(snapshotState());}catch{}},true);
  for(const name of ['pointerup','pointercancel'])$svg.addEventListener(name,()=>queueMicrotask(()=>{gestureFingerprint=null;}));
  window.addEventListener('resize',()=>{if(autoRun)renderAll();});
  const navigate=()=>{if(lastNavigation!==location.href)void openURL(location.href);};window.addEventListener('hashchange',navigate);window.addEventListener('popstate',navigate);
  window.addEventListener('beforeunload',()=>{drafts.attempt({src:$src.value,pos:state.pos,rawText:state.rawText,autorun:autoRun,view:viewMode});});
  globalThis.ModlApp={getSource:()=>$src.value,getSnapshot:()=>snapshotState(),openURL,setSource:src=>{$src.value=src;$src.dispatchEvent(new Event('input',{bubbles:true}));},render:()=>renderButton.click(),store,panel};
  await openURL(location.href);initialized=true;document.body.dataset.ready='true';
  store.retireLegacyTokens().catch(()=>{});
  offline.init().catch(error=>{shell.offlineStatus.textContent=error.message;});
})();
