import {originalShadowWorldPosition,originalShadowRotationEulerInputs} from './client-actor-shadow-runtime-rules.js';
import {CLIENT_ACTOR_MATERIAL} from './client-actor-material.js';
import {createOriginalActorShadow} from './native-actor-shadow.js';
import {originalBattleLightingProfile} from './client-battle-render-settings.js';
import {CLIENT_ACTOR_ANIMATION} from './client-actor-animation.js';
import * as THREE from './vendor/three/three.module.js';
import {CLIENT_MODEL_MANIFEST,CLIENT_MODEL_VARIANTS} from './client-model-manifest.js';
import {createOriginalActor} from './native-actor-model.js';
import {decodeEffectAnimation} from './native-effect-animation.js';
import {originalBattleLighting} from './native-battle-environment.js';
import {selfSetting,enemySetting} from './client-rules.js';
import {simulationToWorld} from './native-world-map.js';
const assets=new Map(),clips=new Map(),geometryCache=new Map(),materialCache=new Map();
// Original Gamma/Flat lighting is supplied per scene and battle region.
const defaultLightingProfile=originalBattleLightingProfile();
const reference=(dex,rare)=>CLIENT_MODEL_VARIANTS[dex]?.[rare?'R':'default']||CLIENT_MODEL_MANIFEST[dex];
export function loadOriginalActorAsset(dex,rare=false){const ref=reference(dex,rare);if(!ref)return Promise.reject(Error('Missing original actor '+dex));if(!assets.has(ref.path))assets.set(ref.path,fetch('./'+ref.path).then(r=>{if(!r.ok)throw Error('Actor HTTP '+r.status);return r.json()}));return assets.get(ref.path)}
export function loadOriginalActorClip(ref){if(!ref?.path)return Promise.resolve(null);if(!clips.has(ref.path))clips.set(ref.path,fetch('./'+ref.path).then(r=>{if(!r.ok)throw Error('Actor animation HTTP '+r.status);return r.json()}).then(decodeEffectAnimation));return clips.get(ref.path)}
export async function preloadOriginalActors(species){await Promise.all([Promise.all([...Object.values(CLIENT_ACTOR_MATERIAL),CLIENT_ACTOR_ANIMATION[14].clip].map(loadOriginalActorClip)),...species.map(dex=>loadOriginalActorAsset(dex).then(()=>Promise.all(Object.values(reference(dex).animationMap).map(ref=>loadOriginalActorClip(ref)))))])}
export function createOriginalActorInstance(data,{reflectProbeZ=true,shadow=true,lightingProfile=defaultLightingProfile}={}){const lighting=originalBattleLighting({intensity:lightingProfile.intensity,rotation:lightingProfile.rotation,color:lightingProfile.lightColor});const actor=createOriginalActor(THREE,data,{lighting,ambientColor:lightingProfile.ambientColor,reflectProbeZ,geometryCache,materialCache});if(shadow){const dex=Number(data.species)||Number(data.name.match(/\d+/)?.[0]);actor.shadow=createOriginalActorShadow(THREE,dex);actor.root.add(actor.shadow.root);actor.shadow.root.position.set(0,0,0);actor.shadowFollow=Object.values(actor.nodes).find(n=>n.name==='rootJT');}return actor}
export function createOriginalActorRuntime(parent,{lightingProfile=defaultLightingProfile}={}){
 const instances=new Map();let alive=true,lastTime=null;
 function ensure(unit){const dex=unit.dex,key=dex+':'+!!unit.shiny;let instance=instances.get(unit.uid);if(instance&&instance.assetKey===key)return instance;if(instance)instance.model?.dispose();
  instance={assetKey:key,lastX:unit.x,lastY:unit.y,lastHP:unit.hp,age:0,action:null,pending:true};instances.set(unit.uid,instance);
  loadOriginalActorAsset(dex,!!unit.shiny).then(data=>{if(!alive||instances.get(unit.uid)!==instance)return;instance.model=createOriginalActorInstance(data,{lightingProfile});if(Number.isFinite(unit.nativeSpawnYaw))instance.model.root.rotation.y=unit.nativeSpawnYaw;parent.add(instance.model.root);instance.ref=reference(dex,!!unit.shiny);loadOriginalActorClip(instance.ref.animationMap.uniq_motion).then(clip=>instance.uniqClip=clip).catch(console.error);instance.pending=false;instance.model.root.updateMatrixWorld(true);instance.height=new THREE.Box3().setFromObject(instance.model.root).max.y;}).catch(error=>{instance.pending=false;instance.failed=true;console.error(error)});return instance;
 }
 function select(instance,key,identity){if(instance.action===key&&instance.identity===identity)return;instance.action=key;instance.identity=identity;instance.age=0;instance.clip=null;instance.clipFailed=false;instance.blend=null;instance.model.reset();const request=key+':'+identity;instance.request=request;loadOriginalActorClip(instance.ref.animationMap[key]||Object.values(CLIENT_ACTOR_ANIMATION).find(v=>v.clip?.name===key)?.clip).then(clip=>{if(instance.request===request){instance.clip=clip;if(key==='Mmotion_dead_boss')instance.age=0;}}).catch(error=>{instance.clipFailed=true;console.error(error)});}
 function update(units,time,{paused=false,battle=null}={}){
  const realDt=Math.max(0,Math.min(.1,lastTime===null?0:time-lastTime));lastTime=time;const used=new Set();let rendered=0;
  const currentIDs=new Set(units.map(u=>u.uid)),departing=[...instances.values()].filter(i=>i.model&&i.lastUnit?.hp<=0&&!currentIDs.has(i.lastUnit.uid)&&((i.lastUnit.isBoss&&!i.lastUnit.nativeBossDeathFinished)||i.action!==(i.lastUnit.isBoss?'Mmotion_dead_boss':'dead_motion')||!i.clip||i.age<=i.clip.duration)).map(i=>i.lastUnit);
  for(const unit of [...units,...departing]){const unscaledDeath=unit.isBoss&&unit.hp<=0&&unit.nativeBossDeathMotionRequested,dt=paused&&!unscaledDeath?0:realDt;used.add(unit.uid);const instance=ensure(unit);instance.lastUnit=unit;if(!instance.model){unit.nativeActorRendered=false;continue;}
   const moved=Math.hypot((unit.x??0)-(instance.lastX??0),(unit.y??0)-(instance.lastY??0))>.0001;
   const cast=battle?.skillCasts?.find(c=>c.uid===unit.uid&&!c.finished);
   instance.clock=(instance.clock||0)+dt;let action=unit.hp<=0?(unit.isBoss?(unit.nativeBossDeathMotionRequested?'Mmotion_dead_boss':instance.action||'idle_motion'):'dead_motion'):unit.animationKey||(unit.skillCasting?(cast?.skill.isNormalAttack?'attack_motion':moved?'run_motion':'idle_motion'):moved?'run_motion':'idle_motion');
   if(instance.lastHP<=0&&unit.hp>0){instance.returnUntil=instance.clock+(instance.ref.animationMap.return_motion?.duration||0);}
   if(unit.hp>0&&instance.clock<(instance.returnUntil||0))action='return_motion';
   let identity=unit.skillCasting?cast:action;
   const sourceState=CLIENT_ACTOR_ANIMATION[unit.skillAnimation];
   if(unit.hp>0&&unit.skillCasting&&sourceState?.layer===0&&sourceState.clip){action=sourceState.clip.name;identity=String(unit.skillAnimationVersion||0)+':'+action;}
   if(unit.hp>0&&unit.skillCasting&&instance.autoExited!==undefined&&instance.autoExited===identity)action=moved?'run_motion':'idle_motion';
   if(action.endsWith('_start')&&instance.identity===identity&&instance.action===action.replace(/_start$/,'_loop'))action=instance.action;
   if(!paused||unscaledDeath||!instance.action)select(instance,action,identity);instance.age+=dt;
   if((!paused||unscaledDeath)&&instance.clip&&!instance.clip.loop&&action.endsWith('_start')){
    const transition=sourceState?.transition,exit=(transition?.m_ExitTime??1)*instance.clip.duration;
    if(instance.age>=exit){const loop=action.replace(/_start$/,'_loop');if(instance.ref.animationMap[loop]){const fromClip=instance.clip,fromAge=instance.age;select(instance,loop,identity);instance.blend={fromClip,fromAge,duration:transition?.m_TransitionDuration||0};}}
   }else if((!paused||unscaledDeath)&&instance.clip&&!instance.clip.loop&&sourceState?.transition?.m_DestinationState===30001&&instance.age>=sourceState.transition.m_ExitTime*instance.clip.duration&&unit.skillCasting){
    instance.autoExited=identity;select(instance,moved?'run_motion':'idle_motion',identity);
   }
   const blend=instance.blend;
   if(blend&&instance.clip&&blend.duration>0&&instance.age<blend.duration){instance.model.reset();instance.model.sample(blend.fromClip,blend.fromAge+instance.age);const fromPose=instance.model.capturePose();instance.model.reset();instance.model.sample(instance.clip,instance.age);instance.model.blendPose(fromPose,instance.age/blend.duration);}
   else{instance.model.reset();instance.model.sample(instance.clip,instance.age);if(instance.clip)instance.blend=null;}
   instance.model.sampleAdditive(instance.uniqClip,instance.clock);
   const revived=instance.lastHP<=0&&unit.hp>0, died=unit.hp<=0&&instance.lastHP>0, hurt=unit.hp>0&&unit.damageAnimationVersion!==undefined&&unit.damageAnimationVersion!==instance.damageVersion;
   const explicitMaterial={25:'mat_damage',26:'mat_evolvein',27:'mat_evolveout'}[unit.skillAnimation];
   const bossDeathStarted=unit.isBoss&&unit.nativeBossDeathMotionRequested&&!instance.bossDeathStarted;if(bossDeathStarted)instance.bossDeathStarted=true;
   const materialEvent=(died&&!unit.isBoss)||bossDeathStarted?(unit.isBoss?'mat_dead_boss':'mat_dead'):revived?'mat_return':hurt?'mat_damage':explicitMaterial&&instance.materialVersion!==unit.skillAnimationVersion?explicitMaterial:null;
   if(materialEvent){instance.materialAge=0;instance.materialKey=materialEvent;instance.materialVersion=unit.skillAnimationVersion;instance.materialClip=null;const request=instance.materialRequest={};loadOriginalActorClip(CLIENT_ACTOR_MATERIAL[materialEvent]).then(clip=>{if(instance.materialRequest===request)instance.materialClip=clip}).catch(console.error);}
   instance.materialAge=(instance.materialAge||0)+dt;instance.model.resetMaterial();if(instance.materialClip)instance.model.sampleMaterial(instance.materialClip,instance.materialAge);if(unit.nativeSilhouette)for(const node of Object.values(instance.model.nodes))if(node.isMesh)node.userData.originalActorColor=[-1,-1,-1,1];
   if(instance.model.shadow){const p=instance.model.shadow.mesh.userData.sourceScale||=instance.model.shadow.mesh.scale.toArray();if((died&&!unit.isBoss)||bossDeathStarted){instance.shadowDeathClock=instance.clock;instance.shadowDeathFrom=instance.shadowScaleFactor??1;}if(revived){instance.shadowReturnClock=instance.clock;instance.shadowReturnFrom=instance.shadowScaleFactor??0;}const factor=unit.hp<=0?(instance.shadowDeathFrom??1)*Math.max(0,1-(instance.clock-(instance.shadowDeathClock??instance.clock))):instance.shadowReturnClock===undefined?1:(instance.shadowReturnFrom??0)+(1-(instance.shadowReturnFrom??0))*Math.min(1,instance.clock-instance.shadowReturnClock);instance.shadowScaleFactor=factor;instance.model.shadow.mesh.scale.fromArray(p.map(v=>v*factor));}
   let angle=unit.facing;if(angle===undefined){if(unit.skillCasting)angle=Math.PI/2-(unit.skillFacing||0);else if(moved)angle=Math.atan2(unit.x-instance.lastX,unit.y-instance.lastY);else{const target=battle?.units?.filter(v=>v.hp>0&&v.isEnemy!==unit.isEnemy).sort((a,b)=>Math.hypot(a.x-unit.x,a.y-unit.y)-Math.hypot(b.x-unit.x,b.y-unit.y))[0];if(target)angle=Math.atan2(target.x-unit.x,target.y-unit.y);}}
   const root=instance.model.root;if(angle!==undefined){let delta=Math.atan2(Math.sin(angle-root.rotation.y),Math.cos(angle-root.rotation.y));const cfg=unit.isEnemy?enemySetting:selfSetting,rate=cfg.m_navMeshAgent.m_angularSpeed*(unit.clientEnemy?.m_characterSettingParameterPercent?.m_navMeshAgent?.m_angularSpeed??1)*Math.PI/180;if(unit.nativeFacingImmediate)root.rotation.y=angle;else root.rotation.y+=Math.max(-rate*dt,Math.min(rate*dt,delta));}
   const scale=unit.clientEnemy?.m_scale??unit.modelScale??1;root.scale.setScalar(scale);root.position.fromArray(unit.position||simulationToWorld(unit.x,unit.y,unit.worldY||0));
   root.visible=unit.hp>0||(unit.isBoss&&!unit.nativeBossDeathFinished)||!instance.clip||instance.age<=instance.clip.duration;
   root.updateMatrixWorld(true);instance.model.skeletons.forEach(s=>s.update());
   const shadow=instance.model.shadow?.root,follow=instance.model.shadowFollow;
   if(shadow&&follow){const own=shadow.getWorldPosition(new THREE.Vector3()),target=follow.getWorldPosition(new THREE.Vector3()),world=originalShadowWorldPosition(target.toArray(),own.toArray());shadow.position.copy(root.worldToLocal(new THREE.Vector3().fromArray(world)));// Scene root reflects Unity Z for rendering; source quaternion excludes that reflection.
    const q=root.quaternion.clone().multiply(shadow.quaternion),e=new THREE.Euler().setFromQuaternion(follow.quaternion,'ZXY'),degrees=[e.x,e.y,e.z].map(v=>v*180/Math.PI),inputs=originalShadowRotationEulerInputs(q.toArray(),degrees);shadow.quaternion.setFromEuler(new THREE.Euler(...inputs.map(v=>v*Math.PI/180),'ZXY'));shadow.updateMatrixWorld(true);}

   unit.nativeActorRendered=true;unit.nativeRenderedYaw=root.rotation.y;unit.nativeModelHeight=instance.height*scale;instance.lastX=unit.x;instance.lastY=unit.y;instance.lastHP=unit.hp;instance.damageVersion=unit.damageAnimationVersion;rendered++;
  }
  for(const[key,instance]of instances)if(!used.has(key)){instance.model?.dispose();instances.delete(key)}return rendered;
 }
 return {update,instances,motionFinished(uid,motion){const i=instances.get(uid);return !!i&&(i.failed||i.clipFailed||(i.action===CLIENT_ACTOR_ANIMATION[motion]?.clip?.name&&i.clip&&i.age>=i.clip.duration));},dispose(){alive=false;for(const instance of instances.values())instance.model?.dispose();instances.clear()}};
}





