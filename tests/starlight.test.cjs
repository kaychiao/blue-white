const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(initial='2026-11-26T02:00:00Z',store=new Map(),reduced=false){
 let now=Date.parse(initial),name='Möbius Ribbon',serial=0;const timers=new Map(),handlers={},events={},label={textContent:name};
 const button={addEventListener(type,fn){(handlers[type]??=[]).push(fn)}};
 const document={hidden:false,addEventListener(type,fn){(events[type]??=[]).push(fn)}};
 const c={window:{addEventListener(){}},document,Intl,Math,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},setTimeout(fn,ms){const id=++serial;timers.set(id,{at:now+ms,fn});return id},clearTimeout:id=>timers.delete(id),setInterval(){}};
 vm.runInNewContext(fs.readFileSync('starlight.js','utf8'),c);
 const secret=c.window.createStarSecret({button,label,getLabel:()=>name,redraw(){},reducedMotion:()=>reduced});
 const emit=(type,event={})=>(handlers[type]||[]).forEach(fn=>fn(event));
 const advance=ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn()}};
 return{secret,label,emit,advance,document,store,setName:n=>name=n,setTime:s=>now=Date.parse(s),visibility(){for(const fn of events.visibilitychange||[])fn()}};
}
test('Scheduled wish uses Shanghai time, deduplicates reloads and only plays while visible',()=>{
 const e=setup('2026-11-26T03:10:59Z');e.secret.checkClock();assert(!e.secret.active);
 e.advance(1000);e.secret.checkClock();assert(e.secret.active);assert.equal(e.label.textContent,'You crossed my mind.');e.setName('Rose Curves');e.advance(8200);assert.equal(e.label.textContent,'Rose Curves');
 e.secret.checkClock();assert(!e.secret.active);const reload=setup('2026-11-26T03:11:30Z',e.store);reload.secret.checkClock();assert(!reload.secret.active);
 e.setTime('2026-11-26T15:11:00Z');e.document.hidden=true;e.secret.checkClock();assert(!e.secret.active);e.document.hidden=false;e.visibility();assert(e.secret.active);
 const missed=setup('2026-11-26T15:12:00Z');missed.secret.checkClock();assert(!missed.secret.active);
});
test('One-second hold reveals without turning release into a scene switch; movement cancels',()=>{
 const e=setup();e.emit('pointerdown',{clientX:10,clientY:10,button:0});e.advance(999);assert(!e.secret.active);e.advance(1);assert(e.secret.active);e.emit('pointerup');assert(e.secret.consumeClick());assert(!e.secret.consumeClick());
 e.advance(8200);e.emit('pointerdown',{clientX:0,clientY:0});e.emit('pointermove',{clientX:6,clientY:0});e.advance(1000);assert(!e.secret.active);
 e.emit('pointerdown',{clientX:0,clientY:0});e.emit('pointercancel');e.advance(1000);assert(!e.secret.active);
 let prevented=false;e.emit('keydown',{key:'Enter',shiftKey:true,preventDefault(){prevented=true}});assert(prevented);assert(e.secret.active);
});
test('Four persistent stars align during the wish; reduced motion is static',()=>{
 const e=setup(undefined,undefined,true),points=[];const ctx=new Proxy({arc(x,y){points.push([x,y]);assert(Number.isFinite(x)&&Number.isFinite(y))}},{get:(o,k)=>k in o?o[k]:()=>{}});
 e.secret.draw(ctx,400,400,0);assert.equal(points.length,4);assert(new Set(points.map(p=>p[1])).size>1);
 points.length=0;e.secret.reveal();e.secret.draw(ctx,400,400,0);assert.equal(points.length,4);assert(points.every(p=>p[1]===200));const still=JSON.stringify(points);points.length=0;e.secret.draw(ctx,400,400,30);assert.equal(JSON.stringify(points),still);
 e.advance(8200);assert(!e.secret.active);assert.equal(e.label.textContent,'Möbius Ribbon');
});
