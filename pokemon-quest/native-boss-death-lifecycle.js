/** Source BattleManager.<BossDeadEffect>d__ MoveNext @0xa54294.
 * Clock is unscaled. Completion predicates must be supplied by actor/effect runtime.
 * No species-dependent motion override; no implicit destruction of actor.
 */
export const SOURCE_BOSS_DEATH = Object.freeze({motion:14, animatorUpdateMode:2,
 cameraTargetDuration:.10000000149011612,voiceDelay:.30000001192092896,
 fovMultiplier:.800000011920929,fovDuration:1,fovEase:2,
 restoreFovDuration:.20000000298023224,restoreFovEase:18,
 postFinishDelay:.5,soundEventID:0xcdd9969e,effects:[248,249]});

export function createOriginalBossDeathLifecycle(hooks={}) {
 let phase='ready', remaining=0, first=null,second=null, originalFov;
 const emit=(name,...args)=>hooks[name]?.(...args);
 const createEffect=id=>emit('createEffect',{effectID:id,
   position:[...(hooks.position?.()??[0,0,0])],
   rotation:[...(hooks.rotation?.()??[0,0,0,1])],
   parent:null,animatorUpdateMode:2,ignoreTimeScale:true,
   // Create receives -1 in its final float argument; this is not actor scale.
   sourceFloatArgument:-1});
 return {
  get phase(){return phase;},get finished(){return phase==='finished';},
  get freezesBattle(){return !['ready','finished'].includes(phase);},
  tick(unscaledDelta){
   if(!Number.isFinite(unscaledDelta)||unscaledDelta<0)throw new RangeError('unscaledDelta');
   if(phase==='finished')return;
   if(phase==='ready'){
    if(hooks.ready?.()===false)return;
    emit('deleteSkillObjects');emit('stopTimeScale');emit('cancelCameraAnimations');
    emit('setCameraDeathMode',true);
    emit('targetCamera',SOURCE_BOSS_DEATH.cameraTargetDuration);
    emit('clearCameraPositionOffset',SOURCE_BOSS_DEATH.cameraTargetDuration);
    phase='cameraWait';remaining=SOURCE_BOSS_DEATH.cameraTargetDuration;return;
   }
   if(['cameraWait','voiceWait','tailWait'].includes(phase)){
    remaining-=unscaledDelta;if(remaining>1e-8)return;
    if(phase==='cameraWait'){
     emit('playVoice',4);phase='voiceWait';remaining=SOURCE_BOSS_DEATH.voiceDelay;return;
    }
    if(phase==='tailWait'){
     emit('deleteEffect',first);emit('deleteEffect',second);
     emit('setCameraDeathMode',false);emit('resumeTimeScale');phase='finished';return;
    }
    emit('setActorAnimatorUpdateMode',2);emit('requestMotion',14);
    emit('requestShadowDeath',true);emit('setGaugeMode',2);emit('changeGaugeAnimation',3);
    emit('playSound',SOURCE_BOSS_DEATH.soundEventID);
    first=createEffect(248);originalFov=hooks.cameraFov?.();
    if(Number.isFinite(originalFov))emit('changeFov',originalFov*SOURCE_BOSS_DEATH.fovMultiplier,1,2);
    phase='firstEffect';return;
   }
   if(phase==='firstEffect'){
    if(!hooks.effectFinished?.(first))return;
    second=createEffect(249);
    if(Number.isFinite(originalFov))emit('changeFov',originalFov,SOURCE_BOSS_DEATH.restoreFovDuration,18);
    phase='secondEffect';return;
   }
   if(phase==='secondEffect' && hooks.effectFinished?.(second) && hooks.motionFinished?.(14)){
    phase='tailWait';remaining=.5;
   }
  }
 };
}
