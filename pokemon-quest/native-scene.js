import {createOriginalBossDeathLifecycle} from './native-boss-death-lifecycle.js';
import {CLIENT_TEAM_SCENE_SOURCE as TEAM_SOURCE} from './client-team-scene-source.js';
import {originalCustomTeamModelPlan,originalCustomTeamCameraOrbit} from './client-custom-team-models.js';
import {createOriginalBattleScreenOverlay} from './native-battle-screen-overlay.js';
import {originalStageSpawnRaycast} from './native-enemy-spawn-position.js';
import {createOriginalActorMaterial} from './native-actor-lighting.js';
import {originalBattleLightingProfile} from './client-battle-render-settings.js';
import {CLIENT_SCENE_LIGHTING} from './client-scene-lighting.js';
import {createOriginalBattleColorCorrectionPass} from './native-battle-color-correction.js';
import {createOriginalActorRuntime,preloadOriginalActors} from './native-actors.js';
import {createOriginalSimpleBaseMaterial,originalBattleLighting,chooseOriginalGroundHit} from './native-battle-environment.js';
import {clientEffectCreationTimes,sampleClientEffectLifecycle} from './client-effect-lifecycle.js';
import {selectClientEffectModel} from './client-effect-models.js';
import {decodeEffectAnimation} from './native-effect-animation.js';
import * as THREE from './vendor/three/three.module.js';
import {clientSpawnInstructions} from './client-stages.js';
import {createStageWorldPlan} from './client-spawn-plan.js';
import {WORLD_ANCHORS} from './client-world-data.js';
import {createMapTiles,ROTATION_ANGLES,WORLD_SCALE,worldToSimulation,simulationToWorld,spawnPoint} from './native-world-map.js';
const stores = {}, renderers = new WeakMap();
const loader = new THREE.TextureLoader();
let battleCamera,battleMapData,battleSpawns,battleNavigation,battlePreparation=0;
const battleLibraries=new Map();
let goodsLibraryPromise,campGoodsKey='',campGoodsRevision=0;
function disposeScene(store){if(!store)return;store.actorRuntime?.dispose();const geometries=new Set(),materials=new Set();store.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m)});geometries.forEach(g=>{if(!g.userData.actorShared)g.dispose()});materials.forEach(m=>{if(!m.userData.actorShared)m.dispose()});}
function unpack(value,Type=Float32Array){const raw=atob(value),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Type(bytes.buffer);}
function build(data) {
 const lightingProfile=data.lightingProfile||CLIENT_SCENE_LIGHTING[data.mode]||originalBattleLightingProfile();
 const scene = new THREE.Scene(), root = new THREE.Group(); root.scale.z = -1; scene.add(root);
 const meshes = {}, mats = {}, nodes = {};
 for (const [id,m] of Object.entries(data.meshes)) {
  const g = new THREE.BufferGeometry();
  const binary=m.encoding==='base64';
  g.setAttribute('position',new THREE.Float32BufferAttribute(binary?unpack(m.positions):m.positions.flat(),3));
  if(m.normals?.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(binary?unpack(m.normals):m.normals.map(v=>v.slice(0,3)).flat(),3));
  if(m.uv?.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(binary?unpack(m.uv):m.uv.flat(),2));
  if(m.colors?.length)g.setAttribute('color',binary?new THREE.Uint8BufferAttribute(unpack(m.colors,Uint8Array),3,true):new THREE.Float32BufferAttribute(m.colors.map(v=>v.slice(0,3).map(c=>c/255)).flat(),3));
  const submeshes=m.submeshes.map(s=>binary?unpack(s,Uint32Array):s),indices=new Uint32Array(submeshes.reduce((sum,s)=>sum+s.length,0));let offset=0;
  submeshes.forEach((s,i)=>{g.addGroup(offset,s.length,i);indices.set(s,offset);offset+=s.length});g.setIndex(new THREE.BufferAttribute(indices,1));
  if(!g.getAttribute('normal'))g.computeVertexNormals();meshes[id]=g;
 }
 for(const [id,m] of Object.entries(data.materials)){
  if(data.mode==='team'){mats[id]=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});continue;}
  if(data.mode==='effect'){mats[id]=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});continue;}
  mats[id]=createOriginalActorMaterial(THREE,m,{lighting:originalBattleLighting({intensity:lightingProfile.intensity,rotation:lightingProfile.rotation,color:lightingProfile.lightColor}),ambientColor:lightingProfile.ambientColor});
 }
 for(const[id,n]of Object.entries(data.nodes)){
  const obj=n.mesh?new THREE.Mesh(meshes[n.mesh],n.materials.map(x=>mats[x]||new THREE.MeshBasicMaterial({color:0xffffff}))):new THREE.Group();
  obj.name=n.name;obj.position.fromArray(n.position);obj.quaternion.fromArray(n.rotation);obj.scale.fromArray(n.scale);obj.visible=!!n.active;nodes[id]=obj;
 }
 for(const[id,n]of Object.entries(data.nodes))(nodes[n.parent]||root).add(nodes[id]);
 root.updateMatrixWorld(true);
 if(data.mode==='effect')return {scene,root,nodes,data};
 const src=data.cameras.find(c=>data.nodes[Object.keys(data.nodes).find(id=>data.nodes[id].go===c.go)]?.name===(data.mode==='camp'?'Field Main Camera':'Main Camera'))||data.cameras[0];
 const c=src.tree,camera=new THREE.PerspectiveCamera(c['field of view'],16/9,c['near clip plane'],c['far clip plane']);
 const target=Object.values(nodes).find(n=>n.name===(data.mode==='camp'?'Field Main Camera':'Main Camera'));
 if(target){target.getWorldPosition(camera.position);const q=target.getWorldQuaternion(new THREE.Quaternion()),forward=new THREE.Vector3(0,0,1).applyQuaternion(q);camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(camera.position.clone().add(forward));}
 // Reflection changes quaternion decomposition handedness; source Unity forward is computed directly from its world matrix.
 if(target){const p=new THREE.Vector3(0,0,1).applyMatrix4(target.matrixWorld);camera.up.set(0,1,0).transformDirection(target.matrixWorld);camera.lookAt(p);}
 const bg=c.m_BackGroundColor;scene.background=new THREE.Color(bg.r,bg.g,bg.b);
 return {scene,root,nodes,camera,data,lightingProfile,initialCamera:camera.position.clone()};
}
export const ready=Promise.all(['camp','island','intro'].map(async mode=>{
 const data=await(await fetch(`./assets/original/scenes/${mode}.json`)).json();
 if(mode==='camp'){
  const pot=await(await fetch('./assets/original/scenes/pot.json')).json();
  Object.assign(data.meshes,pot.meshes);Object.assign(data.materials,pot.materials);
  const anchor=Object.keys(data.nodes).find(id=>data.nodes[id].name==='BC_pot1');
  const group=Object.values(data.nodes).find(node=>node.name==='BC_pot1_group');
  if(group)group.active=true;
  for(const [id,node]of Object.entries(pot.nodes))data.nodes[id]={...node,parent:node.parent==='0'?anchor:node.parent};
 }
 if(mode==='island'){
  const island=await(await fetch('./assets/original/scenes/islandmodel.json')).json();
  Object.assign(data.meshes,island.meshes);Object.assign(data.materials,island.materials);
  Object.assign(data.nodes,island.nodes);
 }
 stores[mode]=build(data);
 if(mode==='camp')stores[mode].baseData=data;
}));
export async function placeOriginalCampGoods(ids=[]){
 const key=ids.join(',');if(key===campGoodsKey)return;campGoodsKey=key;const revision=++campGoodsRevision;
 await ready;if(revision!==campGoodsRevision)return;
 const base=stores.camp.baseData||stores.camp.data;
 const data={...base,nodes:{...base.nodes},meshes:{...base.meshes},materials:{...base.materials}};
 if(ids.length){
  goodsLibraryPromise??=fetch('./assets/original/scenes/goods.json').then(r=>r.json());const goods=await goodsLibraryPromise;if(revision!==campGoodsRevision)return;
  Object.assign(data.meshes,goods.meshes);Object.assign(data.materials,goods.materials);const used=new Set();
  for(const id of ids){const item=goods.goods.find(g=>g.m_id===id),place=goods.placements.find(p=>p.category===item?.m_category&&!used.has(p.id)),tree=goods.models[item?.m_modelPath];if(!place||!tree)continue;used.add(place.id);
   const root=`goods:${place.id}`;data.nodes[root]={go:root,name:item.m_modelPath,parent:'0',active:true,position:place.position,rotation:place.rotation,scale:[1,1,1]};
   for(const [nodeId,n]of Object.entries(tree))data.nodes[root+':'+nodeId]={...n,parent:n.parent==='0'?root:root+':'+n.parent};
  }
 }
 const previous=stores.camp;stores.camp=build(data);stores.camp.camera.position.copy(previous.camera.position);stores.camp.baseData=base;disposeScene(previous);
}
const battleReady=Promise.all([fetch('./assets/original/scenes/battle/camera.json').then(r=>r.json()),fetch('./assets/original/scenes/battle/maps.json').then(r=>r.json()),fetch('./assets/original/scenes/battle/spawns.json').then(r=>r.json()),fetch('./assets/original/scenes/navigation.json').then(r=>r.json())]).then(([camera,maps,spawns,navigation])=>{battleCamera=camera;battleMapData=maps;battleSpawns=spawns;battleNavigation=navigation;}).catch(console.error);
export async function prepareOriginalBattle(stage){
 const request=++battlePreparation;
 disposeScene(stores.battle);delete stores.battle;
 await battleReady;if(request!==battlePreparation||!battleMapData)return false;
 const theme=stage.clientEnemyPackName?.match(/^EnemyPack_(.+)_\d+$/)?.[1]||'grass1';
 const mapName=stage.isTutorial?'MapData_tutorial1_000':`MapData_${theme}_${String(stage.clientMapId||0).padStart(3,'0')}`;
 const map=battleMapData[mapName];if(!map)return false;
 if(!battleLibraries.has(map.set))battleLibraries.set(map.set,fetch(`./assets/original/scenes/battle/${map.set}.json`).then(r=>{if(!r.ok)throw Error(`Missing native map set: ${map.set}`);return r.json();}));
 const battleLibrary=await battleLibraries.get(map.set);
 if(request!==battlePreparation)return false;
 const nodes={},tiles=createMapTiles(map,battleLibrary,battleSpawns);
 tiles.forEach(({index,name,rotation,position})=>{
  const tree=battleLibrary.chips[name];if(!tree)return;
  const angle=ROTATION_ANGLES[rotation];
  const root=`tile-${index}`;nodes[root]={go:root,name:root,parent:'0',active:true,position,rotation:[0,Math.sin(angle/2),0,Math.cos(angle/2)],scale:[1,1,1]};
  for(const[id,n]of Object.entries(tree))nodes[root+':'+id]={...n,parent:n.parent==='0'?root:root+':'+n.parent};
 });
 for(const[name,tree]of Object.entries(battleLibrary.outs))for(const[id,n]of Object.entries(tree)){
  const prefix=`out:${name}:`;nodes[prefix+id]={...n,parent:n.parent==='0'?'0':prefix+n.parent};
 }
 const q=new THREE.Quaternion().fromArray(battleCamera.rotation),p=new THREE.Vector3(0,0,1).applyQuaternion(q).multiplyScalar(-battleCamera.distance);
 nodes.camera={go:'camera',name:'Main Camera',parent:'0',active:true,position:p.toArray(),rotation:battleCamera.rotation,scale:[1,1,1]};
 stores.battle=build({mode:'battle',lightingProfile:originalBattleLightingProfile({dungeonIndex:stage.clientDungeonId??Math.max(0,(stage.region||1)-1),challengeStage:stage.clientChallengeStage??-1,prevLocalID:stage.clientPrevLocalID??-1}),nodes,meshes:battleLibrary.meshes,materials:battleLibrary.materials,cameras:[{go:'camera',tree:battleCamera.camera}]});
 const nativeScene=stores.battle.scene,ray=new THREE.Raycaster(),terrainMeshes=[];nativeScene.updateMatrixWorld(true);nativeScene.traverse(o=>{if(o.isMesh)terrainMeshes.push(o)});stores.battle.actorRuntime=createOriginalActorRuntime(stores.battle.root,{lightingProfile:stores.battle.lightingProfile});
 stores.battle.layout={spawnRaycast:originalStageSpawnRaycast,spawnColliderEvidence:"serialized scenes_normal_00 StageCollision BoxCollider562 layer15; runtime modifications unverified",navigationScene:battleNavigation?.scenes?.Normal_00,heightAt:(position)=>{ray.set(new THREE.Vector3(position[0],100,-position[2]),new THREE.Vector3(0,-1,0));const hit=chooseOriginalGroundHit(THREE,ray.intersectObjects(terrainMeshes,false),position[1]);return hit?.point.y??position[1];},worldScale:WORLD_SCALE,mapName,tiles,playerIndex:map.playerIndex,bossIndex:map.bossIndex,plan:createStageWorldPlan(map,clientSpawnInstructions({...stage,enemyPackName:stage.clientEnemyPackName||stage.enemyPackName}),tiles),worldToSimulation,simulationToWorld,spawnPoint};if(stage.actorSpecies?.length)await preloadOriginalActors([...new Set(stage.actorSpecies)]);return request===battlePreparation;
}
export function getOriginalBattleLayout(){return stores.battle?.layout||null;}
export function sceneReady(mode='camp'){return !!stores[mode];}
export function renderOriginalScene(canvas,mode='camp',time=0){
 const s=stores[mode];if(!s){const old=renderers.get(canvas);if(old?.screenOverlay)old.screenOverlay.root.hidden=true;return false;}
 let cache=renderers.get(canvas);if(!cache){const r=new THREE.WebGLRenderer({canvas,antialias:mode!=='team',alpha:mode==='team'});r.setPixelRatio(mode==='team'?1:Math.min(devicePixelRatio||1,2));r.outputColorSpace=THREE.LinearSRGBColorSpace;cache={r};renderers.set(canvas,cache);}
 const w=mode==='team'?512:(canvas.clientWidth||1280),h=mode==='team'?512:(canvas.clientHeight||720);
 if(mode==='battle'&&canvas.parentElement){
  const index=s.lightingProfile.settingIndex;
  if(!cache.screenOverlay){cache.screenOverlay=createOriginalBattleScreenOverlay({container:canvas.parentElement,settingIndex:index,assetBase:'./'});canvas.parentElement.insertBefore(cache.screenOverlay.root,canvas.nextSibling);cache.screenOverlayIndex=index;}
  if(cache.screenOverlayIndex!==index){cache.screenOverlay.setSettingIndex(index);cache.screenOverlayIndex=index;}
  cache.screenOverlay.root.hidden=false;cache.screenOverlay.resize(w,h);
 }else if(cache.screenOverlay)cache.screenOverlay.root.hidden=true;
 if(cache.w!==w||cache.h!==h){cache.r.setSize(w,h,false);cache.w=w;cache.h=h;cache.scene=null;}
 s.camera.aspect=w/h;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();
 const matrix=s.camera.matrixWorld.elements;
 if(cache.actorVersion!==s.actorVersion||cache.effectVersion!==s.effectVersion||cache.scene!==s.scene||matrix.some((v,i)=>v!==cache.camera?.[i])){if(mode==='battle'){
  if(!cache.post){const pass=createOriginalBattleColorCorrectionPass(THREE),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),pass.material));cache.post={pass,scene,camera,target:new THREE.WebGLRenderTarget(1,1,{depthBuffer:true})};}
  const size=cache.r.getDrawingBufferSize(new THREE.Vector2());cache.post.target.setSize(size.x,size.y);cache.r.setRenderTarget(cache.post.target);cache.r.render(s.scene,s.camera);cache.r.setRenderTarget(null);cache.post.pass.material.uniforms.inputTexture.value=cache.post.target.texture;cache.r.render(cache.post.scene,cache.post.camera);
 }else cache.r.render(s.scene,s.camera);cache.scene=s.scene;cache.effectVersion=s.effectVersion;cache.actorVersion=s.actorVersion;cache.camera=[...matrix];}
 return true;
}
export function projectOriginalCamp(point,width=1280,height=720){
 const s=stores.camp;if(!s)return null;s.camera.aspect=width/height;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();
 const v=new THREE.Vector3(...(Array.isArray(point)?point:[point.x,point.y,point.z]));v.z=-v.z;v.project(s.camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,visible:v.z>=-1&&v.z<=1};
}
export function focusOriginalIsland(region=1){const s=stores.island,a=WORLD_ANCHORS[region-1];if(!s||!a)return;s.camera.position.copy(s.initialCamera).add(new THREE.Vector3(a.position[0],0,-a.position[2]));s.camera.updateMatrixWorld();}
function panScene(mode,dx,dy){
 const s=stores[mode];if(!s||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
 s.camera.updateMatrixWorld();
 const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),ray=new THREE.Raycaster();
 const ground=(x,y)=>{ray.setFromCamera(new THREE.Vector2(x/1280*2-1,1-y/720*2),s.camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());};
 const from=ground(640,360),to=ground(640+dx,360+dy);if(!from||!to)return false;
 s.camera.position.add(from.sub(to));
 // Bounded Web camera adapter: preserve source orientation/height, expose the
 // camp edges and all region anchors without allowing endless off-map drags.
 const centers=mode==='island'?WORLD_ANCHORS.map(a=>[s.initialCamera.x+a.position[0],s.initialCamera.z-a.position[2]]):[[s.initialCamera.x,s.initialCamera.z]];
 s.camera.position.x=THREE.MathUtils.clamp(s.camera.position.x,Math.min(...centers.map(p=>p[0]))-25,Math.max(...centers.map(p=>p[0]))+25);
 s.camera.position.z=THREE.MathUtils.clamp(s.camera.position.z,Math.min(...centers.map(p=>p[1]))-25,Math.max(...centers.map(p=>p[1]))+25);
 s.camera.updateMatrixWorld();return true;
}
export function panOriginalIsland(dx,dy){return panScene('island',dx,dy)}
export function panOriginalCamp(dx,dy){return panScene('camp',dx,dy)}
export function projectOriginalCampPot(width=1280,height=720){
 const s=stores.camp;if(!s)return null;const n=Object.values(s.nodes).find(n=>n.name==='BC_pot1');if(!n)return null;
 const p=n.getWorldPosition(new THREE.Vector3());return projectOriginalCamp([p.x,p.y,-p.z],width,height);
}

