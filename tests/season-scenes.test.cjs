const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function environment(){
 const events={},elements={},handlers={},timers=new Map();let timeoutId=0;
 const context2d=new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:1})},{get(target,key){return key in target?target[key]:(...args)=>{if(['arc','lineTo','moveTo'].includes(key))for(const x of args)assert(Number.isFinite(x),'finite canvas coordinate')}}});
 function el(){return{style:{setProperty(){}},classList:{add(){},toggle(){}},dataset:{},attributes:{},hidden:false,offsetWidth:340,offsetHeight:340,children:[],textContent:'',value:'',width:300,height:300,append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},getContext:()=>context2d,getBoundingClientRect:()=>({width:420,height:400,top:520,bottom:564,left:420}),setAttribute(key,value){this.attributes[key]=value},focus(){doc.activeElement=this},scrollIntoView(){},contains(target){return target===this||this.children.some(x=>x.contains(target))},addEventListener(e,f){(handlers[this.id+'-'+e]??=[]).push(f)}}}
 const doc={hidden:false,documentElement:{clientWidth:1280},body:el(),getElementById(id){if(!elements[id]){elements[id]=el();elements[id].id=id}return elements[id]},createElement:()=>el(),addEventListener(e,f){(events[e]??=[]).push(f)},dispatchEvent(e){for(const f of events[e.type]||[])f(e)}};
 const window={innerHeight:900,addEventListener(){},holidayConfig:{specialDates:[]}};let raf=0;
 const c={document:doc,window,Intl,Date,Math,Object,Array,Set,Number,devicePixelRatio:2,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},matchMedia:()=>({matches:true,addEventListener(){}}),performance:{now:()=>0},requestAnimationFrame:()=>++raf,cancelAnimationFrame(){},ResizeObserver:class{observe(){}},setInterval(){},setTimeout(fn,ms){const id=++timeoutId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},fitTitle(){},makeCopy(){window.Holiday?.applyCopy()}};
 vm.createContext(c);return {c,window,doc,elements,handlers,timers};
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
test('520-second refresh waits until due on return and resets after manual changes',()=>{
 let timer,delay,now=0,changes=0,hidden=false;const listeners={},windowEvents={};let manual;
 const c={Date:{now:()=>now},makeCopy(){changes++},clearTimeout(){timer=null},setTimeout(fn,ms){delay=ms;timer=fn},document:{get hidden(){return hidden},getElementById(){return{addEventListener(e,f){manual=f}}},addEventListener(e,f){listeners[e]=f}},window:{addEventListener(e,f){windowEvents[e]=f}}};
 vm.runInNewContext(fs.readFileSync('page-refresh.js','utf8'),c);assert.equal(delay,520000);
 now=10000;hidden=true;listeners.visibilitychange();assert.equal(timer,null);now=20000;hidden=false;listeners.visibilitychange();assert.equal(changes,0);assert.equal(delay,500000);
 now=520000;timer();assert.equal(changes,1);assert.equal(delay,520000);
 now=600000;manual();assert.equal(delay,520000);now=610000;windowEvents.pageshow({persisted:true});assert.equal(changes,1);assert.equal(delay,510000);
 hidden=true;listeners.visibilitychange();now=1200000;hidden=false;listeners.visibilitychange();assert.equal(changes,2);assert.equal(delay,520000);
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

test('Long-press secret and scene switching cooperate without changing the selected artwork',()=>{
 const {c,window,elements,handlers,timers}=environment();vm.runInContext(fs.readFileSync('starlight.js','utf8'),c);vm.runInContext(fs.readFileSync('scenes.js','utf8'),c);window.MathScenes.choose('stars');
 const before=elements.artwork.attributes['aria-label'];
 for(const fn of handlers['artwork-pointerdown'])fn({clientX:20,clientY:20,button:0});
 const hold=[...timers.values()].find(t=>t.ms===1000);assert(hold);hold.fn();assert.equal(elements.orbitLabel.textContent,'You crossed my mind.');
 for(const fn of handlers['artwork-pointerup'])fn({});for(const fn of handlers['artwork-click'])fn({detail:1});assert.equal(elements.artwork.attributes['aria-label'],before);
 const end=[...timers.values()].find(t=>t.ms===8200);assert(end);end.fn();assert.equal(elements.orbitLabel.textContent,'Binary Stars');
 for(const fn of handlers['artwork-pointerdown'])fn({clientX:20,clientY:20,button:0});for(const fn of handlers['artwork-pointerup'])fn({});for(const fn of handlers['artwork-click'])fn({detail:1});assert.notEqual(elements.artwork.attributes['aria-label'],before);
});
