const pick=a=>a[Math.floor(Math.random()*a.length)];
const key='bw-combo-v5';let last=localStorage.getItem(key)||'';
function makeCopy(){
 if(window.Holiday && window.Holiday.active.id!=='daily'){window.Holiday.applyCopy();return;}
 const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const batch=window.aiCopy;
 if(batch?.policyVersion===3 && batch.validUntil>=dateKey && batch.notes?.length && batch.notes.every(n=>window.copyTitleParts(n))){
   let history=[];try{history=JSON.parse(localStorage.getItem('bw-ai-history-v3')||'[]')}catch{}
   const candidates=batch.notes.filter(n=>!history.includes(n.title));
   const note=pick(candidates.length?candidates:batch.notes);
   const signature=note.title;
   try{localStorage.setItem('bw-ai-history-v3',JSON.stringify([...history,signature].slice(-6)))}catch{}
   const title=document.getElementById('title');title.replaceChildren();
   const first=document.createElement('span'),second=document.createElement('span'),accent=document.createElement('span');
   const parts=window.copyTitleParts(note);
   first.className=second.className='title-line';accent.className='accent';first.textContent=parts.first;accent.textContent=parts.accent;second.append(document.createTextNode(parts.before),accent,document.createTextNode(parts.after));title.append(first,second);
   title.classList.toggle('compact',Math.max(parts.first.length,parts.before.length+parts.accent.length+parts.after.length)>11);
   for(const [id,field] of [['poem','body'],['personal','personal'],['code','code'],['thought','thought']])document.getElementById(id).textContent=note[field];
   requestAnimationFrame(fitTitle);return;
 }
 let row,pair,personal,code,thought,signature;do{row=pick(dailyCopy.titleLines);pair=pick(dailyCopy.bodyPairs);personal=pick(dailyCopy.personal);code=pick(dailyCopy.codeBits);thought=pick(dailyCopy.thoughts);signature=[row.join('|'),pair.join(''),personal,code,thought].join('¦')}while(signature===last);last=signature;localStorage.setItem(key,last);const [a,b,c]=row;document.getElementById('title').innerHTML=`<span class="title-line">${a}</span><span class="title-line">${b}<span class="accent">${c}</span>。</span>`;document.getElementById('title').classList.toggle('compact',Math.max(a.length,b.length+c.length)>10);requestAnimationFrame(fitTitle);document.getElementById('poem').textContent=pair.join('');document.getElementById('personal').textContent=personal;document.getElementById('code').textContent=code;document.getElementById('thought').textContent=thought;}
function fitTitle(){
 const title=document.getElementById('title');
 title.style.fontSize='';
 const style=getComputedStyle(title),base=parseFloat(style.fontSize),available=title.clientWidth-4;
 const measure=document.createElement('canvas').getContext('2d');measure.font=`${style.fontWeight} ${base}px ${style.fontFamily}`;
 const widest=Math.max(...[...title.querySelectorAll('.title-line')].map(line=>measure.measureText(line.textContent).width));
 if(widest>available)title.style.fontSize=`${Math.max(24,base*available/widest)}px`;
}
const titleObserver=new ResizeObserver(()=>fitTitle());titleObserver.observe(document.querySelector('.letter'));
window.addEventListener('resize',fitTitle,{passive:true});
makeCopy();
document.getElementById('shuffle').addEventListener('click',makeCopy);
