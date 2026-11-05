import{catalog}from'./js/gallery-catalog.js';
export default{catalog,output:'gallery/covers',dependencies:['js/editor.js','js/fragment-config.js','js/gallery-catalog.js','engine-integrity.json'],async renderCover(page,example){
 const base=process.env.GALLERY_BASE_URL??'http://127.0.0.1:8012/';
 const url=new URL(base);url.hash='h1='+Buffer.from(JSON.stringify(example.document)).toString('base64url');
 await page.goto(url.href);await page.locator('body[data-ready="true"]').waitFor();await page.locator('#btnViewDiagram').evaluate(button=>button.click());await page.locator('#svg g[data-node-id]').first().waitFor();await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>{}))));return page.locator('.svgWrap');
}};
