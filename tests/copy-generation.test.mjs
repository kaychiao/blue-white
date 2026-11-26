import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validate,activeEvents,unsafeTime} from '../scripts/generate-copy.mjs';
const fixture=()=>({notes:Array.from({length:8},(_,i)=>({first:`留一点小期待${i}`,second:'愿你今天',accent:'顺利',body:'那次吃的手抛饭，还想听你讲讲。',personal:'之前忙的时候辛苦了，记得歇一会儿。',code:'愿灵感和好心情都慢慢来。',thought:'很高兴认识你，也期待下次见面。'}))});
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
