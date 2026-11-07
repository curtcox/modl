import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSource} from '../../js/parse.js';
import {renderDiagram} from '../../js/render.js';
class Element {
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];this.style={};this.events={};}
  setAttribute(k,v){this.attributes[k]=String(v);}
  removeAttribute(k){delete this.attributes[k];}
  toggleAttribute(k,value){if(value)this.setAttribute(k,'');else this.removeAttribute(k);}
  appendChild(el){this.children.push(el);return el;}
  insertBefore(el,before){this.children.splice(this.children.indexOf(before),0,el);}
  addEventListener(event,handler){this.events[event]=handler;}
  cloneNode(){const el=new Element(this.tag);el.attributes={...this.attributes};return el;}
  getBoundingClientRect(){return {width:800,height:600};}
  set innerHTML(value){this.children=[];}
}
const all=el=>[el,...el.children.flatMap(all)];
function drawing(source,options={}) {
  const old=globalThis.document;
  globalThis.document={createElementNS:(_,tag)=>new Element(tag)};
  try{const svg=new Element('svg'),model=parseSource(source);const output=renderDiagram(svg,model,options);return{svg,output,elements:all(svg)};}
  finally{globalThis.document=old;}
}
test('renderer preserves fractions, styles, labels and review marks without editor startup',()=>{
  const positions={a:[120.125,110.25],b:[420,110]},marks=['a','L4'];
  const result=drawing('a square blue Target\nb hex green Other\n\na -> b dashed purple Link',{positions,marks});
  const node=result.elements.find(e=>e.attributes['data-node-id']==='a');
  assert.match(node.style.filter,/red/);
  assert.ok(result.elements.some(e=>e.tag==='rect'&&e.attributes.x==='65.125'));
  assert.ok(result.elements.some(e=>e.attributes['stroke-dasharray']==='10 7'));
  assert.ok(result.elements.some(e=>e.textContent==='Target'));
  assert.deepEqual(positions.a,[120.125,110.25]);
  assert.ok(result.output.viewportGroup);
});
test('host callbacks own drag and navigation; renderer performs no navigation',()=>{
  let dragged;
  const result=drawing('a square Target',{onDrag:(event,id)=>{dragged=id;}});
  result.elements.find(e=>e.attributes['data-node-id']==='a').events.pointerdown({});
  assert.equal(dragged,'a');
});
test('each native shape renders, including none and groups',()=>{
  for(const shape of ['none','circle','square','diamond','triangle','hex','note','cylinder','parallelogram','stadium','subroutine','oval']){
    const result=drawing(`a ${shape} Target`);
    assert.ok(result.elements.some(e=>e.attributes['data-node-id']==='a'),shape);
  }
  assert.ok(drawing('g {\na square Target\n}').elements.some(e=>e.attributes['data-group-id']==='g'));
});
