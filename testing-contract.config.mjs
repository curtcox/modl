import{test}from'@playwright/test';test.setTimeout(120000);
export default{
 ready:'body[data-ready="true"]',editor:'#src',status:'#hashbin-status',draftKey:'modl:draft',more:'#more-toggle',share:'#btnCopy',qr:'#btnQr',tabs:['Text','Diagram'],example:'diagram-1',cachePrefix:'modl-offline-',offlineAsset:'js/fragment-ui.css',kitURL:'./vendor/fragment-kit-v0.4.3/src/index.js',
 source:text=>'# '+text.replaceAll('\n','\n# ')+'\nnode circle blue Note',
 isWrittenURL:href=>new URL(href).hash.startsWith('#h1='),
 getSource:page=>page.evaluate(()=>ModlApp.getSource()),getDocument:page=>page.evaluate(()=>ModlApp.getSnapshot()),edit:(page,src)=>page.locator('#src').fill(src),
 openMore:async page=>{if(!await page.locator('#fk-more-drawer').isVisible())await page.click('#more-toggle');},
 configureHashBin:async(context,clientId)=>context.route('**/fragment-kit.config.json',async route=>{const response=await route.fetch();const config=await response.json();config.hashbinClientId=clientId;await route.fulfill({response,json:config});}),
 build:(page,doc,canonical=false)=>page.evaluate(async({doc,canonical})=>{const{urlState,config}=await import('./js/fragment-config.js');return urlState.build(doc,canonical?{url:config.canonicalOrigin}:{}).href;},{doc,canonical})
};
