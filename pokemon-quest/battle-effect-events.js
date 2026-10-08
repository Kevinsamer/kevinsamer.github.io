import {clientStartEffectEvent,clientImpactEffectEvent} from './client-effect-lifecycle.js';
import {emitClientEffectAudio} from './client-effect-audio.js';
function enqueue(b,event,point){if(!event)return null;const record={...event,createdAt:b.elapsed||0,...point};(b.effectEvents??=[]).push(record);emitClientEffectAudio(b,event.effectID);return record;}
export function emitClientObjectStart(b,object,owner){
 // Detached Start creation is verified on SkillObjectOnetime.Initialize.
 if(object.command.name!=='CreateSkillObjectOnetime')return null;
 return enqueue(b,clientStartEffectEvent(object.data),{x:object.x,y:object.y,angle:object.angle,worldY:(owner.worldY||0)+(object.data.createOffsetY||0)});
}
export function emitClientObjectImpact(b,object,target){
 return enqueue(b,clientImpactEffectEvent(object.data),{x:target.x,y:target.y,angle:object.angle,worldY:target.worldY||0});
}
