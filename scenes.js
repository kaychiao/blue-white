(() => {
 const TAU=Math.PI*2,canvas=document.getElementById('cosmos'),ctx=canvas.getContext('2d'),button=document.getElementById('artwork'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const scenes=[['stars','双星共舞','Two paths, one quiet moment'],['mobius','莫比乌斯环','A little infinity'],['trefoil','三叶结','One unbroken thread'],['heart','心形曲面','A shape for a quiet feeling'],['lissajous','李萨如共振','Finding our frequency'],['rose','玫瑰旋轮线','A flower drawn by numbers'],['garden','黄金角花园','Small things grow into light'],['butterfly','蝴蝶曲线','A little room to flutter'],['lorenz','洛伦兹轨迹','Beautifully unpredictable'],['sea','月光海面','Let the waves take their time'],['klein','克莱因瓶','Another way to see inside'],['surfaces','相遇的曲面','Somewhere our worlds overlap']];
 const holidayScenes=[['tree','分形圣诞树','A small tree of light'],['lantern','几何灯笼','A warm little wish'],['year','新年星光','A new chapter begins'],['bridge','双星光桥','A little closer across the sky'],['moon','中秋月相','The moon keeps a little light']];
 const catalog=[...scenes,...holidayScenes];let id='',seed=Math.random()*TAU,t=0,raf=0,last=0,pulse=0,rx=.22,ry=0,drag=null,moved=false,transition=1,previousImage=null;let deck=[];let lorenz=[];let yearPoints=[];
 const stars=Array.from({length:85},()=>[Math.random(),Math.random(),Math.random()*1.1+.4,Math.random()*TAU]);
 function lorenzPoints(){let x=.1,y=0,z=0;const out=[];for(let i=0;i<2900;i++){const dt=.008,dx=10*(y-x),dy=x*(28-z)-y,dz=x*y-8*z/3;x+=dx*dt;y+=dy*dt;z+=dz*dt;if(i>200&&i%2===0)out.push([x/20,(z-25)/22,y/24])}return out}
 lorenz=lorenzPoints();
 const picker=document.getElementById('scenePicker'),gallery=document.getElementById('sceneGallery'),name=document.getElementById('sceneName'),choices=new Map();
 gallery.hidden=true;
 // Small line studies echo the actual scenes, rather than decorating the controls.
 function miniature(key){
  const shapes={stars:'M3 16c0-9 26-9 26 0s-26 9-26 0M7 5c8-5 18 18 11 23S-1 10 7 5',mobius:'M4 21C-2 5 22 0 28 13S9 35 4 21M4 21C18 30 9-1 26 9',trefoil:'M16 4C2-4-3 24 12 23S31 1 20 9-2 26 6 28 29 22 26 12 8-3 16 4Z',heart:'M16 27C10 22 1 15 3 9S13 3 16 10C19 3 28 3 29 9S23 22 16 27Z',sea:'M2 20q7-5 14 0t14 0M2 25q7-5 14 0t14 0M21 5a5 5 0 1 0 4 8 5 5 0 0 1-4-8',moon:'M2 25q7-5 14 0t14 0M22 3a9 9 0 1 0 6 14A9 9 0 0 1 22 3',tree:'M16 28V5M16 8 9 14m7-3 7 7m-7-3L5 23m11-5 11 8',lantern:'M16 2v28M8 7h16M8 25h16M8 7c-7 7-7 12 0 18m16-18c7 7 7 12 0 18M12 7c-3 7-3 12 0 18m8-18c3 7 3 12 0 18',year:'m16 2 3 9 10 5-10 4-3 10-4-10-10-4 10-5Z',bridge:'M2 22q14-22 28 0M2 26q14-22 28 0M5 9h2m-1-1v2m20-5h2m-1-1v2',surfaces:'M2 10q8-10 15 0t13 0M2 15q8-10 15 0t13 0M2 20q8 10 15 0t13 0M2 25q8 10 15 0t13 0',klein:'M11 3C0 4 0 29 14 29S33 15 22 13 6 13 11 3ZM11 3C24 3 19 22 12 22S8 12 22 13'};
  if(shapes[key])return shapes[key];
  const points=Array.from({length:151},(_,i)=>{const a=i/150*TAU;let x,y;if(key==='lissajous'){x=Math.sin(3*a);y=Math.sin(2*a)}else if(key==='rose'){const r=Math.cos(5*a);x=r*Math.cos(a);y=r*Math.sin(a)}else if(key==='garden'){const r=Math.sqrt(i/150);x=r*Math.cos(i*2.4);y=r*Math.sin(i*2.4)}else if(key==='butterfly'){const r=(Math.exp(Math.cos(a))-2*Math.cos(4*a))/3;x=Math.sin(a)*r;y=Math.cos(a)*r}else{x=Math.sin(a)*(.6+.4*Math.cos(a*2));y=Math.sin(2*a)}return key==='garden'?`M${(16+x*13).toFixed(1)} ${(16+y*12).toFixed(1)}h.3`:`${i?'L':'M'}${(16+x*13).toFixed(1)} ${(16+y*12).toFixed(1)}`});return points.join(' ');
 }
 for(const [key,label] of catalog){const item=document.createElement('button');item.type='button';item.className='scene-choice';item.dataset.scene=key;item.setAttribute('aria-pressed','false');item.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${miniature(key)}"/></svg><span class="scene-choice-name">${label}</span><span class="scene-choice-check" aria-hidden="true">✓</span>`;item.addEventListener('click',()=>{choose(key);closeGallery(true)});choices.set(key,item);document.getElementById(scenes.some(x=>x[0]===key)?'dailySceneChoices':'holidaySceneChoices').append(item)}
 function closeGallery(restore=false){gallery.hidden=true;picker.setAttribute('aria-expanded','false');if(restore)picker.focus({preventScroll:true})}
 function openGallery(){
  gallery.hidden=false;picker.setAttribute('aria-expanded','true');
  const r=picker.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,spaceAbove=r.top-24;
  gallery.style.maxHeight=`${Math.max(140,Math.min(430,spaceAbove>180?spaceAbove:vh-r.bottom-24))}px`;
  gallery.style.left=`${Math.max(16,Math.min(vw-gallery.offsetWidth-16,r.left+r.width/2-gallery.offsetWidth/2))}px`;
  gallery.style.top=`${spaceAbove>180?Math.max(16,r.top-gallery.offsetHeight-12):r.bottom+12}px`;
  const current=choices.get(id);current?.focus({preventScroll:true});current?.scrollIntoView({block:'nearest'});
 }
 picker.addEventListener('click',()=>gallery.hidden?openGallery():closeGallery());
 document.addEventListener('pointerdown',event=>{if(!gallery.hidden&&!gallery.contains(event.target)&&!picker.contains(event.target))closeGallery()});
 document.addEventListener('focusin',event=>{if(!gallery.hidden&&!gallery.contains(event.target)&&!picker.contains(event.target))closeGallery()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!gallery.hidden){event.preventDefault();closeGallery(true)}});
 gallery.addEventListener('keydown',event=>{const keys=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'];if(!keys.includes(event.key))return;const list=[...choices.values()],i=list.indexOf(document.activeElement);let next=i+({ArrowRight:1,ArrowLeft:-1,ArrowDown:2,ArrowUp:-2}[event.key]||0);if(event.key==='Home')next=0;if(event.key==='End')next=list.length-1;event.preventDefault();list[Math.max(0,Math.min(list.length-1,next))].focus()});
 window.addEventListener('resize',()=>closeGallery());

 function theme(){return window.Holiday?.active.id||'daily'}
 function palette(){return ['spring','lantern','newyear','moon'].includes(theme())?['#477cb0','#a88845','#81acd3']:theme()==='qixi'?['#6578ae','#a089b9','#7cb6d2']:['#397bb8','#74abd6','#a9cce9']}
 function project(p,w,h){let [x,y,z=0]=p;const angle=ry+t*.08,xx=x*Math.cos(angle)+z*Math.sin(angle),zz=-x*Math.sin(angle)+z*Math.cos(angle),yy=y*Math.cos(rx)-zz*Math.sin(rx),depth=y*Math.sin(rx)+zz*Math.cos(rx),s=Math.min(w,h)*.34*(1+Math.sin(t*.6)*.014);return[w/2+xx*s,h/2-yy*s,depth]}
 function path(points,color,w,h,alpha=.6,width=1){ctx.beginPath();points.forEach((p,i)=>{const a=project(p,w,h);i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1])});ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1}
 function dot(p,r,color,w,h){const [x,y,z]=project(p,w,h);ctx.shadowBlur=10;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r*(1+z*.1),0,TAU);ctx.fill();ctx.shadowBlur=0}
 function curve(fn,count=220,extent=TAU){return Array.from({length:count+1},(_,i)=>fn(i/count*extent,i))}
 function mesh(fn,w,h,pal,rows=14,columns=28){for(let j=0;j<=rows;j++)path(curve(u=>fn(u,j/rows*TAU),columns),pal[j%pal.length],w,h,.32+j%3*.07);for(let j=0;j<columns;j+=2)path(curve(v=>fn(j/columns*TAU,v),rows),pal[j%pal.length],w,h,.28)}
 function draw(w,h){
  const p=palette(),phase=t*.3+seed;
  if(id==='stars'||id==='bridge'){
   for(let j=0;j<4;j++){const tilt=j*.8+seed;const f=a=>[Math.cos(a)*(1.35-j*.1),Math.sin(a)*(.3+j*.08)*Math.cos(tilt),Math.sin(a)*(.7+j*.07)*Math.sin(tilt)];path(curve(f),p[j%3],w,h,.3);dot(f(t*(j%2?-.35:.28)+j*1.8),4+j%2,p[j%3],w,h)}
   if(id==='bridge')path(curve(a=>[a/Math.PI-1,Math.sin(a)*.22,0],100,TAU),p[1],w,h,.8,2);
   dot([-.38,0,0],14,p[0],w,h);dot([.38,.1,0],11,p[2],w,h);
  }else if(id==='mobius')mesh((u,v)=>{const s=(v/TAU-.5)*.65;return[(1+s*Math.cos(u/2))*Math.cos(u),(1+s*Math.cos(u/2))*Math.sin(u),s*Math.sin(u/2)]},w,h,p,12,72);
  else if(id==='trefoil'){
   for(let j=0;j<7;j++)path(curve(a=>[(2+Math.cos(3*a))*.36*Math.cos(2*a),Math.sin(3*a)*.4+j*.014,(2+Math.cos(3*a))*.36*Math.sin(2*a)],350),p[j%3],w,h,.6);
  }else if(id==='heart'){
   mesh((u,v)=>{const scale=Math.sin(v/2);return[16*Math.sin(u)**3/17*scale,(13*Math.cos(u)-5*Math.cos(2*u)-2*Math.cos(3*u)-Math.cos(4*u))/17*scale,Math.cos(v/2)*.4]},w,h,p,18,48);
  }else if(id==='lissajous'){
   for(let j=0;j<5;j++)path(curve(a=>[Math.sin(3*a+phase+j*.04),Math.sin(2*a),Math.cos(5*a+phase)*.35],360),p[j%3],w,h,.5);
  }else if(id==='rose'){
   const k=3+Math.floor(seed)%5;for(let j=0;j<5;j++)path(curve(a=>{const r=Math.cos(k*a+phase*.12);return[Math.cos(a)*r,Math.sin(a)*r,Math.sin(k*a)*.2+j*.025]},400),p[j%3],w,h,.62);
  }else if(id==='garden'){
   for(let i=0;i<330;i++){const r=Math.sqrt(i/330)*1.15,a=i*2.399963+phase*.04;dot([Math.cos(a)*r,Math.sin(a)*r,Math.sin(r*3+phase)*.18],1+(1-r/1.3)*1.1,p[i%3],w,h)}
  }else if(id==='butterfly')path(curve(a=>{const r=Math.exp(Math.cos(a))-2*Math.cos(4*a)+Math.sin(a/12)**5;return[Math.sin(a)*r/3,Math.cos(a)*r/3,Math.sin(a*2+phase)*.08]},1000,Math.PI*12),p[0],w,h,.65);
  else if(id==='lorenz'){
   path(lorenz,p[0],w,h,.5);for(let i=0;i<5;i++)dot(lorenz[(Math.floor(t*80)+i*190)%lorenz.length],2.5,p[i%3],w,h);
  }else if(id==='sea'||id==='moon'){
   for(let j=0;j<24;j++)path(curve(a=>{const x=a/TAU*2.8-1.4,z=j/23*2-1;return[x,-.5+Math.sin(x*3+z*2+phase)*.08+Math.cos(z*4+phase)*.05,z]},60),p[j%3],w,h,.26);
   const a=project([0,.65,0],w,h),r=Math.min(w,h)*(id==='moon'?.13:.085);const glow=ctx.createRadialGradient(a[0]-r*.3,a[1]-r*.3,1,a[0],a[1],r);glow.addColorStop(0,'#fff');glow.addColorStop(1,'#9fbfdf');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(a[0],a[1],r,0,TAU);ctx.fill();
  }else if(id==='klein')mesh((u,v)=>{const r=1+Math.cos(u/2)*Math.sin(v)-Math.sin(u/2)*Math.sin(2*v);return[r*Math.cos(u)*.55,r*Math.sin(u)*.55,(Math.sin(u/2)*Math.sin(v)+Math.cos(u/2)*Math.sin(2*v))*.6]},w,h,p,22,48);
  else if(id==='surfaces'){
   for(let layer=0;layer<2;layer++)for(let j=0;j<18;j++)path(curve(a=>{const x=a/TAU*2.2-1.1,z=j/17*2-1;return[x,Math.sin(x*2+z*2+phase+layer*Math.PI)*.24+(layer-.5)*(.25-pulse*.12),z]},52),p[layer],w,h,.45);
  }else if(id==='tree'){
   function branch(x,y,z,length,angle,depth){if(!depth)return;const X=x+Math.sin(angle)*length,Y=y+Math.cos(angle)*length;path([[x,y,z],[X,Y,z]],p[depth%3],w,h,.6);branch(X,Y,z+.025,length*.68,angle-.6,depth-1);branch(X,Y,z-.025,length*.68,angle+.6,depth-1)}
   branch(0,-1,0,.55,0,7);dot([0,1,0],4,p[1],w,h);
  }else if(id==='lantern'){
   mesh((u,v)=>[Math.cos(u)*Math.sin(v/2)*.65,Math.cos(v/2)*.8,Math.sin(u)*Math.sin(v/2)*.65],w,h,p,12,24);path([[0,-.8,0],[0,-1.1,0]],p[1],w,h,.8,2);
  }else if(id==='year'){
   if(yearPoints.length){for(let i=0;i<yearPoints.length;i++){const point=yearPoints[i];dot([point[0]+Math.sin(i*2.4)*pulse*.7,point[1]+Math.cos(i*1.7)*pulse*.7,Math.sin(i+phase)*.025],1.2,p[i%3],w,h)}}
   else{const a=project([0,0,0],w,h);ctx.font=`500 ${Math.min(w,h)*.23}px -apple-system, sans-serif`;ctx.textAlign='center';ctx.fillStyle=p[0];ctx.fillText(new Intl.DateTimeFormat('en',{timeZone:'Asia/Shanghai',year:'numeric'}).format(new Date()),a[0],a[1]+20);}

  }
 }
 function frame(now=0){
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(!motion.matches&&last)t+=Math.min(.05,(now-last)/1000);last=now;
  const pal=palette();for(const [x,y,r,phase]of stars){ctx.globalAlpha=.2+Math.sin(t*.5+phase)*.12;ctx.fillStyle=pal[0];ctx.beginPath();ctx.arc(x*w,y*h,r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  const glow=ctx.createRadialGradient(w/2,h/2,5,w/2,h/2,Math.min(w,h)*.45);glow.addColorStop(0,'rgba(133,186,233,.17)');glow.addColorStop(1,'rgba(133,186,233,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);draw(w,h);
  // Seasonal decoration is local to the artwork; never covers the letter.
  if(theme()==='christmas')for(let i=0;i<35;i++){const x=(stars[i][0]*w+t*3)%w,y=(stars[i][1]*h+t*(6+i%4))%h;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,1+i%2,0,TAU);ctx.fill()}
  if(pulse>0){for(let i=0;i<30;i++){const a=i/30*TAU,r=(1-pulse)*Math.min(w,h)*.48;ctx.globalAlpha=pulse;ctx.fillStyle=pal[i%3];ctx.beginPath();ctx.arc(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r,1.7,0,TAU);ctx.fill()}ctx.globalAlpha=1;pulse=motion.matches?0:Math.max(0,pulse-.025)}
  if(previousImage&&transition<1){ctx.globalAlpha=1-transition;ctx.drawImage(previousImage,0,0,w,h);ctx.globalAlpha=1;transition+=.06}
  if(!motion.matches&&!document.hidden)raf=requestAnimationFrame(frame);
 }
 function redraw(){cancelAnimationFrame(raf);last=0;frame(performance.now())}
 function choose(next){
  if(!catalog.some(x=>x[0]===next))return;
  if(canvas.width&&canvas.height&&!motion.matches){previousImage=document.createElement('canvas');previousImage.width=canvas.width;previousImage.height=canvas.height;previousImage.getContext('2d').drawImage(canvas,0,0);transition=0}
  id=next;seed=Math.random()*TAU;rx=.22;ry=0;
  if(id==='year'&&!yearPoints.length){
   const temp=document.createElement('canvas');temp.width=300;temp.height=100;const tc=temp.getContext('2d');tc.font='600 84px sans-serif';tc.textAlign='center';tc.fillText(new Intl.DateTimeFormat('en',{timeZone:'Asia/Shanghai',year:'numeric'}).format(new Date()),150,80);
   const pixels=tc.getImageData(0,0,300,100)?.data;if(pixels)for(let y=0;y<100;y+=3)for(let x=0;x<300;x+=3)if(pixels[(y*300+x)*4+3]>100)yearPoints.push([(x-150)/110,(50-y)/100,0]);pulse=1;
  }
const meta=catalog.find(x=>x[0]===id);name.textContent=meta[1];picker.setAttribute('aria-label',`当前场景：${meta[1]}，浏览全部场景`);for(const [key,item]of choices)item.setAttribute('aria-pressed',String(key===id));document.getElementById('orbitLabel').textContent=meta[2];button.setAttribute('aria-label',`${meta[1]}：点击互动，左右拖动旋转`);document.getElementById('hint').textContent='Tap to leave a little light · drag to turn';redraw();
 }
 function next(direction=1){if(!deck.length)deck=scenes.map(x=>x[0]).sort(()=>Math.random()-.5);const candidate=deck.shift();if(candidate===id&&deck.length)deck.push(candidate);choose(candidate===id?deck.shift()||scenes[0][0]:candidate)}
 document.getElementById('sceneNext').addEventListener('click',()=>next());document.getElementById('scenePrevious').addEventListener('click',()=>{const i=catalog.findIndex(x=>x[0]===id);choose(catalog[(i-1+catalog.length)%catalog.length][0])});
 button.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};moved=false});
 button.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;ry+=dx*.012;rx+=dy*.009;drag={x:e.clientX,y:e.clientY};if(motion.matches)redraw()});
 button.addEventListener('pointerup',()=>{drag=null});button.addEventListener('pointerleave',()=>{drag=null});button.addEventListener('pointercancel',()=>{drag=null});
 button.addEventListener('click',()=>{if(moved){moved=false;return}seed+=.35;pulse=1;document.getElementById('hint').textContent='A little light, just for you';redraw()});
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)redraw()});motion.addEventListener('change',redraw);new ResizeObserver(redraw).observe(canvas);
 document.addEventListener('holidaychange',event=>{if(event.detail.changed)choose(event.detail.scene||scenes[Math.floor(Math.random()*scenes.length)][0])});
 window.MathScenes={choose,next,catalog};choose(window.Holiday?.templates[theme()]?.scene||scenes[Math.floor(Math.random()*scenes.length)][0]);
})();
