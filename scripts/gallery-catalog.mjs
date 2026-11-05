import fs from'node:fs/promises';
const catalog=[],seen=new Set();
const plain=text=>text.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').trim();
for(const name of(await fs.readdir('docs')).filter(name=>name==='examples.html').sort()){
 const html=await fs.readFile('docs/'+name,'utf8');
 for(const figure of html.matchAll(/<figure class="example">([\s\S]*?)<\/figure>/g)){
  const link=/href="\.\.\/#h1=([^"]+)"/.exec(figure[1]);if(!link||seen.has(link[1]))continue;seen.add(link[1]);
  const document=JSON.parse(Buffer.from(link[1],'base64url').toString('utf8')),caption=/<figcaption>([\s\S]*?)<\/figcaption>/.exec(figure[1]);
  const title=caption?plain(caption[1]):name.replace('.html','')+' '+(catalog.length+1);
  catalog.push({id:'diagram-'+(catalog.length+1),title,tags:[name.replace('.html','')],description:document.src.split('\n').find(line=>line.trim())?.replace(/^#\s*/,'')??title,document});
 }
}
const source='// Generated from the original app-owned documentation links.\nexport const catalog='+JSON.stringify(catalog,null,2)+';\n';
if(process.argv.includes('--check')){if(await fs.readFile('js/gallery-catalog.js','utf8')!==source)throw Error('Gallery catalog is stale.');}
else await fs.writeFile('js/gallery-catalog.js',source);
console.log(catalog.length+' original diagram examples current.');
