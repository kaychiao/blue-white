import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {buildSite} from '../scripts/build-site.mjs';

test('Published site preserves all entry resources and dynamic weather loading without copying private source',async t=>{
  const destination=await mkdtemp(join(tmpdir(),'bw-site-'));t.after(()=>rm(destination,{recursive:true,force:true}));
  await buildSite(destination);
  assert.deepEqual((await readdir(destination)).sort(),['assets','data','index.html']);
  const html=await readFile(join(destination,'index.html'),'utf8');
  const refs=[...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)].map(m=>m[1]);
  assert(refs.length>=18);
  assert.match(html,/assets\/css\/main\.css\?v=[a-f0-9]{12}/);
  assert.match(html,/assets\/js\/app\.js\?v=[a-f0-9]{12}/);
  for(const ref of refs)await access(resolve(destination,ref));
  assert(html.indexOf('longing-model.js')<html.indexOf('src="./assets/js/longing.js'));
  const weather=await readFile(join(destination,'assets/js/weather.js'),'utf8');
  const snapshot=weather.match(/script\.src='([^']+)'/)[1];await access(resolve(destination,snapshot));
  assert(!html.includes('<style>'));assert(!html.includes('<script>'));
});

test('Local documentation links remain valid after moving guides into docs',async()=>{
  const files=['README.md',...(await readdir('docs')).filter(f=>f.endsWith('.md')).map(f=>'docs/'+f)];
  for(const file of files){
    const markdown=await readFile(file,'utf8');
    for(const [,link] of markdown.matchAll(/\]\(([^)]+)\)/g)){
      if(/^(https?:|#)/.test(link))continue;
      await access(new URL(link.split('#')[0],new URL('../'+file,import.meta.url)));
    }
  }
});
