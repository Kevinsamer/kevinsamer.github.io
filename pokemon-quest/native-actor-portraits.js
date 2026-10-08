import {CLIENT_SCENE_LIGHTING} from './client-scene-lighting.js';
import * as THREE from './vendor/three/three.module.js';
import {loadOriginalActorAsset,loadOriginalActorClip,createOriginalActorInstance} from './native-actors.js';
import {CLIENT_MODEL_MANIFEST,CLIENT_MODEL_VARIANTS} from './client-model-manifest.js';
import {actorPortraitFrame,actorPortraitDestination} from './native-actor-portrait-fit.js';
const RESOLUTION=384,MAX_CACHE=64,entries=new Map();
let surface,renderer,scene,camera,rendererFailed=false;
function initialize(){
 if(renderer)return true;if(rendererFailed||typeof document==='undefined')return false;
 try{surface=document.createElement('canvas');surface.width=surface.height=RESOLUTION;renderer=new THREE.WebGLRenderer({canvas:surface,alpha:true,antialias:true,preserveDrawingBuffer:false});renderer.setPixelRatio(1);renderer.setSize(RESOLUTION,RESOLUTION,false);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.001,10000);return true;}catch(error){rendererFailed=true;console.error('Original actor portrait WebGL unavailable',error);return false;}
}
const reference=(dex,shiny)=>CLIENT_MODEL_VARIANTS[dex]?.[shiny?'R':'default']||CLIENT_MODEL_MANIFEST[dex];
const getDex=species=>Number(typeof species==='number'?species:species?.dex??species?.client?.m_monsterNo);
function trimCache(){for(const [key,value]of entries){if(entries.size<=MAX_CACHE)break;if(value.pending)continue;value.model?.dispose();entries.delete(key);}}
function ensure(dex,shiny){
 const key=dex+':'+!!shiny;if(entries.has(key)){const value=entries.get(key);entries.delete(key);entries.set(key,value);return value;}
 const entry={key,dex,shiny,pending:true};entries.set(key,entry);
 entry.promise=loadOriginalActorAsset(dex,shiny).then(async data=>{
  const ref=reference(dex,shiny);let clip=null;try{clip=await loadOriginalActorClip(ref?.animationMap?.idle_motion)}catch(error){console.warn('Original actor portrait idle clip unavailable',dex,error)}
  if(entries.get(key)!==entry)return false;entry.model=createOriginalActorInstance(data,{reflectProbeZ:false,shadow:false,lightingProfile:CLIENT_SCENE_LIGHTING.camp});entry.clip=clip;entry.pending=false;trimCache();return true;
 }).catch(error=>{entry.pending=false;entry.failed=true;console.error('Original actor portrait failed',dex,error);return false;});
 return entry;
}
function renderPortrait(entry,pose){
 if(!initialize())return false;
 const model=entry.model;model.reset();model.sample(entry.clip,pose);model.root.updateMatrixWorld(true);model.skeletons.forEach(s=>s.update());
 scene.add(model.root);
 const box=new THREE.Box3().setFromObject(model.root,true),center=box.getCenter(new THREE.Vector3()),extent=box.getSize(new THREE.Vector3());
 if(box.isEmpty()){model.root.removeFromParent();return false;}
 // Presentation camera fit; this is not a recovered original UI camera pose.
 const distance=Math.max(extent.length()*2,1);camera.position.copy(center).add(new THREE.Vector3(.6,.35,1).normalize().multiplyScalar(distance));camera.up.set(0,1,0);camera.lookAt(center);camera.updateMatrixWorld(true);
 const viewBounds=new THREE.Box3();for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])viewBounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 const frame=actorPortraitFrame({min:viewBounds.min.toArray(),max:viewBounds.max.toArray()});Object.assign(camera,{left:frame.left,right:frame.right,bottom:frame.bottom,top:frame.top,near:.001,far:distance+extent.length()*2+1});camera.updateProjectionMatrix();
 const foot=new THREE.Vector3(center.x,box.min.y,center.z).project(camera);entry.foot=[(foot.x+1)*RESOLUTION/2,(1-foot.y)*RESOLUTION/2];
 renderer.clear();renderer.render(scene,camera);
 entry.canvas??=document.createElement('canvas');entry.canvas.width=entry.canvas.height=RESOLUTION;const ctx=entry.canvas.getContext('2d');ctx.clearRect(0,0,RESOLUTION,RESOLUTION);ctx.drawImage(surface,0,0);entry.pose=pose;model.root.removeFromParent();return true;
}
/** Draw a cached original 3D model onto a Canvas2D context. x,y are feet.
 * Returns false while loading or if unavailable, allowing the caller fallback.
 * No source model rescaling is applied; the camera fits individual geometry.
 * pose is idle-animation seconds; default 0 produces a stable portrait. */
export function drawOriginalActorPortrait(ctx,species,x,y,size,{shiny=false,pose=0}={}){
 const dex=getDex(species);if(!Number.isInteger(dex)||dex<1||dex>151||!Number.isFinite(size)||size<=0)return false;
 const entry=ensure(dex,shiny);if(entry.pending||entry.failed||!entry.model)return false;
 const time=Math.max(0,Math.round((Number(pose)||0)*30)/30);if(!entry.canvas||entry.pose!==time){if(!renderPortrait(entry,time))return false;}
 const dest=actorPortraitDestination(x,y,size,RESOLUTION,entry.foot);ctx.drawImage(entry.canvas,dest.x,dest.y,dest.width,dest.height);return true;
}
export function preloadOriginalActorPortraits(species,{shiny=false}={}){return Promise.all(species.map(value=>{const dex=getDex(value);return Number.isInteger(dex)&&dex>=1&&dex<=151?ensure(dex,shiny).promise:Promise.resolve(false)}));}
export function clearOriginalActorPortraits(){for(const entry of entries.values())entry.model?.dispose();entries.clear();}
export function disposeOriginalActorPortraitRenderer(){clearOriginalActorPortraits();renderer?.dispose();renderer=null;surface=null;scene=null;camera=null;rendererFailed=false;}


