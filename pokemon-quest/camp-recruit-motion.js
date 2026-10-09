import {misc} from './client-rules.js';
import {CLIENT_CAMP_SOURCE} from './client-camp-source.js';
import {CLIENT_ACTOR_ANIMATION} from './client-actor-animation.js';
// APK BaseCampCharacter and BaseCampFieldManager serialized values.
export const RECRUIT_MOTION=Object.freeze({start:[-12.5,2.5,59],goal:[-12.5,2.5,13],speed:8.170000076293945*10,acceleration:14.800000190734863,goalRange:5,focusOffset:[-4,-1,0],distance:30,zoomDuration:.30000001192092896,lookDuration:1,visitInterval:.30000001192092896});
export function recruitMotionSample(age){const c=RECRUIT_MOTION,t=Math.max(0,age),ramp=c.speed/c.acceleration,d=t<ramp?.5*c.acceleration*t*t:.5*c.acceleration*ramp*ramp+c.speed*(t-ramp),travel=Math.min(41,d);return {position:[c.start[0],c.start[1],c.start[2]-travel],arrived:d>=41-1e-12};}
export const recruitArrivalDuration=Math.sqrt(82/RECRUIT_MOTION.acceleration);
export function recruitCameraEase(age){const t=Math.min(1,Math.max(0,age/RECRUIT_MOTION.zoomDuration));return 1-(1-t)*(1-t);}

// Source models face local +Z; camp root reflects Unity Z into Web world Z.
export function recruitFacingCamera(position,camera){return Math.atan2(camera[0]-position[0],-camera[2]-position[2]);}

export function recruitLookAngle(target,age){const t=Math.min(1,Math.max(0,age/RECRUIT_MOTION.lookDuration)),delta=Math.atan2(Math.sin(target-Math.PI),Math.cos(target-Math.PI));return Math.PI+delta*(1-(1-t)*(1-t));}

export function recruitGroupDuration(count){return recruitArrivalDuration+Math.max(0,count-1)*RECRUIT_MOTION.visitInterval;}
export function recruitGroupSample(count,age){return Array.from({length:count},(_,i)=>({index:i,started:age>=i*RECRUIT_MOTION.visitInterval,...recruitMotionSample(age-i*RECRUIT_MOTION.visitInterval)}));}

export function recruitWelcomeMotion(monster){const group=CLIENT_CAMP_SOURCE.personality.find(p=>p.m_seikaku===monster.nature)?.m_groupType??0,id=group===1?18:group===2?23:22,clip=CLIENT_ACTOR_ANIMATION[id].clip;return {id,key:clip.name,duration:clip.duration,settle:.3};}

export function recruitCampPosition(station,index){const point=misc.m_visitPokemonPosition.m_cooking.cookingGroups[station]?.points[index%3];return point?[point.position.x,point.position.y,point.position.z]:[-6,0,13];}
