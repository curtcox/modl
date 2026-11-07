import fs from'node:fs/promises';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const source=await fs.readFile('js/editor.js','utf8'),integrity=JSON.parse(await fs.readFile('engine-integrity.json','utf8'));
const engine=source.slice(source.indexOf('  // -----------------------------\n  // Layout + Rendering'),source.indexOf('  // -----------------------------\n  // App state + rendering loop'));
const parser=await fs.readFile('js/parse.js','utf8');
const vocab=parser.slice(parser.indexOf('  const NODE_SIZES'),parser.indexOf('  // -----------------------------\n  // Parsing DSL'));
for(const[key,value]of Object.entries({engineSha256:engine,vocabularySha256:vocab,parserSha256:parser,featuresSha256:await fs.readFile('js/diagram-features.js','utf8'),rendererSha256:await fs.readFile('js/render.js','utf8')}))if(createHash('sha256').update(value).digest('hex')!==integrity[key])throw Error('Original MODL engine changed: '+key);
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())await walk(file);else if(/\.(?:js|mjs|cjs)$/.test(file))execFileSync(process.execPath,['--check',file]);}}
for(const dir of['js','scripts','tests'])await walk(dir);
for(const script of['build-docs','gallery-catalog','render-kit-gallery','update-offline'])execFileSync(process.execPath,['scripts/'+script+'.mjs','--check'],{stdio:'inherit'});
execFileSync(process.execPath,['vendor/fragment-kit-v0.3.4/tools/vendor-sync.mjs','--check','--target','.'],{stdio:'inherit'});
console.log('Pinned engine, renderer and vocabulary verified; generated assets and immutable kit are current.');
