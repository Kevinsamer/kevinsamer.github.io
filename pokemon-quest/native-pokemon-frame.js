import * as THREE from './vendor/three/three.module.js';
import {originalPokemonFrameCamera} from './client-pokemon-portrait-source.js';
import {loadOriginalActorAsset,loadOriginalActorClip,createOriginalActorInstance} from './native-actors.js';
import {CLIENT_MODEL_MANIFEST,CLIENT_MODEL_VARIANTS} from './client-model-manifest.js';
let renderer,surface,scene,camera,root,active;
function initialize(){if(renderer)return;surface=document.createElement('canvas');renderer=new THREE.WebGLRenderer({canvas:surface,alpha:true,antialias:false});renderer.setPixelRatio(1);renderer.setSize(512,512,false);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.setClearColor(0,0);scene=new THREE.Scene();root=new THREE.Group();root.scale.z=-1;scene.add(root);camera=new THREE.PerspectiveCamera(20,1,3,180);}
function configureCamera(dex){const source=originalPokemonFrameCamera(dex);if(!source)return false;renderer.setClearColor(new THREE.Color(...source.background.slice(0,3)),source.background[3]);camera.fov=source.fov;camera.near=source.near;camera.far=source.far;camera.position.fromArray(source.position);camera.position.z*=-1;const q=new THREE.Quaternion().fromArray(source.rotation),forward=new THREE.Vector3(0,0,1).applyQuaternion(q),up=new THREE.Vector3(0,1,0).applyQuaternion(q);forward.z*=-1;up.z*=-1;camera.up.copy(up);camera.lookAt(camera.position.clone().add(forward));camera.updateProjectionMatrix();return true;}
function ensure({dex,shiny=false,time=0,instanceKey='',lightingProfile,motion='idle_motion',additiveMotion='uniq_motion'}){
 if(!lightingProfile)return null;initialize();const key=[instanceKey,dex,shiny,motion,additiveMotion,JSON.stringify(lightingProfile)].join(':');
 if(active?.key!==key){clearOriginalPokemonFrame();const entry=active={key,pending:true,latestTime:time};const ref=CLIENT_MODEL_VARIANTS[dex]?.[shiny?'R':'default']||CLIENT_MODEL_MANIFEST[dex];
  entry.ready=Promise.all([loadOriginalActorAsset(dex,shiny),loadOriginalActorClip(ref?.animationMap?.[motion]),loadOriginalActorClip(ref?.animationMap?.[additiveMotion])]).then(([data,clip,additiveClip])=>{if(active!==entry)return false;entry.model=createOriginalActorInstance(data,{shadow:false,lightingProfile});entry.clip=clip;entry.additiveClip=additiveClip;entry.startedAt=entry.latestTime;entry.pending=false;root.add(entry.model.root);return true;}).catch(error=>{entry.pending=false;entry.failed=true;console.error(error);return false;});
 }active.latestTime=time;return active;
}
/** SetupText creates the model even while the profile drawer is closed. */
export function prepareOriginalPokemonFrame(options){return ensure(options)?.ready??Promise.resolve(false);}
/** Source square RT and species camera; caller supplies recovered pose and lighting. */
export function drawOriginalPokemonFrame(canvas,options={}){
 if(!canvas)return false;const entry=ensure(options),{dex,time=0,position=[0,0,0],rotation=[0,0,0,1],modelScale=1}=options;
 if(!entry||entry.pending||entry.failed||!entry.model){canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);delete canvas.dataset.sourceFrameCamera;return false;}
 const model=entry.model,age=Math.max(0,time-entry.startedAt);model.reset();model.sample(entry.clip,age);model.sampleAdditive(entry.additiveClip,age);model.root.position.fromArray(position);model.root.quaternion.fromArray(rotation);model.root.scale.setScalar(modelScale);model.root.updateMatrixWorld(true);model.skeletons.forEach(s=>s.update());if(!configureCamera(dex))return false;renderer.clear();renderer.render(scene,camera);const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(surface,0,0,canvas.width,canvas.height);canvas.dataset.sourceRenderTexture='512x512';canvas.dataset.sourceFrameCamera=String(dex);return true;
}
export function clearOriginalPokemonFrame(){active?.model?.dispose();active=null;root?.clear();}
export function disposeOriginalPokemonFrame(){clearOriginalPokemonFrame();renderer?.dispose();renderer=null;surface=null;scene=null;camera=null;root=null;}
