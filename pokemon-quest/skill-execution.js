import {battleTargets,selectBattleTarget} from './battle-targeting.js';
import {emitClientObjectStart,emitClientObjectImpact} from './battle-effect-events.js';
import {emitClientEffectAudio} from './client-effect-audio.js';
import {clientEffectCreationTimes} from './client-effect-lifecycle.js';
import {clientObjectDamageHitEnabled,finishClientObjectDamageHit} from './client-skill-object-lifecycle.js';
import {clientEase} from './client-easing.js';
// APK skill command interpreter. Distances remain in Unity world units until
// converted by the battle's explicit worldScale. Rendering is handled elsewhere.
import {CLIENT_NWAY} from './client-nway-data.js';
import {CLIENT_SKILL_PROGRAMS} from './client-skill-programs.js';

export function getSkillProgram(skill){return CLIENT_SKILL_PROGRAMS['Skill_'+skill.client?.m_skillPath]}
const duration=s=>Math.max(0,...s.commands.map(c=>c.startSecond+c.life));
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
const angleBetween=(u,t)=>t?Math.atan2(t.y-u.y,t.x-u.x):(u.skillFacing||0);

export function beginSkillExecution(b,u,skill,mods,damage){
  const program=getSkillProgram(skill);if(!program)return false;
  const target=selectBattleTarget(b,u);
  const repeats=mods.filter(v=>v==='whack').length;
  const sections=[];
  program.sections.forEach((s,i)=>{for(let n=0;n<=(i===1?repeats:0);n++)sections.push({source:s,delay:n?skill.client.m_rapidDelay:0})});
  const cast={uid:u.uid,skill,mods,damage,sections,index:0,time:0,delay:0,links:new Map(),objects:[],movements:[],started:new Set(),angle:angleBetween(u,target),targetUid:target?.uid,origin:{x:u.x,y:u.y}};
  b.skillCasts??=[];b.skillCasts.push(cast);u.skillCasting=true;u.skillMoveEnabled=false;u.skillFacing=cast.angle;return true;
}

export function skillColliderContains(object,target,worldScale){
  const volume=object.volume;if(!volume)return false;
  const delta=rotate((target.x-object.x)*worldScale,(target.y-object.y)*worldScale,-object.angle);
  const extend=object.broadCount||0,kind=object.data?.sizeExtendType;
  if(volume.type==='Box'&&kind===0)delta.x-=volume.sizeZ*extend*(object.scaleZ??object.scale)/2;
  // Collider dimensions are full widths. Unity X is lateral and Z is forward.
  if(volume.type==='Sphere')return Math.hypot(delta.x,delta.y)<=Math.max(0,volume.radius*(1+.25*extend)*Math.max(object.scaleX??object.scale,object.scaleY??object.scale,object.scaleZ??object.scale));
  if(volume.type==='Box')return Math.abs(delta.x)<=Math.max(0,volume.sizeZ*(1+(kind===0?extend:0))*(object.scaleZ??object.scale))/2&&Math.abs(delta.y)<=Math.max(0,volume.sizeX*(1+(kind===1?extend:0))*(object.scaleX??object.scale))/2;
  return false;
}

function positionFor(cast,u,data,scale){
  let anchor=data.createPointType===2?cast.links.get(data.createPointSkillLinkID):null;
  anchor??=u;
  const a=cast.angle+(data.createOffsetAngle||0)*Math.PI/180;
  const random=(data.createRandomRangeMin||0)+Math.random()*((data.createRandomRangeMax||0)-(data.createRandomRangeMin||0));
  const d=((data.createOffsetDistance||0)+random)/scale;
  return {x:anchor.x+Math.cos(a)*d,y:anchor.y+Math.sin(a)*d,angle:cast.angle};
}

