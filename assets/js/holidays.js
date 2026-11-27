(() => {
 const templates={
  newyear:{label:'元旦',accent:'#a38338',scene:'year',lines:['把新一年的第一份祝福，','留给','你'],body:'新的一年，希望你有喜欢的内容可做，也有下班以后属于自己的时间。认识你这件事，我想继续认真一点。',sign:'新年快乐，Fred。找天一起吃顿好的吧。',code:'const nextChapter = “和你慢慢认识”;',thought:'新的年份，想继续收集与你有关的小事。'},
  spring:{label:'春节',accent:'#a25243',scene:'lantern',lines:['新一年的小小愿望，','也有一份','关于你'],body:'想把新年的热闹和一颗安静的蓝色星星一起送给你。愿接下来的日子，有好吃的饭，也有让你开心的人和事。',sign:'Fred，新年快乐。愿你过个舒服的年。',code:'愿新的一年：好消息多一点，相见也多一点。',thought:'新岁有新意，惦记你这件事也想继续。'},
  christmas:{label:'圣诞节',accent:'#8f763e',scene:'tree',lines:['给你一场蓝色的雪，','还有一句','圣诞快乐'],body:'不知道你会不会想起在英国读书的冬天。我在这里种了一棵由曲线组成的小树，挂上几颗星，留给你慢慢看。',sign:'圣诞快乐，Fred。愿这个冬天有热饭，也有惦记。',code:'const christmas = “蓝白色，和一点暖光”;',thought:'这颗星不赶时间，等你路过时再亮。'},
  lantern:{label:'元宵节',accent:'#a38338',scene:'lantern',lines:['灯亮起来的时候，','想把好心情','捎给你'],body:'画了几盏小灯，沿着曲线慢慢走。元宵节快乐，希望忙碌之外，也有人陪你吃顿不赶时间的饭。',sign:'Fred，祝你元宵快乐，今晚有个好收尾。',code:'愿每一盏小灯，都照到一点开心。',thought:'灯火有很多种，想给你的这一盏很安静。'},
  qixi:{label:'七夕',accent:'#8166a5',scene:'bridge',lines:['两颗星之间，','想搭一座','小小的桥'],body:'不急着替这段相识写结局，只是想在这个日子告诉你：和你多说几句话，是我日常里的一点期待。',sign:'七夕快乐，Fred。有空一起去吃饭吧。',code:'const distance = “再靠近一点点”;',thought:'星河很远，想见的人可以慢慢靠近。'},
  moon:{label:'中秋节',accent:'#96783b',scene:'moon',lines:['把一小片月光，','留在你路过的','地方'],body:'今晚的月光画在这里，不管你忙不忙，都可以随时来看一眼。希望这个中秋，有热乎的饭，也有一点自在。',sign:'Fred，中秋快乐。愿你和在意的人都好。',code:'今晚的圆满：好好吃饭，慢慢聊天。',thought:'月光不用回复，祝福也是。'},
  birthday:{label:'生日',accent:'#9a75a2',scene:'heart',lines:['这一年的特别一天，','把祝福都','留给你'],body:'希望你这一岁，有喜欢的事可做，有舒服的日子可过。也很开心，能用这个小页面认真给你送一份祝福。',sign:'Fred，生日快乐。愿这一岁常常开心。',code:'const birthdayWish = “愿你如愿，也常有惊喜”;',thought:'今天这片小宇宙，特别为你亮着。'},
  anniversary:{label:'纪念日',accent:'#7d78a2',scene:'mobius',lines:['把一个特别的日期，','认真地','记下来'],body:'有些日子之所以特别，是因为我们给它留了一个位置。这份小小的心意，也想好好放在这里。',sign:'Fred，愿这个特别的日子有值得记住的小事。',code:'const keep = “好好记得”;',thought:'一些普通瞬间，慢慢有了自己的名字。'}
 };
 const parts=(date,calendar)=>Object.fromEntries(new Intl.DateTimeFormat(calendar||'en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date).map(p=>[p.type,p.value]));
 function detect(date=new Date()){
  const g=parts(date),m=+g.month,d=+g.day;
  const special=(window.holidayConfig?.specialDates||[]).find(x=>x.month===m&&x.day===d);
  if(special)return {id:special.kind==='birthday'?'birthday':'anniversary',label:special.label};
  if(m===1&&d===1)return {id:'newyear'};
  if(m===12&&(d===24||d===25))return {id:'christmas'};
  try{const l=parts(date,'en-u-ca-chinese');if(!/bis|闰/i.test(l.month)){const lm=+l.month,ld=+l.day;if(lm===1&&ld<=7)return{id:'spring'};if(lm===1&&ld===15)return{id:'lantern'};if(lm===7&&ld===7)return{id:'qixi'};if(lm===8&&ld===15)return{id:'moon'}}}catch{}
  return {id:'daily'};
 }
 let active={id:'daily'},variant=0;
 function applyCopy(){
  if(active.id==='daily')return;
  const t=templates[active.id];if(!t)return;
  const h=document.getElementById('title');h.replaceChildren();const a=document.createElement('span'),b=document.createElement('span'),c=document.createElement('span');a.className=b.className='title-line';c.className='accent';a.textContent=t.lines[0];b.textContent=t.lines[1];c.textContent=t.lines[2];b.append(c);h.append(a,b);h.classList.add('compact');
  const variations=[t.body,'这份节日的小心意不赶时间，等你有空再慢慢看。'+t.body.split('。')[0]+'。',t.body+' 不用特意回复，收下这份祝福就好。'];
  for(const [id,text] of [['poem',variations[variant++%variations.length]],['personal',t.sign],['code',t.code],['thought',t.thought]])document.getElementById(id).textContent=text;
  document.getElementById('edition').textContent=`FOR FRED · ${active.label||t.label}`;requestAnimationFrame(fitTitle);
 }
 function update(){
  const next=detect();const changed=next.id!==active.id;active=next;
  document.body.dataset.holiday=active.id;
  document.body.style.setProperty('--festival-accent',templates[active.id]?.accent||'#286cb6');
  const badge=document.getElementById('holidayBadge');badge.textContent=active.id==='daily'?'':`${active.label||templates[active.id].label}`;badge.hidden=active.id==='daily';
  if(active.id==='daily')document.getElementById('edition').textContent='A NOTE IN THE BLUE';
  document.dispatchEvent(new CustomEvent('holidaychange',{detail:{...active,scene:templates[active.id]?.scene,changed}}));
  return active;
 }
 window.Holiday={detect,applyCopy,update,get active(){return active},templates};
 update();makeCopy();setInterval(()=>{if(!document.hidden){const previous=active.id;update();if(previous!==active.id)makeCopy()}},60000);
})();
