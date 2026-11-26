const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function environment(){
 const events={},elements={},handlers={};
 const context2d=new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:1})},{get(target,key){return key in target?target[key]:(...args)=>{if(['arc','lineTo','moveTo'].includes(key))for(const x of args)assert(Number.isFinite(x),'finite canvas coordinate')}}});
 function el(){return{style:{setProperty(){}},classList:{add(){},toggle(){}},dataset:{},attributes:{},hidden:false,offsetWidth:340,offsetHeight:340,children:[],textContent:'',value:'',width:300,height:300,append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},getContext:()=>context2d,getBoundingClientRect:()=>({width:420,height:400,top:520,bottom:564,left:420}),setAttribute(key,value){this.attributes[key]=value},focus(){doc.activeElement=this},scrollIntoView(){},contains(target){return target===this||this.children.some(x=>x.contains(target))},addEventListener(e,f){(handlers[this.id+'-'+e]??=[]).push(f)}}}
 const doc={hidden:false,documentElement:{clientWidth:1280},body:el(),getElementById(id){if(!elements[id]){elements[id]=el();elements[id].id=id}return elements[id]},createElement:()=>el(),addEventListener(e,f){(events[e]??=[]).push(f)},dispatchEvent(e){for(const f of events[e.type]||[])f(e)}};
 const window={innerHeight:900,addEventListener(){},holidayConfig:{specialDates:[]}};let raf=0;
 const c={document:doc,window,Intl,Date,Math,Object,Array,Set,Number,devicePixelRatio:2,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},matchMedia:()=>({matches:true,addEventListener(){}}),performance:{now:()=>0},requestAnimationFrame:()=>++raf,cancelAnimationFrame(){},ResizeObserver:class{observe(){}},setInterval(){},fitTitle(){},makeCopy(){window.Holiday?.applyCopy()}};
 vm.createContext(c);return {c,window,doc,elements,handlers};
}
test('Shanghai solar and lunar holidays, special dates and automatic holiday copy',()=>{
 const {c,window,doc,handlers}=environment();vm.runInContext(fs.readFileSync('holidays.js','utf8'),c);const detect=s=>window.Holiday.detect(new Date(s));
 assert.equal(detect('2026-12-31T16:00:00Z').id,'newyear');
 assert.equal(detect('2026-12-25T00:00:00Z').id,'christmas');
 assert.equal(detect('2026-02-17T04:00:00Z').id,'spring');
 assert.equal(detect('2026-03-03T04:00:00Z').id,'lantern');
 assert.equal(detect('2026-09-25T04:00:00Z').id,'moon');
 assert.equal(detect('2026-11-26T04:00:00Z').id,'daily');
 window.holidayConfig.specialDates=[{month:11,day:26,label:'特别的一天',kind:'birthday'}];assert.equal(detect('2026-11-26T04:00:00Z').id,'birthday');
 const dates={newyear:'2027-01-01',spring:'2026-02-17',christmas:'2026-12-25',lantern:'2026-03-03',qixi:'2026-08-19',moon:'2026-09-25',birthday:'2026-11-26',anniversary:'2026-11-26'};
 for(const [id,date] of Object.entries(dates)){const env=environment();env.c.Date=class extends Date{constructor(...args){super(...(args.length?args:[date+'T04:00:00Z']))}};if(['birthday','anniversary'].includes(id))env.window.holidayConfig.specialDates=[{month:11,day:26,label:'特别的一天',kind:id}];vm.runInContext(fs.readFileSync('holidays.js','utf8'),env.c);assert.equal(env.doc.body.dataset.holiday,id);assert(env.doc.getElementById('poem').textContent);assert(!env.handlers['holidayTheme-change']);}

});
test('Every scene renders finite geometry and can respond in reduced motion',()=>{
 const {c,window,handlers}=environment();vm.runInContext(fs.readFileSync('scenes.js','utf8'),c);
 assert.equal(window.MathScenes.catalog.length,17);
 for(const [id]of window.MathScenes.catalog){window.MathScenes.choose(id);handlers['artwork-click'][0]({detail:1});}
 for(let i=0;i<30;i++)window.MathScenes.next();
});
test('10-second refresh changes copy only, pauses hidden and refreshes on return',()=>{
 let timer,changes=0,hidden=false;const listeners={};const c={makeCopy(){changes++},clearTimeout(){timer=null},setTimeout(fn,delay){assert.equal(delay,10000);timer=fn},document:{get hidden(){return hidden},addEventListener(e,f){listeners[e]=f}},window:{addEventListener(){}}};
 vm.runInNewContext(fs.readFileSync('page-refresh.js','utf8'),c);timer();assert.equal(changes,1);hidden=true;listeners.visibilitychange();assert.equal(timer,null);hidden=false;listeners.visibilitychange();assert.equal(changes,2);
});

test('Click cycles scenes without repeats; dragging rotates without switching; keyboard activation works',()=>{
 const {c,window,elements,handlers}=environment();vm.runInContext(fs.readFileSync('scenes.js','utf8'),c);
 window.MathScenes.choose('stars');const label=()=>elements.orbitLabel.textContent,click=detail=>handlers['artwork-click'][0]({detail});
 const round=new Set([label()]);for(let i=0;i<11;i++){click(1);assert(!round.has(label()),'no repeated scene within a round');round.add(label())}assert.equal(round.size,12);
 const last=label();click(1);assert.notEqual(label(),last,'new round never starts with the current scene');
 const beforeDrag=label();handlers['artwork-pointerdown'][0]({clientX:10,clientY:10});for(let x=11;x<25;x++)handlers['artwork-pointermove'][0]({clientX:x,clientY:10});handlers['artwork-pointerup'][0]();click(1);assert.equal(label(),beforeDrag);
 click(0);assert.notEqual(label(),beforeDrag,'keyboard click switches scenes');assert.match(elements.artwork.attributes['aria-label'],/点击切换/);
 const html=fs.readFileSync('index.html','utf8');for(const removed of ['sceneSelect','sceneGallery','scenePrevious','sceneNext','holidayTheme'])assert(!html.includes('id="'+removed+'"'));
});
