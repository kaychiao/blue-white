import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validate,activeEvents,unsafeTime} from '../scripts/generate-copy.mjs';
const fixture=()=>({notes:Array.from({length:8},(_,i)=>({title:`留一点小期待${i}，愿你今天顺利。`,accent:'顺利',body:'那次吃的手抛饭，还想听你讲讲。',personal:'之前忙的时候辛苦了，记得歇一会儿。',code:'愿灵感和好心情都慢慢来。',thought:'很高兴认识你，也期待下次见面。'}))});
test('Generated copy rejects unsupported relative times in every field',()=>{
 assert.doesNotThrow(()=>validate(fixture()));
 for(const field of Object.keys(fixture().notes[0]))for(const text of ['昨天','昨晚','前两天','前几天','三天前','上周','2026年11月']){
  const batch=fixture();batch.notes[0][field]=text;assert.throws(()=>validate(batch),/Invalid field/);
 }
});
test('Event occurrence date and reference expiry remain distinct; expired and future events are excluded',()=>{
 const old={date:'2026-11-22',expires:'2026-11-28',fact:'吃了手抛饭，工作忙到很晚'};
 const result=activeEvents({events:[old,{...old,expires:'2026-11-25'},{...old,date:'2026-11-27'}]},'2026-11-26');
 assert.deepEqual(result,[old]);assert.equal(result[0].date,'2026-11-22');
 assert.throws(()=>activeEvents({events:[{...old,date:'2026-02-30'}]}));
 assert.throws(()=>activeEvents({events:[{...old,expires:'2026-11-20'}]}));
});
test('Manual fallback does not turn past events into yesterday or last night',async()=>{
 const context={window:{}};vm.runInNewContext(await readFile(new URL('../daily-copy.js',import.meta.url),'utf8'),context);
 const strings=[];function collect(value){if(typeof value==='string')strings.push(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect)}collect(context.window.dailyCopy);
 assert(strings.length>100);for(const text of strings)assert(!/昨天|昨晚|前天|前两天|前几天/.test(text),text);
});
test('Gemini repairs invalid content once and never retries HTTP failures',async()=>{
 const {generateValidatedCopy}=await import('../scripts/generate-copy.mjs');
 let calls=0;const invalid=fixture();invalid.notes[0].body='昨晚吃了手抛饭';invalid.notes[1].personal='很'.repeat(33);
 const fetcher=async(url,options)=>{calls++;if(calls===2){const request=JSON.parse(options.body);assert.equal(request.contents.length,3);const feedback=request.contents[2].parts[0].text;assert.match(feedback,/relative time or date/);assert.match(feedback,/length 33 exceeds 32/)}return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(calls===1?invalid:fixture())}]}}]})}};
 assert.equal((await generateValidatedCopy('test','test-model','not-a-real-key',fetcher)).notes.length,8);assert.equal(calls,2);
 calls=0;await assert.rejects(()=>generateValidatedCopy('test','test-model','not-a-real-key',async()=>{calls++;return{ok:false,status:402}}),/HTTP 402/);assert.equal(calls,1);
 calls=0;await assert.rejects(()=>generateValidatedCopy('test','test-model','not-a-real-key',async()=>{calls++;return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(invalid)}]}}]})}}),/Invalid field/);assert.equal(calls,2);
});
test('Complete title is preserved verbatim through highlighting; fragments and editorial notes are rejected',async()=>{
 const context={window:{}};vm.runInNewContext(await readFile(new URL('../copy-title.js',import.meta.url),'utf8'),context);
 const note={title:'把一点蓝色留在这里，等你有空时路过。',accent:'有空时路过'};
 const parts=context.window.copyTitleParts(note);assert.equal(parts.first+parts.before+parts.accent+parts.after,note.title);assert.equal(parts.after,'。');
 assert.equal(context.window.copyTitleParts({...note,accent:'随意追加'}),null);
 for(const title of ['营销的视野，敏锐你真。','忙碌的痕迹，心疼的。']){const batch=fixture();batch.notes[0].title=title;batch.notes[0].accent='敏锐';assert.throws(()=>validate(batch));}
 const batch=fixture();batch.notes[0].thought='表达对 Fred 工作的肯定和欣赏。';assert.throws(()=>validate(batch),/writing instructions/);
});
test('AI copy gets an editorial pass even when its structure already validates',async()=>{
 const {generateValidatedCopy}=await import('../scripts/generate-copy.mjs');let calls=0;
 await generateValidatedCopy('test','test-model','fake',async(url,options)=>{calls++;if(calls===2)assert.match(JSON.parse(options.body).contents[2].parts[0].text,/逐条审校/);return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(fixture())}]}}]})}});assert.equal(calls,2);
});
