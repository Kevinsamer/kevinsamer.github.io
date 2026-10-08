/** Original static surfaces and obstacle bounds, Web visibility routing.
 * This does not reproduce Unity's dynamic NavMesh carving or agent avoidance.
 */
import {createWorldNavigation}from './world-navigation.js';
import {transformTilePoint,simulationToWorld,worldToSimulation}from './native-world-map.js';
const EPS=1e-6,dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
function hull(points){
 const p=points.sort((a,b)=>a[0]-b[0]||a[2]-b[2]),half=[];
 for(const q of p){while(half.length>1&&cross(half.at(-2),half.at(-1),q)<=EPS)half.pop();half.push(q);}
 const lower=half.slice();half.length=0;
 for(const q of p.slice().reverse()){while(half.length>1&&cross(half.at(-2),half.at(-1),q)<=EPS)half.pop();half.push(q);}
 return lower.slice(0,-1).concat(half.slice(0,-1));
}
function inflate(p,r){return p.map((v,i)=>{
 const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length],u=[v[0]-a[0],v[2]-a[2]],w=[b[0]-v[0],b[2]-v[2]],lu=Math.hypot(...u),lw=Math.hypot(...w);
 const n=[u[1]/lu,-u[0]/lu],m=[w[1]/lw,-w[0]/lw],den=1+n[0]*m[0]+n[1]*m[1];
 return [v[0]+r*(n[0]+m[0])/Math.max(.05,den),v[1],v[2]+r*(n[1]+m[1])/Math.max(.05,den)];
 });}
