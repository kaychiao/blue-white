const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(initial='2026-11-26T02:00:00Z',store=new Map(),reduced=false){
 let now=Date.parse(initial),name='Möbius Ribbon',serial=0;const timers=new Map(),handlers={},events={},label={textContent:name};
 const button={addEventListener(type,fn){(handlers[type]??=[]).push(fn)}};
 const document={hidden:false,addEventListener(type,fn){(events[type]??=[]).push(fn)}};
 const c={window:{addEventListener(){}},document,Intl,Math,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},setTimeout(fn,ms){const id=++serial;timers.set(id,{at:now+ms,fn});return id},clearTimeout:id=>timers.delete(id),setInterval(){}};
 vm.runInNewContext(fs.readFileSync('assets/js/starlight.js','utf8'),c);
 const secret=c.window.createStarSecret({button,label,getLabel:()=>name,redraw(){},reducedMotion:()=>reduced});
 const emit=(type,event={})=>(handlers[type]||[]).forEach(fn=>fn(event));
 const advance=ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn()}};
 return{secret,label,emit,advance,document,store,setName:n=>name=n,setTime:s=>now=Date.parse(s),visibility(){for(const fn of events.visibilitychange||[])fn()}};
}
test('Scheduled wish uses Shanghai time, deduplicates reloads and only plays while visible',()=>{
 const e=setup('2026-11-26T03:10:59Z');e.secret.checkClock();assert(!e.secret.active);
 e.advance(1000);e.secret.checkClock();assert(e.secret.active);assert(e.label.textContent&&e.label.textContent!=='Möbius Ribbon');e.setName('Rose Curves');e.advance(8200);assert.equal(e.label.textContent,'Rose Curves');
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
 const e=setup(undefined,undefined,true),points=[];const ctx=new Proxy({createLinearGradient(){return{addColorStop(){}}},arc(x,y){points.push([x,y]);assert(Number.isFinite(x)&&Number.isFinite(y))}},{get:(o,k)=>k in o?o[k]:()=>{}});
 e.secret.draw(ctx,400,400,0);assert.equal(points.length,4);assert(new Set(points.map(p=>p[1])).size>1);
 points.length=0;e.secret.reveal();e.secret.draw(ctx,400,400,0);assert.equal(points.length,4);assert(points.every(p=>p[1]===200));const still=JSON.stringify(points);points.length=0;e.secret.draw(ctx,400,400,30);assert.equal(JSON.stringify(points),still);
 e.advance(8200);assert(!e.secret.active);assert.equal(e.label.textContent,'Möbius Ribbon');
});
test('Twenty-four romantic whispers cycle without repeats and remember progress after reload',()=>{
 const e=setup(),seen=new Set();let previous='';
 for(let i=0;i<24;i++){assert(e.secret.reveal());const line=e.label.textContent;assert(!seen.has(line));assert(line.length<=40);seen.add(line);previous=line;e.secret.syncLabel();assert.equal(e.label.textContent,line);e.advance(8200)}
 assert(seen.has('You crossed my mind.'));assert(seen.has('Thinking of you, quietly.'));
 e.secret.reveal();assert.notEqual(e.label.textContent,previous);const last=e.label.textContent;const reload=setup(undefined,e.store);reload.secret.reveal();assert.notEqual(reload.label.textContent,last);assert(seen.has(reload.label.textContent));
});
test('Aligned stars draw four long vertical light traces, with no traces while idle',()=>{
 const e=setup(undefined,undefined,true),segments=[];let start;
 const ctx=new Proxy({createLinearGradient(){return{addColorStop(){}}},moveTo(x,y){start=[x,y]},lineTo(x,y){segments.push([start,[x,y]])}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const traces=()=>segments.filter(([a,b])=>a[0]===b[0]&&Math.abs(a[1]-b[1])>20);
 e.secret.draw(ctx,400,400,0);assert.equal(traces().length,0);segments.length=0;e.secret.reveal();e.secret.draw(ctx,400,400,0);assert.equal(traces().length,4);
});
