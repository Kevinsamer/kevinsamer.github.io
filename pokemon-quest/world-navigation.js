/** Browser/Node navigation over exported original static convex polygons.
 * A* and portal-midpoint routing are Web implementations, not recovered Unity
 * NavMeshAgent behavior. Runtime obstacle carving is deliberately separate.
 */
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function projectPolygon(point,p){
 const v=p.vertices;let sign=0,inside=true;
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length],c=(b[0]-a[0])*(point[2]-a[2])-(b[2]-a[2])*(point[0]-a[0]);
  if(Math.abs(c)>1e-7){const s=Math.sign(c);if(sign&&sign!==s)inside=false;sign=s;}
 }
 // Detail triangles carry actual surface heights; coarse polygon vertices
 // alone can be nonplanar and should not be extrapolated across the polygon.
 if(inside&&p.triangles){for(const [a,b,c]of p.triangles){
  const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-9)continue;
  const u=((b[2]-c[2])*(point[0]-c[0])+(c[0]-b[0])*(point[2]-c[2]))/den;
  const w=((c[2]-a[2])*(point[0]-c[0])+(a[0]-c[0])*(point[2]-c[2]))/den;
  if(u>=-1e-6&&w>=-1e-6&&u+w<=1+1e-6)return [point[0],u*a[1]+w*b[1]+(1-u-w)*c[1],point[2]];
 }}
 // Fallback for caller-supplied polygons without detail geometry.
 const a=v[0],b=v[1],c=v[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
 const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
 if(inside&&Math.abs(ny)>1e-8)return [point[0],a[1]-(nx*(point[0]-a[0])+nz*(point[2]-a[2]))/ny,point[2]];
 let best=null,d=Infinity;
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length],dx=b[0]-a[0],dz=b[2]-a[2],den=dx*dx+dz*dz;
  const t=den?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[2]-a[2])*dz)/den)):0;
  const q=a.map((x,k)=>x+t*(b[k]-x)),n=distance(point,q);if(n<d){d=n;best=q;}
 }
 return best;
}
export function createWorldNavigation(scene,{areaMask=0xffffffff,blocked=()=>false}={}){
 const polygons=scene.tiles.flatMap(t=>t.polygons),byId=new Map(polygons.map(p=>[p.id,p]));
 const allowed=p=>p.flags!==0&&(((1<<(p.areaAndType&31))&areaMask)!==0)&&!blocked(p);
 function sample(point,maxDistance=Infinity){
  let best=null,d=maxDistance;
  for(const p of polygons){if(!allowed(p))continue;const q=projectPolygon(point,p),n=distance(point,q);if(n<=d){d=n;best={position:q,polygonId:p.id,distance:n};}}
  return best;
 }
 function findPath(start,end,{maxSampleDistance=Infinity}={}){
  const a=sample(start,maxSampleDistance),b=sample(end,maxSampleDistance);if(!a||!b)return null;
  if(a.polygonId===b.polygonId)return {points:[a.position,b.position],polygons:[a.polygonId],start:a,end:b};
  const open=new Set([a.polygonId]),cost=new Map([[a.polygonId,0]]),score=new Map([[a.polygonId,distance(byId.get(a.polygonId).center,byId.get(b.polygonId).center)]]),came=new Map();
  while(open.size){
   let current=null,s=Infinity;for(const id of open){const n=score.get(id)??Infinity;if(n<s){s=n;current=id;}}
   if(current===null)return null;
   if(current===b.polygonId){
    const ids=[current],links=[];while(came.has(current)){const prev=came.get(current);links.unshift(prev.link);current=prev.from;ids.unshift(current);}
    return {points:[a.position,...links.map(l=>l.portal[0].map((v,k)=>(v+l.portal[1][k])/2)),b.position],polygons:ids,start:a,end:b};
   }
   open.delete(current);const p=byId.get(current);
   for(const link of p.links){const q=byId.get(link.to);if(!q||!allowed(q))continue;const n=cost.get(current)+distance(p.center,q.center);if(n<(cost.get(q.id)??Infinity)){came.set(q.id,{from:current,link});cost.set(q.id,n);score.set(q.id,n+distance(q.center,byId.get(b.polygonId).center));open.add(q.id);}}
  }
  return null;
 }
 return {sample,findPath,polygons};
}
