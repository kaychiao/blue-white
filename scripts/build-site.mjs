import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
// Only these public resources are deployed; content/, docs/, tests/ and secrets stay out.
export async function buildSite(destination=resolve(root,'_site')){
  await rm(destination,{recursive:true,force:true});
  await mkdir(destination,{recursive:true});
  for(const entry of ['index.html','assets','data'])await cp(resolve(root,entry),resolve(destination,entry),{recursive:true});
  let html=await readFile(resolve(destination,'index.html'),'utf8');
  for(const [,asset] of [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+\.(?:js|css))"/g)]){
    const hash=createHash('sha256').update(await readFile(resolve(destination,asset))).digest('hex').slice(0,12);
    html=html.replaceAll(`"${asset}"`,`"${asset}?v=${hash}"`);
  }
  await writeFile(resolve(destination,'index.html'),html);
  return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){await buildSite();console.log('Static site prepared in _site/');}
