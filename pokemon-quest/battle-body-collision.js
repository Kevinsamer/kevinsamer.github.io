// Bounded planar body separation. Static navigation validates every correction;
// this is a Web adapter, not Unity NavMeshAgent avoidance/carving parity.
export function separateBattleBodies(b,dt){
 if(!b.nativeNavigation||!b.worldScale||dt<=0)return;
 const nav=b.nativeNavigation,units=b.units.filter(u=>u.hp>0&&!u.isDecoy),base=nav.radius||.5;
 const radius=u=>base*Math.max(.1,u.modelScale??1)/b.worldScale;
 const budgets=new Map(units.map(u=>[u,10*dt/b.worldScale]));
 function move(u,dx,dy){
  const distance=Math.hypot(dx,dy),budget=budgets.get(u);if(!distance||budget<=0)return 0;
  const t=Math.min(1,budget/distance),x=u.x,y=u.y;
  nav.displace(u,{x:x+dx*t,y:y+dy*t});
  const actual=Math.hypot(u.x-x,u.y-y);budgets.set(u,Math.max(0,budget-actual));return actual;
 }
 for(let pass=0;pass<6;pass++){
  let overlaps=0;
  for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
   const a=units[i],c=units[j],min=radius(a)+radius(c);
   let dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy);if(d>=min-1e-5)continue;
   if(Math.abs((a.worldY||0)-(c.worldY||0))>base*2||!nav.hasLineOfSight(a,c))continue;
   overlaps++;
   if(d<1e-6){const angle=((i+1)*2.399963229728653+(j+1)*.61803398875)%(Math.PI*2);dx=Math.cos(angle);dy=Math.sin(angle);d=1;}else{dx/=d;dy/=d;}
   const gap=min-Math.hypot(c.x-a.x,c.y-a.y)+1e-4;
   const first=move(a,-dx*gap/2,-dy*gap/2);
   const second=move(c,dx*(gap-first),dy*(gap-first));
   if(first+second<gap-1e-5)move(a,-dx*(gap-first-second),-dy*(gap-first-second));
  }
  if(!overlaps)break;
 }
}