export function projectOriginalIsland(region,width=1280,height=720){const s=stores.island,a=WORLD_ANCHORS[region-1];if(!s||!a)return null;s.camera.aspect=width/height;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();const p=a.position,v=new THREE.Vector3(p[0],p[1]+a.labelOffsetY,-p[2]).project(s.camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,visible:v.z>=-1&&v.z<=1};}
export function projectOriginalBattle(x,y,width=1280,height=720,elevation=0){const s=stores.battle;if(!s)return null;s.camera.updateMatrixWorld();const p=new THREE.Vector3((x-500)*.035,elevation,-(y-330)*.035).project(s.camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};}

export function projectOriginalStarter(x,y,z,width=1280,height=720){const s=stores.intro;if(!s)return null;s.camera.aspect=width/height;s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();const v=new THREE.Vector3(x,y,-z).project(s.camera);return [(v.x+1)*width/2,(1-v.y)*height/2];}
export function followOriginalBattle(b){const s=stores.battle,units=b?.units?.filter(u=>!u.isEnemy&&u.hp>0);if(!s||!units?.length||b.nativeBossDeathTimeStopped)return;const x=units.reduce((n,u)=>n+u.x,0)/units.length,y=units.reduce((n,u)=>n+u.y,0)/units.length;const p=simulationToWorld(x,y);s.camera.position.copy(s.initialCamera).add(new THREE.Vector3(p[0],0,-p[2]));s.camera.updateMatrixWorld();}

