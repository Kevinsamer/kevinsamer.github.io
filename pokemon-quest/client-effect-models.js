// EffectLoop source creates three models and toggles their active Animators.
// In/Out complete only when a non-loop clip reaches normalizedTime >= 1.
export function selectClientEffectModel(runtime,age,{endRequestedAt=null}={}){
 if(!runtime)return null;
 if(runtime.actionType!==3)return {path:runtime.path,time:age,phase:'single',finished:Number.isFinite(runtime.startDuration)&&age>=runtime.startDuration};
 if(Number.isFinite(endRequestedAt)&&age>=endRequestedAt){const time=age-endRequestedAt;return {path:runtime.endPath,time,phase:'end',finished:Number.isFinite(runtime.endDuration)&&time>=runtime.endDuration};}
 if(age<(runtime.startDuration??Infinity))return {path:runtime.startPath,time:age,phase:'start',finished:false};
 return {path:runtime.loopPath,time:age-runtime.startDuration,phase:'loop',finished:false};
}
