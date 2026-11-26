(() => {
  const control=document.getElementById('refreshInterval');
  const allowed=new Set([0,10,30,60]);
  let seconds=10,timer=null;
  function cancel(){clearTimeout(timer);timer=null;}
  function refresh(){
    makeCopy();newScene();restart();
  }
  function schedule(){
    cancel();
    if(!seconds||document.hidden)return;
    timer=setTimeout(()=>{if(!document.hidden)refresh();schedule()},seconds*1000);
  }
  control.addEventListener('change',()=>{
    const value=Number(control.value);seconds=allowed.has(value)?value:10;
    schedule();
  });
  document.addEventListener('visibilitychange',()=>{
    cancel();
    if(!document.hidden){refresh();schedule()}
  });
  // Resume cleanly after restoring a page from the back/forward cache.
  window.addEventListener('pageshow',event=>{if(event.persisted&&!document.hidden){refresh();schedule()}});
  window.addEventListener('pagehide',cancel);
  schedule();
})();
