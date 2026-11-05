import * as kit from'../vendor/fragment-kit-v0.3.4/src/index.js';
import settings from'../fragment-kit.config.json' with{type:'json'};
export const config=kit.createConfig(settings);
export function positions(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid diagram positions.');
 const output=Object.create(null);
 for(const id of Object.keys(value).sort()){
  const pair=value[id];if(!Array.isArray(pair)||pair.length!==2||pair.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw Error('Diagram positions must contain two finite coordinates.');
  output[id]=[...pair];
 }
 return output;
}
export const type={type:'modl',settingsKeys:['view'],fileName:'diagram.json',contentType:'application/json',legacyEnvelopeTypes:['hashbin-diagram:'],
 normalize(value){kit.bounded(value?.src,config.maxBytes);const options=value.modl??value;return{src:value.src,modl:{pos:positions(value.modl?.pos??value.pos),autorun:options.autorun!==false,view:['source','diagram','help'].includes(options.view)?options.view:'split'}};},
 isDefault:doc=>!Object.keys(doc.modl.pos).length&&doc.modl.autorun&&doc.modl.view==='split',
 parseLegacy(text){let value;try{value=JSON.parse(text);}catch{return undefined;}if(value&&typeof value.src==='string'){if(value.format&&value.format!=='hashbin-diagram')throw Error('This saved document is not a MODL diagram.');if(value.version!==undefined&&value.version!==1)throw Error('Unsupported saved document version.');return type.normalize(value);}return undefined;}
};
export const fromDocument=value=>{const doc=type.normalize(value);return{src:doc.src,pos:doc.modl.pos,...doc.modl.autorun?{}:{autorun:false},...doc.modl.view!=='split'?{view:doc.modl.view}:{}};};
export const serializeLegacy=value=>{const doc=fromDocument(value);return kit.bounded(JSON.stringify({format:'hashbin-diagram',version:1,src:doc.src,pos:doc.pos,...doc.autorun===false||doc.view?{modl:{...doc.autorun===false?{autorun:false}:{},...doc.view?{view:doc.view}:{}}}:{}}),config.maxBytes);};
export const encodeState=value=>kit.bounded('h1='+kit.encode64(kit.bytes(JSON.stringify(fromDocument(value)))),Math.ceil(config.maxBytes*4/3)+8);
const legacyWriter=(doc,{url,run,view})=>{const value=fromDocument(doc);value.autorun=run??doc.modl.autorun;value.view=view??doc.modl.view;url.hash=encodeState(value);if(value.autorun===false)url.searchParams.set('run','0');if(value.view!=='split')url.searchParams.set('view',value.view);return url.href;};
export const urlState=kit.createUrlState({config,type,legacyWriter});
export const documents={...urlState.documents,serialize:serializeLegacy,parse:text=>fromDocument(urlState.documents.parse(text))};
export function transactions(storage,clientId=config.hashbinClientId){if(!storage)return;const scoped=kit.createStorage({prefix:config.storagePrefix,storage}),owned=key=>key.startsWith('hashbin:publish:'+clientId+':');return{getItem(key){const value=scoped.getItem(key);if(value!==null||!owned(key))return value;try{return storage.getItem(key);}catch{return null;}},setItem:(key,value)=>scoped.setItem(key,value),removeItem(key){scoped.removeItem(key);if(owned(key))try{storage.removeItem(key);}catch{}}};}
export class HashBinStore extends kit.HashBinStore{
 constructor(options={}){
  let session;try{session=globalThis.sessionStorage;}catch{}
  const load=options.loadSDK??(()=>import('../vendor/fragment-kit-v0.3.4/vendor/hashbin-sdk-v0.4.0.mjs'));
  super({config,type,...options,transactionStorage:transactions(options.transactionStorage??session,options.clientId??config.hashbinClientId),loadSDK:async()=>{
   const sdk=await load();return{...sdk,HashBinClient:class extends sdk.HashBinClient{
    constructor(clientOptions){super({...clientOptions,baseUrl:options.apiBase??clientOptions.baseUrl,contentBaseUrl:options.contentBase??clientOptions.contentBaseUrl});}
    async handlePublishCallback(options){
     const convert=value=>{if(value?.clientState?.payload&&!value.clientState.snapshot)return{...value,clientState:{...value.clientState,snapshot:documents.parse(value.clientState.payload)}};return value;};
     try{return convert(await super.handlePublishCallback(options));}catch(error){const converted=convert(error);error.clientState=converted.clientState;throw error;}
    }
   }};
  }});
  this.documents={...this.documents,serialize:serializeLegacy};
 }
 load=async input=>fromDocument(await super.load(input));
 async published(hash){const result=await super.published(hash);return result?.snapshot?{...result,snapshot:fromDocument(result.snapshot)}:result;}
}