function startCommand(b,cast,u,command,hooks){
  const d=command.data,worldScale=b.worldScale||.035;
  if(d.soundEventID&&d.soundEventID!==4294967295){b.audioEvents??=[];b.audioEvents.push({eventId:d.soundEventID,uid:u.uid,command:command.name});}
  if(command.name==='ChangeHP')hooks.changeHP?.(u,d.type,d.valueRatio,cast.skill);
  if(command.name==='ConditionSelf'){
    const durationScale=1+.25*cast.mods.filter(v=>v==='stay').length;
    hooks.selfCondition(u,d.dataID,1,durationScale);
    const share=.25*cast.mods.filter(v=>v==='sharing').length;
    if(share)for(const ally of b.units.filter(v=>v.isEnemy===u.isEnemy&&v.uid!==u.uid))hooks.selfCondition(ally,d.dataID,share,durationScale);
  }
  if(command.name.startsWith('CreateSkillObject')||command.name==='CreateSKillObjectDecoy'){
    const potential=cast.mods.filter(v=>v==='scatter').length;
    const count=1+(d.nWayPlusNum||0)+(d.isNWayPotentialEnable?potential:0);
    const width=CLIENT_NWAY[d.nWayType]?.['m_p'+Math.min(4,potential)+'AngleWidth']||0;
    const step=count>1?Math.trunc(width/(width>=360?count:count-1)):0;
    for(let i=0;i<count;i++){
      const angle=cast.angle+(count>1?(-Math.trunc(width/2)+step*i):0)*Math.PI/180;
      const object={...positionFor({...cast,angle},u,d,worldScale),command,linkID:command.linkID,data:d,volume:d.colliderVolume,scale:1,broadCount:cast.mods.filter(v=>v==='broad').length,created:cast.time,createdAt:b.elapsed||0,ownerUid:u.uid,life:command.life,hitTimes:new Map(),isAttached:d.isAttach,attachOffset:undefined};
      if(command.name==='CreateSKillObjectDecoy'){
        object.isDecoy=true;
        // The source creates a separate damageable/AI blackboard object.
        // Its HP payment and registration belong to the battle damage layer.
        hooks.createDecoy?.(object,u,cast.skill);
      }
      if(object.isAttached)object.attachOffset={x:object.x-u.x,y:object.y-u.y};
      cast.objects.push(object);cast.links.set(command.linkID,object);(b.skillVisualObjects??=[]).push(object);emitClientObjectStart(b,object,u);
      emitClientEffectAudio(b,d.effectID_Loop);object.effectAudioCopyCount=1;
    }
  }
  if(command.name==='CharaMove'||command.name==='MoveDirection'||command.name==='Move'){
    const object=command.name==='CharaMove'?u:cast.links.get(command.linkID);
    if(object&&d.distance)cast.movements.push({object,from:{x:object.x,y:object.y},at:cast.time,life:command.life,dx:Math.cos(cast.angle+(d.angleY??d.angle??0)*Math.PI/180)*d.distance/worldScale,dy:Math.sin(cast.angle+(d.angleY??d.angle??0)*Math.PI/180)*d.distance/worldScale,command});
  }
  if(command.name==='EffectScale'){
    const object=cast.links.get(command.linkID);if(object)object.volumeScale={from:[object.scaleX??object.scale,object.scaleY??object.scale,object.scaleZ??object.scale],to:[d.toX??1,d.toY??1,d.toZ??1],easing:d.easing,at:cast.time,life:command.life};
  }
  if(command.name==='NotifyMoveEnable'){
    cast.moveEnabled=true;hooks.moveEnabled?.(u,cast);
  }
  if(command.name==='ChangeAnimation'){u.skillAnimation=d.changeType;u.skillAnimationVersion=(u.skillAnimationVersion||0)+1;}
}

