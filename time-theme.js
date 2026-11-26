// Local preview: Shanghai light, independent of weather and device timezone.
(() => {
  const skies={
    night:{building:'#bacbe6',reflection:'#607baf33',a:'#151e36',b:'#293653',c:'#493e59',ink:'#edf0fa',muted:'#bfc5dc',accent:'#efb3a1',surface:'#26324d',line:'#9398bc',drawing:['#d6b3b5','#b5bedf','#e7bf9a'],bloom:'rgba(220,165,175,.12)'},
    dawn:{building:'#956d3b',reflection:'#f6d29188',a:'#faf8f0',b:'#f6d9a2',c:'#c4d2dc',ink:'#3b3530',muted:'#6a6054',accent:'#865a2d',surface:'#fffaf0',line:'#b5a385',drawing:['#bd8d54','#e4b66c','#acacb8'],bloom:'rgba(255,218,146,.22)'},
    day:{building:'#7593b8',reflection:'#bad6ed66',a:'#f7faff',b:'#e8f2ff',c:'#f7fbff',ink:'#102747',muted:'#4c6584',accent:'#3879bd',surface:'#f7faff',line:'#82a9d5',drawing:['#397bb8','#74abd6','#a9cce9'],bloom:'rgba(133,186,233,.17)'},
    sunset:{building:'#603b4d',reflection:'#ffbd8755',a:'#fbf8f6',b:'#f5d9cb',c:'#ded7eb',ink:'#302b3d',muted:'#62576c',accent:'#914c4b',surface:'#fffaf6',line:'#baa2ab',drawing:['#a66f80','#c68b71','#9184aa'],bloom:'rgba(240,181,141,.17)'}
  };
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function update(date=new Date()){
    const parts=Object.fromEntries(clock.formatToParts(date).map(p=>[p.type,p.value]));const hour=+parts.hour+parts.minute/60;
    const phase=hour<6?'night':hour<8?'dawn':hour<16?'day':hour<19?'sunset':'night',s=skies[phase];
    if(document.body.dataset.sky===phase)return;
    document.body.dataset.sky=phase;const style=document.documentElement.style;
    for(const key of ['a','b','c','ink','muted','accent','surface','line','bloom','building','reflection'])style.setProperty(`--sky-${key}`,s[key]);
    style.setProperty('--paper',s.a);style.setProperty('--ink',s.ink);style.setProperty('--muted',s.muted);style.setProperty('--blue',s.accent);
    window.TimeTheme.current=s;window.TimeTheme.phase=phase;
    document.dispatchEvent(new CustomEvent('skychange'));
  }
  window.TimeTheme={update,current:skies.day,phase:'day'};update();
  setInterval(()=>{if(!document.hidden)update()},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
})();
