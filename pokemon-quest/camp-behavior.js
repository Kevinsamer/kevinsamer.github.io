import {originalCampBodyRadius,resolveCampBodies} from './camp-body-collision.js';
import {CLIENT_CAMP_SOURCE as S} from './client-camp-source.js';
// Original free-move rectangles and 4..7 second interval. Destination selection,
// separation and tick scheduling adapt Unity NavMeshAgent to this Web renderer.
const hash=s=>[...String(s)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
export function createCampBehavior({random=Math.random}={}){
 const actors=new Map();let previous=null;const motion=['run_motion','idle_motion','Mmotion_bodyblow','Mmotion_poking','Mmotion_happy','Mmotion_rotateloop','Mmotion_trembling','Mmotion_talk','Mmotion_roar','Mmotion_rotate_change'];
 function target(a){const p=a.area;return [p.position[0]+(random()-.5)*(p.scale[0]-2),p.position[2]+(random()-.5)*(p.scale[2]-2)];}
 return {react(uid,time){const a=actors.get(uid);if(a)a.reactUntil=time+2.2;},update(game,time,species,stats,obstacles=[]){const dt=previous===null?0:Math.max(0,Math.min(.05,time-previous));previous=time;
  const ordered=[...game.team.map(id=>game.monsters.find(m=>m.uid===id)).filter(Boolean),...game.monsters.filter(m=>!game.team.includes(m.uid))].slice(0,15),live=new Set(ordered.map(m=>m.uid));for(const id of actors.keys())if(!live.has(id))actors.delete(id);
  const units=ordered.map(m=>{let a=actors.get(m.uid);if(!a){const area=S.freeMovePoints[hash(m.uid)%S.freeMovePoints.length];a={area,position:[area.position[0]+(random()-.5)*(area.scale[0]-2),area.position[2]+(random()-.5)*(area.scale[2]-2)],until:time+random()*4,facing:0,phase:0};a.goal=target(a);actors.set(m.uid,a);}
   const reacting=a.reactUntil>time;let key='idle_motion';
   if(!reacting&&time>=a.until){if(!a.walking){a.goal=target(a);a.walking=true;}const dx=a.goal[0]-a.position[0],dz=a.goal[1]-a.position[1],d=Math.hypot(dx,dz);if(d>.1){const step=Math.min(d,dt*2.5);a.position[0]+=dx/d*step;a.position[1]+=dz/d*step;a.facing=Math.atan2(dx,dz);key='run_motion';}else{a.walking=false;a.until=time+4+random()*3;a.phase++;}}
   if(reacting)key='Mmotion_happy';else if(!a.walking&&a.phase%3===1)key='Mmotion_roar';
   const position=[a.position[0],0,a.position[1]];return{uid:m.uid,dex:species.find(s=>s.id===m.speciesId)?.dex,hp:1,shiny:m.shiny,modelScale:1+(stats?.(game,m)?.modelScalePercent??0),position,x:position[0],y:position[2],bodyRadius:originalCampBodyRadius(species.find(s=>s.id===m.speciesId)?.dex,1+(stats?.(game,m)?.modelScalePercent??0)),facing:a.facing,animationKey:key,campState:reacting?'reacting':a.walking?'walking':'waiting'};
  });
  // Source personality/group tables choose compatible social gestures. Web
  // scheduling is staggered; source coroutine timing is not fully recovered.
  for(let i=0;i+1<units.length;i+=3){const pair=units.slice(i,i+3),types=pair.map(u=>S.personality.find(p=>p.m_seikaku===ordered.find(m=>m.uid===u.uid)?.nature)?.m_groupType??1),row=S.groups.find(r=>r.m_groupType.every((t,j)=>t===(types[j]||0))&&!r.m_isLayer.some(Boolean));if(!row)continue;
   if(pair.every(u=>u.campState==='waiting')){const center=pair.reduce((v,u)=>[v[0]+u.x/pair.length,v[1]+u.y/pair.length],[0,0]);for(let j=0;j<pair.length;j++){const u=pair[j],a=actors.get(u.uid);if(Math.hypot(u.x-center[0],u.y-center[1])<7&&time%12>row.m_delay[j]){u.animationKey=motion[row.m_groupMotionType[j]]||'idle_motion';u.facing=a.facing=Math.atan2(center[0]-u.x,center[1]-u.y);u.campState='social';}}}
  }
  resolveCampBodies(units,{areas:new Map(units.map(u=>[u.uid,actors.get(u.uid).area])),obstacles});
  for(const u of units){const a=actors.get(u.uid);a.position=[u.x,u.y];}

  return units;
 }};
}