export function tickSkillExecutions(b,dt,hooks){
  const worldScale=b.worldScale||.035;
  for(const cast of b.skillCasts||[]){
    const u=b.units.find(v=>v.uid===cast.uid);
    if(!u||u.hp<=0){for(const object of cast.objects)object.visualForcedFinished=true;cast.finished=true;if(u)u.skillCasting=false;continue}
    const section=cast.sections[cast.index];if(!section){cast.finished=true;u.skillCasting=false;continue}
    if(cast.delay>0){cast.delay=Math.max(0,cast.delay-dt);continue}
    cast.time+=dt;
    for(let i=0;i<section.source.commands.length;i++){
      const c=section.source.commands[i];if(!cast.started.has(i)&&cast.time+1e-7>=c.startSecond){cast.started.add(i);startCommand(b,cast,u,c,hooks)}
    }
    for(const movement of cast.movements){
      const t=movement.life?Math.min(1,(cast.time-movement.at)/movement.life):1;
      // Use the recovered enum curve; rare elastic/punch/shake still fall back.
      const eased=clientEase(movement.command.data.easing,t),delta=eased-(movement.previousEased||0),object=movement.object,target={x:object.x+movement.dx*delta,y:object.y+movement.dy*delta};
      if(b.units.includes(object)&&hooks.moveActor)hooks.moveActor(object,target,movement);else{object.x=target.x;object.y=target.y;}
      movement.previousEased=eased;movement.finished=t>=1;
    }
    cast.movements=cast.movements.filter(movement=>!movement.finished);
    for(const object of cast.objects){
      const age=cast.time-object.created;if(age<0||age>object.life)continue;
      if(object.isAttached){object.x=u.x+object.attachOffset.x;object.y=u.y+object.attachOffset.y}
      if(object.volumeScale){const s=object.volumeScale,t=s.life?Math.min(1,(cast.time-s.at)/s.life):1;const eased=clientEase(s.easing,t);[object.scaleX,object.scaleY,object.scaleZ]=s.from.map((v,i)=>v+(s.to[i]-v)*eased);object.scale=object.scaleZ}
      const d=object.data;
      if(object.isDecoy){hooks.updateDecoy?.(object,u,dt,age);continue;}
      if(!clientObjectDamageHitEnabled(object))continue;
      for(const target of battleTargets(b)){
        if(target.hp<=0||target.uid===u.uid||(!d.isFriendryFire&&target.isEnemy===u.isEnemy)||!skillColliderContains(object,target,worldScale))continue;
        const previous=object.hitTimes.get(target.uid),interval=object.command.name==='CreateSkillObjectContinue'?d.damageInterval:Infinity;
        if(previous!==undefined&&age-previous+1e-7<interval)continue;
        object.hitTimes.set(target.uid,age);
        const additional=section.source.additional.filter(v=>v.linkID===object.linkID);
        hooks.hit(target,cast.damage*(d.damagePercent??1),u,cast.skill,additional,d,cast);emitClientObjectImpact(b,object,target);
        for(const c of additional)if(c.name==='Attention')hooks.attention?.(target,u,c.data.life,{priority:255,withEffect:true});
        for(const c of additional)if(c.name==='Knockback'&&c.data.distance){
          const a=angleBetween(u,target)+(c.data.angleY||0)*Math.PI/180,life=c.data.second||0;
          cast.movements.push({object:target,from:{x:target.x,y:target.y},at:cast.time,life,dx:Math.cos(a)*c.data.distance/worldScale,dy:Math.sin(a)*c.data.distance/worldScale,command:c});
        }
        if(finishClientObjectDamageHit(object)){object.terminatedAt=b.elapsed||0;break;}
      }
    }
    // SkillSequence.Execute advances only when the current command sequence
    // completes. Rapid repetitions reset section 1, then run the final section.
    if(cast.time+1e-7>=duration(section.source)){
      cast.index++;cast.time=0;cast.started.clear();cast.objects=[];cast.movements=[];cast.links.clear();cast.delay=cast.sections[cast.index]?.delay||0;
      if(cast.index>=cast.sections.length){cast.finished=true;u.skillCasting=false;delete u.skillAnimation;hooks.finished?.(u,cast)}
    }
  }
  b.skillCasts=(b.skillCasts||[]).filter(v=>!v.finished);
  // EffectManager.Create sound follows logical copy creation, independent of
  // asynchronously fetched visual meshes and Animator phase transitions.
  for(const object of b.skillVisualObjects||[]){
    if(object.visualForcedFinished)continue;
    const age=(b.elapsed||0)-object.createdAt,times=clientEffectCreationTimes(object.data);
    object.effectAudioCopyCount??=0;
    while(object.effectAudioCopyCount<times.length&&age+1e-7>=times[object.effectAudioCopyCount]){
      emitClientEffectAudio(b,object.data.effectID_Loop);object.effectAudioCopyCount++;
    }
  }
}

