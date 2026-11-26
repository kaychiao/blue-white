// Original procedural clouds, informed by Shanghai riverside light studies.
// Draw only when the time phase or viewport size changes; no perpetual animation.
(() => {
 const host=document.querySelector('.bund-view');if(!host)return;
 const canvas=document.createElement('canvas');canvas.className='sky-atmosphere';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
 function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),u=x-X,v=y-Y,a=u*u*(3-2*u),b=v*v*(3-2*v);return(hash(X,Y)*(1-a)+hash(X+1,Y)*a)*(1-b)+(hash(X,Y+1)*(1-a)+hash(X+1,Y+1)*a)*b}
 function cloud(x,y){let n=0,amp=.53;for(let i=0;i<5;i++){n+=noise(x,y)*amp;x=x*2.03+11;y=y*2.01+7;amp*=.48}return n}
 const rgb=h=>h.match(/\w\w/g).map(v=>parseInt(v,16)),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*clamp(t));
 function stops(rows,y){let i=1;while(i<rows.length-1&&y>rows[i][0])i++;return mix(rgb(rows[i-1][1]),rgb(rows[i][1]),(y-rows[i-1][0])/(rows[i][0]-rows[i-1][0]))}
 function draw(){
  const phase=window.TimeTheme?.phase;const caption=host.querySelector('figcaption');if(caption)caption.textContent=({sunset:'SHANGHAI · THE LAST LIGHT',dawn:'SHANGHAI · FIRST LIGHT',day:'SHANGHAI · BY THE RIVER',night:'SHANGHAI · AFTER HOURS'})[phase]||'SHANGHAI';if(!['sunset','dawn'].includes(phase)){canvas.hidden=true;return}canvas.hidden=false;
  const w=Math.max(160,Math.min(1060,Math.round(host.getBoundingClientRect().width))),h=320;canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(w,h),data=image.data,isDawn=phase==='dawn';
  const sky=isDawn?[[0,'aec1cf'],[.33,'e9cfac'],[.7,'ffd18b'],[1,'fff0c5']]:[[0,'414568'],[.34,'77516c'],[.68,'db746f'],[.87,'f6af80'],[1,'efd3b3']];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const u=x/w,v=y/h,base=stops(sky,v),n=cloud(u*4.2+v*.8,v*10+3),detail=noise(u*65,v*75);
   let c;
   if(isDawn){const haze=smooth(.35,.8,n)*.25,light=Math.exp(-((u-.53)**2/.075+(v-.74)**2/.018));c=mix(base,[255,248,204],light*.7);c=mix(c,[167,169,183],haze*(1-v)*.7)}
   else{
    const density=smooth(.40,.64,n)*(1-smooth(.8,1,v));
    const lowerEdge=clamp((n-cloud(u*4.2+(v+.012)*.8,(v+.012)*10+3))*9+.22);
    const embers=smooth(.35,.65,n)*lowerEdge,underside=mix([100,65,100],[255,103,75],embers);
    c=mix(base,underside,density*.95);c=mix(c,[255,151,91],smooth(.3,.8,lowerEdge)*density*.24);
   }
   const p=(y*w+x)*4;for(let i=0;i<3;i++)data[p+i]=clamp(c[i]+(detail-.5)*2,0,255);data[p+3]=255;
  }
  ctx.putImageData(image,0,0);
 }
 let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(draw,160)});document.addEventListener('skychange',draw);draw();
})();