let effectManifestPromise,effectManifest;const effectDataPromises=new Map(),effectInstances=new Map();
function ensureEffectInstance(key,id,scene,requestedPath){
 let instance=effectInstances.get(key);if(instance&&instance.requestedPath===requestedPath)return instance;
 if(instance?.model){instance.model.root.removeFromParent();disposeScene(instance.model);}
 instance={pending:true,requestedPath};effectInstances.set(key,instance);
 effectManifestPromise.then(manifest=>{
  const name=requestedPath||manifest.effects.find(e=>e.m_effectType===id)?.m_effectPath;
  if(!manifest.models.includes(name)){instance.unsupported=true;instance.pending=false;return;}
  let data=effectDataPromises.get(name);if(!data){data=fetch('./assets/original/scenes/effects/'+name+'.json').then(r=>r.json());effectDataPromises.set(name,data);}
  return data.then(data=>{if(stores.battle!==scene||effectInstances.get(key)!==instance)return;const model=build(data);model.root.scale.z=1;scene.root.add(model.root);instance.model=model;instance.animation=decodeEffectAnimation(data.animation);instance.pending=false;instance.byHash=new Map(Object.entries(data.nodes).map(([key,n])=>[n.animationPathHash,model.nodes[key]]));});
 }).catch(error=>{instance.pending=false;instance.unsupported=true;console.error(error);});return instance;
}
function poseEffect(instance,point,age,scale=[1,1,1]){
 if(!instance.model)return;const p=simulationToWorld(point.x,point.y,point.worldY||0);instance.model.root.position.fromArray(p);instance.model.root.rotation.y=Math.PI/2-(point.angle||0);
 for(const channel of instance.animation?.sample(age)||[]){const node=instance.byHash.get(channel.path);if(!node||channel.values.some(v=>!Number.isFinite(v)))continue;if(channel.field==='rotation')node.quaternion.fromArray(channel.values).normalize();else node[channel.field].fromArray(channel.values);}
 instance.model.root.scale.fromArray(scale);
}
export function updateOriginalBattleEffects(b){
 const store=stores.battle;if(!store)return;effectManifestPromise??=Promise.all(['manifest','runtime'].map(name=>fetch('./assets/original/scenes/effects/'+name+'.json').then(r=>r.json()))).then(([manifest,runtime])=>(effectManifest={...manifest,runtime},effectManifest));if(!effectManifest)return;
 const active=new Set();
 b.detachedEffectVisuals??=[];b.detachedEffectVisuals.push(...(b.effectEvents?.splice(0)||[]));
 b.detachedEffectVisuals=b.detachedEffectVisuals.filter(event=>{
  const age=(b.elapsed||0)-event.createdAt,runtime=effectManifest.runtime.effects[event.effectID],selected=selectClientEffectModel(runtime,age),instance=ensureEffectInstance(event,event.effectID,store,selected?.path);
  // Non-loop Animator completion follows the source clip duration.
  // Command effectEndSecond controls object scaling, not hit-effect lifetime.
  event.lifetimeEvidence='source-nonloop-animator-duration';
  if(instance.unsupported||selected?.finished)return false;
  active.add(event);poseEffect(instance,event,selected?.time??age);return true;
 });
 const objects=b.skillVisualObjects||((b.skillCasts||[]).flatMap(cast=>(cast.objects||[]).map(object=>{object.previewAge=cast.time-object.created;object.ownerUid=cast.uid;return object;})));
 for(const object of objects){
  const age=object.createdAt==null?object.previewAge:(b.elapsed||0)-object.createdAt,owner=b.units.find(u=>u.uid===object.ownerUid),runtime=effectManifest.runtime.effects[object.data.effectID_Loop];
  if(object.visualForcedFinished||age<0||!runtime){object.visualFinished=true;continue;}
  if(object.isAttached&&owner){object.x=owner.x+object.attachOffset.x;object.y=owner.y+object.attachOffset.y;}
  object.visualCopies??=clientEffectCreationTimes(object.data).map(at=>({at,endRequestedAt:null}));
  const stopAt=Math.min(object.life>=0?object.life:Infinity,object.terminatedAt==null?Infinity:object.terminatedAt-object.createdAt);
  const ending=(object.life>=0&&age>object.life)||(object.terminatedAt!=null&&age>=stopAt);
  if(ending){
   object.endDispatch??={index:0,nextAt:age,lastFrame:false};const dispatch=object.endDispatch;
   if(dispatch.index<object.visualCopies.length&&age>=dispatch.nextAt){object.visualCopies[dispatch.index++].endRequestedAt=age;dispatch.nextAt=age+Math.max(0,object.data.delaySecond||0);dispatch.lastFrame=true;}
   else if(dispatch.index===object.visualCopies.length&&age>=dispatch.nextAt&&dispatch.lastFrame){object.endDrainCompleteAt??=age;dispatch.lastFrame=false;}
  }
  const head=object.visualCopies[0],headPhase=selectClientEffectModel(runtime,age-head.at,{endRequestedAt:head.endRequestedAt==null?null:head.endRequestedAt-head.at});
  if(ending&&runtime.actionType===3&&headPhase?.phase==='end'&&headPhase.finished)object.loopFinishedAt??=age;
  const lifecycle=sampleClientEffectLifecycle(object.data,{age,life:object.life,terminatedAt:object.terminatedAt==null?null:object.terminatedAt-object.createdAt,loopActionType:runtime.actionType,loopFinishedAt:object.loopFinishedAt,endDrainCompleteAt:ending?(object.endDrainCompleteAt??Infinity):null});
  if(lifecycle.finished){object.visualFinished=true;continue;}
  for(const [index,copy]of object.visualCopies.entries()){
   if(age<copy.at)continue;
   const phase=selectClientEffectModel(runtime,age-copy.at,{endRequestedAt:copy.endRequestedAt==null?null:copy.endRequestedAt-copy.at});if(!phase?.path)continue;
   const instance=ensureEffectInstance(copy,object.data.effectID_Loop,store,phase.path);active.add(copy);
   const effectScale=runtime.actionType===3?1:Math.min(1,object.data.effectStartSecond>0?(age-copy.at)/object.data.effectStartSecond:1),scale=lifecycle.objectScale*effectScale;
   poseEffect(instance,{...object,worldY:(owner?.worldY||0)+(object.data.createOffsetY||0)},phase.time,[object.scaleX??object.scale,object.scaleY??object.scale,object.scaleZ??object.scale].map(v=>v*scale));
  }
 }
 if(b.skillVisualObjects)b.skillVisualObjects=b.skillVisualObjects.filter(object=>!object.visualFinished);
 if(active.size)store.effectVersion=(store.effectVersion||0)+1;
 for(const [object,instance]of effectInstances)if(!active.has(object)&&!object.nativeBossDeathEffect){if(instance.model){instance.model.root.removeFromParent();disposeScene(instance.model);}effectInstances.delete(object);store.effectVersion=(store.effectVersion||0)+1;}
}

