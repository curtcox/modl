// Real standalone editor checks. Run against a local server or the deployed site.
// node tests/browser/deep-zoom.cjs [baseUrl] [chromium|firefox|webkit ...]
const assert = require('node:assert/strict');
const playwright = require('playwright');
const base = process.argv[2] || 'http://localhost:8001/';
const engines = process.argv.slice(3).length ? process.argv.slice(3) : ['chromium','firefox','webkit'];
const near = (a,b,tolerance=.1) => assert.ok(Math.abs(a-b)<=tolerance, `${a} != ${b} (±${tolerance})`);
async function run(engine) {
  const browser = await playwright[engine].launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1200,height:800},serviceWorkers:'block'});
    // The editor is local; sign-in/storage are outside this interaction test.
    await context.route('https://hashbin.org/**',route=>route.abort());
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base);
    await page.locator('#src').fill('white\na square blue Target\nb circle green Other\na -> b dashed purple Link');
    await page.locator('[data-node-id="a"] rect').waitFor();
    const frame = () => page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const node = () => page.evaluate(()=>{
      const el=document.querySelector('[data-node-id="a"] rect'),m=el.getScreenCTM();
      const x=Number(el.getAttribute('x'))+Number(el.getAttribute('width'))/2;
      const y=Number(el.getAttribute('y'))+Number(el.getAttribute('height'))/2;
      return {x,y,screenX:x*m.a+m.e,screenY:y*m.d+m.f};
    });
    const wheel = async (direction,p) => {
      await page.evaluate(({direction,p})=>document.querySelector('#svg').dispatchEvent(new WheelEvent('wheel',{
        clientX:p.screenX,clientY:p.screenY,deltaY:direction*10000,cancelable:true
      })),{direction,p});
    };
    const camera = () => page.evaluate(()=>{
      const list=document.querySelector('#svg > g').transform.baseVal;
      return {tx:list.getItem(0).matrix.e,ty:list.getItem(0).matrix.f,scale:list.getItem(1).matrix.a};
    });
    const original=await node();
    for(let i=0;i<5;i++) await wheel(-1,original);
    assert.equal(await page.locator('#zoomScale').textContent(),'1000×');
    near((await node()).screenX,original.screenX); near((await node()).screenY,original.screenY);
    assert.equal(await page.locator('#svg').getAttribute('data-modl-simple'),'');
    await page.mouse.move(original.screenX,original.screenY); await page.mouse.down();
    await page.mouse.move(original.screenX+23,original.screenY+17); await page.mouse.up(); await frame();
    const moved=await node(); near(moved.x,original.x+.023,1e-7); near(moved.y,original.y+.017,1e-7);
    near(moved.screenX,original.screenX+23); near(moved.screenY,original.screenY+17);
    const beforePan=await camera();
    await page.mouse.move(moved.screenX,moved.screenY); await page.mouse.down({button:'middle'});
    await page.mouse.move(moved.screenX+31,moved.screenY+19); await page.mouse.up({button:'middle'});
    const afterPan=await camera(); near(afterPan.tx-beforePan.tx,31); near(afterPan.ty-beforePan.ty,19);
    near((await node()).x,moved.x,1e-7);
    // Export the native SVG and rasterize it, retaining all offscreen geometry.
    const exported=await page.evaluate(async()=>{
      const svg=document.querySelector('#svg'),copy=svg.cloneNode(true),box=svg.viewBox.baseVal;
      copy.setAttribute('width',box.width); copy.setAttribute('height',box.height);
      const source=new XMLSerializer().serializeToString(copy),image=new Image();
      image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source); await image.decode();
      const canvas=document.createElement('canvas'); canvas.width=box.width; canvas.height=box.height;
      const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0);
      return {source,alpha:ctx.getImageData(Math.floor(box.width/2),Math.floor(box.height/2),1,1).data[3]};
    });
    assert.ok(!/NaN|Infinity/.test(exported.source)); assert.equal(exported.alpha,255);
    assert.ok(exported.source.includes('data-node-id="b"')); assert.ok(exported.source.includes('marker-end="url(#arrow-purple)"'));
    await page.locator('#btnResetView').click(); assert.equal(await page.locator('#zoomScale').textContent(),'1×');
    assert.equal(await page.locator('#svg').getAttribute('data-modl-simple'),null);
    await page.locator('#btnZoomIn').click(); assert.equal(await page.locator('#zoomScale').textContent(),'1.2×');
    await page.locator('#btnZoomOut').click(); assert.equal(await page.locator('#zoomScale').textContent(),'1×');
    for(let i=0;i<5;i++) await wheel(1,await node());
    assert.equal(await page.locator('#zoomScale').textContent(),'0.001×');
    const minPan=await camera();
    await page.mouse.move(original.screenX,original.screenY); await page.mouse.down({button:'middle'});
    await page.mouse.move(original.screenX+13,original.screenY+11); await page.mouse.up({button:'middle'});
    near((await camera()).tx-minPan.tx,13); near((await camera()).ty-minPan.ty,11);
    await page.reload(); await page.locator('[data-node-id="a"] rect').waitFor();
    near((await node()).x,moved.x,1e-7); near((await node()).y,moved.y,1e-7);
    assert.equal(await page.locator('#zoomScale').textContent(),'1×');
    assert.deepEqual(errors,[]);
    console.log(`${engine}: ${base} deep-zoom clamps, cursor anchor, fractional dragging, panning, SVG raster export and saved positions passed`);
  } finally { await browser.close(); }
}
(async()=>{for(const engine of engines) await run(engine);})().catch(error=>{console.error(error);process.exitCode=1;});
