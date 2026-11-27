(() => {
  const interval=520*1000;let timer=null,lastChanged=Date.now();
  function cancel(){clearTimeout(timer);timer=null;}
  function refreshIfDue(){
    if(Date.now()-lastChanged>=interval){makeCopy();lastChanged=Date.now();}
  }
  function schedule(){
    cancel();
    if(document.hidden)return;
    timer=setTimeout(()=>{if(!document.hidden){refreshIfDue();schedule()}},Math.max(0,interval-(Date.now()-lastChanged)));
  }
  document.addEventListener('visibilitychange',()=>{
    cancel();
    if(!document.hidden){refreshIfDue();schedule()}
  });
  // Manual changes also get a full 520 seconds to stay on screen.
  document.getElementById('shuffle').addEventListener('click',()=>{lastChanged=Date.now();schedule()});
  window.addEventListener('pageshow',event=>{if(event.persisted&&!document.hidden){refreshIfDue();schedule()}});
  window.addEventListener('pagehide',cancel);
  schedule();
})();