export function updateOriginalBattleActors(b,time,species){
 const store=stores.battle;if(!store?.actorRuntime)return;
 for(const unit of b.units)unit.dex=species.find(s=>s.id===unit.speciesId)?.dex;
 store.actorRuntime.update(b.units,time,{paused:b.paused||b.nativeBossDeathTimeStopped,battle:b});store.actorVersion=(store.actorVersion||0)+1;
}
export function updateOriginalCampActors(game,time,species,monsterStats){
 const store=stores.camp;if(!store)return;store.actorRuntime??=createOriginalActorRuntime(store.root,{lightingProfile:store.lightingProfile});
 const units=(game.monsters||[]).slice(0,13).map((m,i)=>{const position=[-9+(i%5)*4+Math.sin(time*.22+i),0,9+Math.floor(i/5)*4];return{uid:m.uid,dex:species.find(s=>s.id===m.speciesId)?.dex,hp:1,shiny:m.shiny,modelScale:1+(monsterStats?.(game,m)?.modelScalePercent??0),position,x:position[0],y:position[2]}});
 store.actorRuntime.update(units,time);store.actorVersion=(store.actorVersion||0)+1;
 if(!Object.hasOwn(game,'nativeCampActorUIDs'))Object.defineProperty(game,'nativeCampActorUIDs',{value:[],writable:true,configurable:true});game.nativeCampActorUIDs=units.filter(u=>u.nativeActorRendered).map(u=>u.uid);
}
export function updateOriginalStarterActors(time,species,ids,selected,points){
 const store=stores.intro;if(!store)return;store.actorRuntime??=createOriginalActorRuntime(store.root,{lightingProfile:store.lightingProfile});
 const units=ids.map((id,i)=>({uid:'starter-'+id,dex:species.find(s=>s.id===id)?.dex,hp:1,position:points[i],facing:Math.PI,animationKey:id===selected?'joy_motion':'idle_motion'}));
 store.actorRuntime.update(units,time);store.actorVersion=(store.actorVersion||0)+1;return units.filter(u=>u.nativeActorRendered).map(u=>u.uid.slice(8));
}




