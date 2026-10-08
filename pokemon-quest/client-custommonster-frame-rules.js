import {originalPokemonFrameCamera} from './client-pokemon-portrait-source.js';
export const SOURCE_CUSTOMMONSTER_LIGHTING={"source":"scenes_custommonster","ambientMode":3,"ambientColor":[1.0,1.0,1.0],"lightColor":{"r":1.0,"g":1.0,"b":1.0,"a":1.0},"intensity":0.10000000149011612,"rotation":[0.9659258127212524,0.0,0.0,0.2588191032409668],"lightParent":"0"};
/** Source CustomMonsterManager.SetupText; dedicated RenderTexture field0. */
export function originalCustomMonsterFramePlan(dex,{shiny=false}={}){
 return {dex,shiny,fieldIndex:0,formNo:0,addShadow:false,ringType:0,
  position:[0,0,0],rotation:[0,0,0,1],modelScale:1,
  camera:originalPokemonFrameCamera(dex),lightingProfile:{...SOURCE_CUSTOMMONSTER_LIGHTING},
  motion:'idle_motion',additiveMotion:'uniq_motion',materialMotion:null,appliesPotentialModelScalePercent:false,motionPolicy:'serialized default body Idle and additive Uniq; no explicit RequestMotion'};
}
// Different, independently found inspector scene model path. Caller linkage pending.
export const SOURCE_CUSTOMMONSTER_SCENE_MODEL={position:[0,-2.5,0],rotationEuler:[0,180,0],modelScale:2,moveRate:.5,callerEstablished:false};