const inside=(p,polygon)=>polygon.every((a,i)=>cross(a,polygon[(i+1)%polygon.length],p)>EPS);
function segmentBlocked(a,b,polygon){
 // Clip segment against convex halfplanes. Boundary touch is allowed.
 let lo=0,hi=1;
 for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],v=cross(p,q,a),w=cross(p,q,b),delta=w-v;
  if(Math.abs(delta)<EPS){if(v<=EPS)return false;continue;}
  const t=(EPS-v)/delta;if(delta>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>=hi-EPS)return false;
 }
 return hi>EPS&&lo<1-EPS&&lo<hi-EPS;
}
export function originalObstacleFootprints(layout){
 const result=[];
 for(const tile of layout.tiles||[])for(const c of tile.collision||[]){
  const d=c.data;if(c.type!=='NavMeshObstacle'||!c.active||!d.m_Enabled||!d.m_Carve)continue;
  // Every supplied map obstacle has original m_Shape=1 (box).
  if(d.m_Shape!==1)continue;
  const center=Object.values(d.m_Center),e=Object.values(d.m_Extents),m=c.matrix,points=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
   const p=[center[0]+x*e[0],center[1]+y*e[1],center[2]+z*e[2]],q=m.slice(0,3).map(row=>row[3]+row.slice(0,3).reduce((sum,v,i)=>sum+v*p[i],0));points.push(transformTilePoint(q,tile));
  }
  const polygon=hull(points);if(polygon.length>=3)result.push({name:c.name,tileIndex:tile.index,polygon,minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))});
 }
 return result;
}
export function createBattleNavigation(layout){
 const nav=layout.navigationScene?createWorldNavigation(layout.navigationScene):null;
 const settings=layout.navigationScene?.buildSettings||{},radius=settings.agentRadius??.5,climb=settings.agentClimb??.4166667;
 const obstacles=originalObstacleFootprints(layout).map(o=>({...o,polygon:inflate(o.polygon,radius)}));
 const heightCache=new Map();
 function height(p){
  if(!layout.heightAt)return p[1];const key=`${Math.round(p[0]*8)},${Math.round(p[2]*8)}`;
  if(!heightCache.has(key)){if(heightCache.size>20000)heightCache.delete(heightCache.keys().next().value);const y=layout.heightAt(p);heightCache.set(key,Number.isFinite(y)?y:p[1]);}
  return heightCache.get(key);
 }
 function sample(p){
  const q=nav?.sample([p[0],0,p[2]],Infinity);if(nav&&(!q||Math.hypot(q.position[0]-p[0],q.position[2]-p[2])>.02))return null;
  if(obstacles.some(o=>inside(p,o.polygon)))return null;
  const result=[p[0],height(p),p[2]];return result;
 }
 function clear(a,b){
  if(obstacles.some(o=>segmentBlocked(a,b,o.polygon)))return false;
  if(nav){const n=Math.ceil(dist(a,b)/3);for(let i=0;i<=n;i++){const p=[a[0]+(b[0]-a[0])*i/(n||1),0,a[2]+(b[2]-a[2])*i/(n||1)],q=nav.sample(p,Infinity);if(!q||dist(p,q.position)>.02)return false;}}
  return true;
 }
 // Slightly outside inflated obstacle corners prevents tangent roundoff.
 const corners=obstacles.flatMap(o=>inflate(o.polygon,.03)).filter(p=>!obstacles.some(o=>inside(p,o.polygon)));
 let graph=null;
 function baseGraph(){if(graph)return graph;graph=corners.map(()=>[]);for(let i=0;i<corners.length;i++)for(let j=i+1;j<corners.length;j++)if(clear(corners[i],corners[j])){const cost=dist(corners[i],corners[j]);graph[i].push([j,cost]);graph[j].push([i,cost]);}return graph;}
 function findPath(a,b){
  if(!sample(a)||!sample(b))return null;if(clear(a,b))return [a.slice(),b.slice()];
  const base=baseGraph(),points=[...corners,a,b],start=corners.length,end=start+1,links=base.map(v=>v.slice());links.push([],[]);
  for(let i=0;i<corners.length;i++)for(const id of [start,end])if(clear(points[i],points[id])){const cost=dist(points[i],points[id]);links[i].push([id,cost]);links[id].push([i,cost]);}
  const open=new Set([start]),cost=new Map([[start,0]]),came=new Map();
  while(open.size){let id=-1,score=Infinity;for(const i of open){const s=cost.get(i)+dist(points[i],b);if(s<score){id=i;score=s;}}if(id<0)return null;
   if(id===end){const path=[b.slice()];while(came.has(id)){id=came.get(id);path.unshift(points[id].slice());}return path;}
   open.delete(id);for(const [i,d]of links[id]){const n=cost.get(id)+d;if(n<(cost.get(i)??Infinity)){cost.set(i,n);came.set(i,id);open.add(i);}}
  }
  return null;
 }
 // Forced skill displacement follows a straight sweep, rather than pathfinding
 // around the obstacle. Web collision adapter; not Unity NavMeshAgent parity.
 function displace(unit,target){
  const convert=layout.simulationToWorld||simulationToWorld,toSim=layout.worldToSimulation||worldToSimulation;
  const raw=convert(unit.x,unit.y,unit.worldY||0),start=sample(raw);if(!start)return false;
  const end=convert(target.x,target.y,target.worldY??unit.worldY??0),length=dist(start,end),steps=Math.max(1,Math.ceil(length/.1));
  let accepted=start;
  for(let i=1;i<=steps;i++){
   const t=i/steps,p=[start[0]+(end[0]-start[0])*t,start[1],start[2]+(end[2]-start[2])*t],q=sample(p);
   if(!q||!clear(accepted,p)||Math.abs(q[1]-accepted[1])>climb){
    let lo=(i-1)/steps,hi=t;
    for(let n=0;n<12;n++){const mid=(lo+hi)/2,candidate=[start[0]+(end[0]-start[0])*mid,start[1],start[2]+(end[2]-start[2])*mid],ground=sample(candidate);if(ground&&clear(accepted,candidate)&&Math.abs(ground[1]-accepted[1])<=climb){lo=mid;accepted=ground;}else hi=mid;}
    break;
   }accepted=q;
  }
  const sim=toSim(accepted);unit.x=sim.x;unit.y=sim.y;unit.worldY=accepted[1];unit.nativeRoute=null;
  return dist(start,accepted)>EPS;
 }
 function step(unit,target,worldDistance){
  const rawStart=(layout.simulationToWorld||simulationToWorld)(unit.x,unit.y,unit.worldY||0);
  // Web adapter initial projection: physics spawn hit Y and terrain Y differ.
  // This is not a recovered Unity NavMeshAgent Warp. Keep original horizontal
  // start and compare climb against its currently projected ground height.
  const projectedStart=sample(rawStart);if(!projectedStart)return false;
  const a=[rawStart[0],projectedStart[1],rawStart[2]],b=(layout.simulationToWorld||simulationToWorld)(target.x,target.y,target.worldY??unit.worldY??0);
  let route=unit.nativeRoute;if(!route||dist(route.target,b)>1||!route.points.length){const points=findPath(a,b);route=unit.nativeRoute={target:b,points:points?.slice(1)||[]};}
  if(!route.points.length)return false;
  // Reach the corner before turning. Skipping a nearby corner cuts across
  // the inflated wall and traps the agent in an endless replan/skip cycle.
  while(route.points.length>1&&dist(a,route.points[0])<=EPS)route.points.shift();
  const waypoint=route.points[0],d=dist(a,waypoint),amount=Math.min(worldDistance,d),t=d?amount/d:0,p=[a[0]+(waypoint[0]-a[0])*t,a[1],a[2]+(waypoint[2]-a[2])*t],q=sample(p);
  if(!q||!clear(a,p)||Math.abs(q[1]-a[1])>climb){unit.nativeRoute=null;return false;}
  const sim=(layout.worldToSimulation||worldToSimulation)(q);unit.x=sim.x;unit.y=sim.y;unit.worldY=q[1];if(d<=worldDistance+EPS)route.points.shift();return true;
 }
 function hasLineOfSight(a,b){const convert=layout.simulationToWorld||simulationToWorld;return clear(convert(a.x,a.y,a.worldY||0),convert(b.x,b.y,b.worldY||0));}
 return {obstacles,radius,climb,sample,findPath,step,displace,hasLineOfSight,heightCache};
}