let teamScenePromise,teamRenderCanvas;
export function prepareOriginalTeamModels(){
 if(!teamScenePromise)teamScenePromise=fetch('./'+TEAM_SOURCE.scenePath).then(r=>{if(!r.ok)throw Error('Original team scene unavailable');return r.json();}).then(data=>{
  const light=TEAM_SOURCE.actorLighting.lights[0],lightingProfile={ambientMode:3,ambientColor:TEAM_SOURCE.actorLighting.ambientColor,intensity:light.intensity,rotation:light.rotation,lightColor:{r:light.color[0],g:light.color[1],b:light.color[2]}};
  const store=stores.team=build({...data,mode:'team',lightingProfile});
  const camera=TEAM_SOURCE.actorCamera;store.camera=new THREE.PerspectiveCamera(camera.fov,1,camera.near,camera.far);store.scene.background=null;
  store.actorRuntime=createOriginalActorRuntime(store.root,{lightingProfile});return true;
 });
 return teamScenePromise;
}
// Source square RT remains512x512/aspect1. Display canvas is RawImage and may
// stretch the completed image; its aspect must not change the source camera.
export function drawOriginalTeamModels(canvas,game,time,species,monsterStats){
 const store=stores.team;if(!store){prepareOriginalTeamModels().catch(console.error);return false;}
 if(!teamRenderCanvas){teamRenderCanvas=canvas.ownerDocument.createElement('canvas');teamRenderCanvas.width=teamRenderCanvas.height=512;}
 const members=game.team.map(uid=>game.monsters.find(m=>m.uid===uid)).filter(Boolean);
 const entries=members.map(m=>({rangeType:m.skillRangeType??(species.find(s=>s.id===m.speciesId)?.range?1:0),modelScalePercent:monsterStats?.(game,m)?.modelScalePercent??m.modelScalePercent??0})),plan=originalCustomTeamModelPlan(entries);
 if(!plan)return false;
 const key=members.map(m=>m.uid+':'+m.speciesId+':'+!!m.shiny).join('|');
 if(store.teamKey!==key){store.teamKey=key;store.orbitTime=0;store.lastTeamTime=time;}
 const activeDt=store.lastTeamTime===undefined?0:time-store.lastTeamTime;store.orbitTime=(store.orbitTime||0)+(activeDt>=0&&activeDt<=.15?activeDt:0);store.lastTeamTime=time;
 const units=members.map((m,i)=>({uid:m.uid,dex:species.find(s=>s.id===m.speciesId)?.dex,speciesId:m.speciesId,shiny:!!m.shiny,position:[plan[i].position.x,plan[i].position.y,plan[i].position.z],x:plan[i].position.x,y:plan[i].position.z,hp:1,maxHp:1,isEnemy:false,facing:0,modelScale:plan[i].scale}));
 const orbit=originalCustomTeamCameraOrbit(store.orbitTime);store.camera.position.set(orbit.position.x,orbit.position.y,-orbit.position.z);store.camera.up.set(0,1,0);store.camera.lookAt(orbit.lookAt.x,orbit.lookAt.y,-orbit.lookAt.z);
 store.actorVersion=store.actorRuntime.update(units,time)+time;
 renderOriginalScene(teamRenderCanvas,'team',time);
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(teamRenderCanvas,0,0,canvas.width,canvas.height);
 canvas.dataset.nativeModels=String(units.filter(u=>u.nativeActorRendered).length);canvas.dataset.sourceRenderTexture='512x512';return true;
}

