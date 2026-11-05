import{writeFile,rm}from'node:fs/promises';
import path from'node:path';
import{generateOffline}from'../vendor/fragment-kit-v0.3.4/tools/offline-assets.mjs';
import{publicAssets}from'./public-assets.mjs';
export async function offlineManifest(root='.',check=false){
 const temporary=path.join(root,'.offline-build.json');
 try{await writeFile(temporary,JSON.stringify({prefix:'modl-offline',files:publicAssets}));return await generateOffline(temporary,check);}finally{await rm(temporary,{force:true});}
}
