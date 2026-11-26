const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function environment(){
 const events={},elements={},handlers={};
 const context2d=new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:1})},{get(target,key){return key in target?target[key]:(...args)=>{if(['arc','lineTo','moveTo'].includes(key))for(const x of args)assert(Number.isFinite(x),'finite canvas coordinate')}}});
 function el(){return{style:{setProperty(){}},classList:{add(){},toggle(){}},dataset:{},children:[],textContent:'',value:'',width:300,height:300,append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},getContext:()=>context2d,getBoundingClientRect:()=>({width:420,height:400}),setAttribute(){},addEventListener(e,f){(handlers[this.id+'-'+e]??=[]).push(f)}}}
 const doc={hidden:false,body:el(),getElementById(id){if(!elements[id]){elements[id]=el();elements[id].id=id}return elements[id]},createElement:()=>el(),addEventListener(e,f){(events[e]??=[]).push(f)},dispatchEvent(e){for(const f of events[e.type]||[])f(e)}};
 const window={holidayConfig:{specialDates:[]}};let raf=0;
 const c={document:doc,window,Intl,Date,Math,Object,Array,Set,Number,devicePixelRatio:2,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},matchMedia:()=>({matches:true,addEventListener(){}}),performance:{now:()=>0},requestAnimationFrame:()=>++raf,cancelAnimationFrame(){},ResizeObserver:class{observe(){}},setInterval(){},fitTitle(){},makeCopy(){window.Holiday?.applyCopy()}};
 vm.createContext(c);return {c,window,doc,elements,handlers};
}
test('Shanghai solar and lunar holidays, special dates, theme previews',()=>{
 const {c,window,doc,handlers}=environment();vm.runInContext(fs.readFileSync('holidays.js','utf8'),c);const detect=s=>window.Holiday.detect(new Date(s));
 assert.equal(detect('2026-12-31T16:00:00Z').id,'newyear');
 assert.equal(detect('2026-12-25T00:00:00Z').id,'christmas');
 assert.equal(detect('2026-02-17T04:00:00Z').id,'spring');
 assert.equal(detect('2026-03-03T04:00:00Z').id,'lantern');
 assert.equal(detect('2026-09-25T04:00:00Z').id,'moon');
 assert.equal(detect('2026-11-26T04:00:00Z').id,'daily');
 window.holidayConfig.specialDates=[{month:11,day:26,label:'特别的一天',kind:'birthday'}];assert.equal(detect('2026-11-26T04:00:00Z').id,'birthday');
 for(const id of Object.keys(window.Holiday.templates)){handlers['holidayTheme-change'][0]({target:{value:id}});assert.equal(doc.body.dataset.holiday,id);assert(doc.getElementById('poem').textContent);}
});
test('Every scene renders finite geometry and can respond in reduced motion',()=>{
 const {c,window,handlers}=environment();vm.runInContext(fs.readFileSync('scenes.js','utf8'),c);
 assert.equal(window.MathScenes.catalog.length,17);
 for(const [id]of window.MathScenes.catalog){window.MathScenes.choose(id);handlers['artwork-click'][0]();}
 for(let i=0;i<30;i++)window.MathScenes.next();
});
test('10-second refresh changes copy only, pauses hidden and refreshes on return',()=>{
 let timer,changes=0,hidden=false;const listeners={};const c={makeCopy(){changes++},clearTimeout(){timer=null},setTimeout(fn,delay){assert.equal(delay,10000);timer=fn},document:{get hidden(){return hidden},addEventListener(e,f){listeners[e]=f}},window:{addEventListener(){}}};
 vm.runInNewContext(fs.readFileSync('page-refresh.js','utf8'),c);timer();assert.equal(changes,1);hidden=true;listeners.visibilitychange();assert.equal(timer,null);hidden=false;listeners.visibilitychange();assert.equal(changes,2);
});
