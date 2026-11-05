import{catalog}from'./gallery-catalog.js';
import{mountGallery}from'../vendor/fragment-kit-v0.3.4/src/index.js';
import{urlState}from'./fragment-config.js';
mountGallery({container:document.getElementById('gallery'),catalog:catalog.map(example=>({...example,cover:'gallery/covers/'+example.id+'.png'})),urlState:{build:doc=>urlState.build(doc,{url:new URL('index.html',location.href).href})}});