// A separate unscaled clock drives BossDeadEffect while the battle clock is stopped.
export function originalBossDeathPending(b){return !!b?.units?.some(u=>u.isBoss&&u.hp<=0&&!u.nativeBossDeathFinished)||!!b?.nativeBossDeaths?.some(d=>!d.lifecycle.finished);}
export function updateOriginalBossDeaths(b,time){
 const store=stores.battle;if(!store?.actorRuntime||!b)return;
 b.nativeBossDeathsEnabled=true;
 b.nativeBossDeaths??=[];const dt=Math.max(0,Math.min(.1,b.nativeBossDeathLastTime==null?0:time-b.nativeBossDeathLastTime));b.nativeBossDeathLastTime=time;
 effectManifestPromise??=Promise.all(['manifest','runtime'].map(name=>fetch('./assets/original/scenes/effects/'+name+'.json').then(r=>{if(!r.ok)throw Error('Effect manifest '+r.status);return r.json();}))).then(([manifest,runtime])=>(effectManifest={...manifest,runtime},effectManifest)).catch(e=>{b.nativeBossDeathAssetError=String(e);return {effects:[],models:[],runtime:{effects:{}}};});
 for(const unit of b.units.filter(u=>u.isBoss&&u.hp<=0&&!u.nativeBossDeathFinished)){
  if(b.nativeBossDeaths.some(d=>d.unit===unit))continue;
  const death={unit,clock:0,effects:[],tweens:[],trace:[]};const record=(n,...a)=>death.trace.push({clock:death.clock,name:n,args:a});
  const tween=(kind,target,duration,ease=1)=>{death.tweens=death.tweens.filter(t=>t.kind!==kind);death.tweens.push({kind,from:kind==='fov'?store.camera.fov:store.camera.position.clone(),target,duration,ease,start:death.clock});};
  death.lifecycle=createOriginalBossDeathLifecycle({
   // Original coroutine readiness predicate is not yet bridged; expose boundary.
   ready:()=>{b.nativeBossDeathReadinessApproximation=true;return true;},position:()=>unit.position||simulationToWorld(unit.x,unit.y,unit.worldY||0),rotation:()=>store.actorRuntime.instances.get(unit.uid)?.model?.root.quaternion.toArray()||[0,0,0,1],
   stopTimeScale:()=>{b.nativeBossDeathTimeStopped=true;record('stopTimeScale');},resumeTimeScale:()=>record('resumeTimeScale'),
   deleteSkillObjects:()=>{for(const o of b.skillVisualObjects||[])o.visualForcedFinished=true;record('deleteSkillObjects');},
   cancelCameraAnimations:()=>{death.tweens=[];record('cancelCameraAnimations');},setCameraDeathMode:v=>record('setCameraDeathMode',v),
   targetCamera:duration=>{b.nativeBossDeathCameraTargetApproximation=true;const p=unit.position||simulationToWorld(unit.x,unit.y,unit.worldY||0);tween('position',store.initialCamera.clone().add(new THREE.Vector3(p[0],p[1],-p[2])),duration);record('targetCamera',duration);},
   clearCameraPositionOffset:d=>record('clearCameraPositionOffset',d),cameraFov:()=>store.camera.fov,
   changeFov:(value,duration,ease)=>{tween('fov',value,duration,ease);record('changeFov',value,duration,ease);},
   requestMotion:id=>{unit.nativeBossDeathMotionRequested=true;record('requestMotion',id);},
   requestShadowDeath:v=>record('requestShadowDeath',v),setActorAnimatorUpdateMode:v=>record('setActorAnimatorUpdateMode',v),
   setGaugeMode:v=>{unit.nativeGaugeMode=v;record('setGaugeMode',v);},changeGaugeAnimation:v=>{unit.nativeGaugeAnimation=v;record('changeGaugeAnimation',v);},
   playVoice:type=>{b.nativeBossDeathVoiceEvents??=[];b.nativeBossDeathVoiceEvents.push({uid:unit.uid,dex:unit.dex,type});record('playVoice',type);},
   playSound:id=>{b.audioEvents??=[];b.audioEvents.push({eventId:id});record('playSound',id);},
   createEffect:spec=>{const event={...spec,nativeBossDeathEffect:true,age:0,loadAge:0};death.effects.push(event);record('createEffect',spec.effectID);return event;},
   deleteEffect:event=>{event.deleted=true;const i=effectInstances.get(event);if(i?.model){i.model.root.removeFromParent();disposeScene(i.model);}effectInstances.delete(event);record('deleteEffect',event.effectID);},
   effectFinished:event=>!!event.finished,motionFinished:id=>store.actorRuntime.motionFinished(unit.uid,id)||death.clock>15&&(!store.actorRuntime.instances.get(unit.uid)?.model||!store.actorRuntime.instances.get(unit.uid)?.clip)
  });b.nativeBossDeaths.push(death);
 }
 for(const death of b.nativeBossDeaths){if(death.lifecycle.finished)continue;death.clock+=dt;
  for(const event of death.effects){if(event.deleted||event.finished)continue;event.loadAge+=dt;
   if(!effectManifest){if(event.loadAge>15){event.finished=true;event.assetUnavailable=true;}continue;}
   const runtime=effectManifest.runtime.effects[event.effectID],i=ensureEffectInstance(event,event.effectID,store,runtime?.path);
   if(i.unsupported||!runtime||i.pending&&event.loadAge>15){event.finished=true;event.assetUnavailable=true;continue;}
   if(i.pending)continue;event.age+=dt;event.finished=!!selectClientEffectModel(runtime,event.age)?.finished;
   if(i.model){const p=event.position;i.model.root.position.fromArray(p);i.model.root.quaternion.fromArray(event.rotation);
    for(const c of i.animation?.sample(event.age)||[]){const n=i.byHash.get(c.path);if(n&&c.values.every(Number.isFinite)){if(c.field==='rotation')n.quaternion.fromArray(c.values).normalize();else n[c.field].fromArray(c.values);}}
   }
  }
  death.lifecycle.tick(dt);
  for(const t of death.tweens){const q=Math.min(1,(death.clock-t.start)/t.duration),k=t.ease===2?q*(2-q):t.ease===18?q===1?1:1-Math.pow(2,-10*q):q;
   if(t.kind==='fov'){store.camera.fov=t.from+(t.target-t.from)*k;store.camera.updateProjectionMatrix();}else store.camera.position.copy(t.from).lerp(t.target,k);
  }store.camera.updateMatrixWorld();store.effectVersion=(store.effectVersion||0)+1;
  if(death.lifecycle.finished)death.unit.nativeBossDeathFinished=true;
 }
 b.nativeBossDeathTimeStopped=b.nativeBossDeaths.some(d=>d.lifecycle.freezesBattle);
}
