import{cp,mkdir,rm}from'node:fs/promises';
import{publicAssets}from'./public-assets.mjs';
import{offlineManifest}from'./offline-assets.mjs';
export async function stage(destination='_site'){
 await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
 for(const file of publicAssets){await mkdir(destination+'/'+file.split('/').slice(0,-1).join('/'),{recursive:true});await cp(file,destination+'/'+file,{recursive:true});}
 await offlineManifest(destination);
}
if(process.argv[1]===new URL(import.meta.url).pathname)await stage();
