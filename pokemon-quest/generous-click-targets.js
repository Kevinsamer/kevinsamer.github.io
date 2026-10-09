// Expand only into empty space; native button hits always win.
export function installGenerousClickTargets(root){
 if(!root)return;let start=null,dragged=false;
 root.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];dragged=false;},true);
 root.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])>8)dragged=true;},true);
 root.addEventListener('pointercancel',()=>{start=null;dragged=true;},true);
 root.addEventListener('click',e=>{
  if(dragged||e.defaultPrevented||e.detail===0||e.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
  const overlay=root.querySelector('#overlay'),scope=overlay&&!overlay.hidden?overlay:root.querySelector('#ui');if(!scope)return;
  const scale=root.getBoundingClientRect().width/1280,pad=14*scale,candidates=[];
  for(const button of scope.querySelectorAll('button')){
   if(button.disabled||button.getAttribute('aria-disabled')==='true'||button.hidden)continue;
   const style=getComputedStyle(button),r=button.getBoundingClientRect();if(style.visibility!=='visible'||style.pointerEvents==='none'||!r.width||!r.height)continue;
   let left=Math.max(r.left,0),top=Math.max(r.top,0),right=Math.min(r.right,innerWidth),bottom=Math.min(r.bottom,innerHeight);
   for(let p=button.parentElement;p&&p!==root.parentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);}if(/hidden|clip|auto|scroll/.test(s.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}}
   if(right<=left||bottom<=top)continue;
   const dx=Math.max(left-e.clientX,0,e.clientX-right),dy=Math.max(top-e.clientY,0,e.clientY-bottom),distance=Math.hypot(dx,dy);
   if(distance<=pad)candidates.push({button,distance});
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  if(!candidates.length||(candidates[1]&&candidates[1].distance-candidates[0].distance<2*scale))return;
  e.preventDefault();e.stopImmediatePropagation();candidates[0].button.click();
 },true);
}

export function separateHitRects(rects){const result=rects.map(r=>({...r}));for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){const a=result[i],b=result[j],ar=a.left+a.width,br=b.left+b.width,ab=a.top+a.height,bb=b.top+b.height;if(Math.min(ar,br)<=Math.max(a.left,b.left)||Math.min(ab,bb)<=Math.max(a.top,b.top))continue;const ax=a.left+a.width/2,bx=b.left+b.width/2,ay=a.top+a.height/2,by=b.top+b.height/2;if(Math.abs(ax-bx)>=Math.abs(ay-by)){const cut=(ax+bx)/2;if(ax<=bx){a.width=Math.max(0,Math.min(ar,cut)-a.left);b.left=Math.max(b.left,cut);b.width=Math.max(0,br-b.left);}else{b.width=Math.max(0,Math.min(br,cut)-b.left);a.left=Math.max(a.left,cut);a.width=Math.max(0,ar-a.left);}}else{const cut=(ay+by)/2;if(ay<=by){a.height=Math.max(0,Math.min(ab,cut)-a.top);b.top=Math.max(b.top,cut);b.height=Math.max(0,bb-b.top);}else{b.height=Math.max(0,Math.min(bb,cut)-b.top);a.top=Math.max(a.top,cut);a.height=Math.max(0,ab-a.top);}}}return result;}
