import {mountGalleryAi,aiCallback} from './ai-client.js';
import {config,type} from './fragment-config.js';
if(aiCallback()) await new Promise(()=>{});
function mountGallery(options){const gallery=mountOriginalGallery(options);queueMicrotask(()=>void mountGalleryAi({config,type,...options}).catch(error=>{const p=document.createElement('p');p.setAttribute('role','status');p.textContent=error.message;options.container.before(p);}));return gallery;}
import{catalog}from'./gallery-catalog.js';
import{mountGallery as mountOriginalGallery}from'../vendor/fragment-kit-v0.4.3/src/index.js';
import{urlState}from'./fragment-config.js';
mountGallery({container:document.getElementById('gallery'),catalog:catalog.map(example=>({...example,cover:'gallery/covers/'+example.id+'.png'})),urlState:{build:doc=>urlState.build(doc,{url:new URL('index.html',location.href).href})}});
