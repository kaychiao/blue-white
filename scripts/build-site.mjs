import {cp,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
// Only these public resources are deployed; content/, docs/, tests/ and secrets stay out.
export async function buildSite(destination=resolve(root,'_site')){
  await rm(destination,{recursive:true,force:true});
  await mkdir(destination,{recursive:true});
  for(const entry of ['index.html','assets','data'])await cp(resolve(root,entry),resolve(destination,entry),{recursive:true});
  return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){await buildSite();console.log('Static site prepared in _site/');}
