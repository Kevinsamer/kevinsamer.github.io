import {originalPlayerFormationOffsets} from './native-player-formation.js';
// scenes_customteam CustomTeamManager/Transform194 + SetupRenderModel ARM.
export const CLIENT_CUSTOM_TEAM_MODELS={center:{x:0,y:0,z:0},centerRotation:[0,0,0,1],
 rotateObjPosition:{x:0,y:27,z:27},rotateSpeedDegrees:20,modelRotation:[0,0,0,1]};
export function originalCustomTeamModelPlan(members) {
 const offsets=originalPlayerFormationOffsets(members.map(v=>v.rangeType));
 if(!offsets)return null;
 return members.map((member,index)=>({index,position:{...offsets[index]},
  rotation:[0,0,0,1],scale:1+(member.modelScalePercent??0)}));
}
// Source RotateAround about teamCenterPoint, followed by Camera.LookAt(center).
// Default axis is the serialized manager's identity TransformDirection(up).
// This returns camera position/lookAt only; source factory FOV must be supplied.
export function originalCustomTeamCameraOrbit(seconds,center=CLIENT_CUSTOM_TEAM_MODELS.center) {
 const theta=seconds*CLIENT_CUSTOM_TEAM_MODELS.rotateSpeedDegrees*Math.PI/180,p=CLIENT_CUSTOM_TEAM_MODELS.rotateObjPosition;
 return {position:{x:center.x+p.z*Math.sin(theta),y:center.y+p.y,z:center.z+p.z*Math.cos(theta)},lookAt:{...center}};
}

// PotentialParameter default is zero; ParameterCommand_ModelScalePercent has
// commandID30 and adds its float GetValue to PotentialParameter+0x84.
// This is an optional potential command result, not PokemonVolume/model size.
export const CLIENT_CUSTOM_TEAM_SCALE_SOURCE={commandID:30,defaultPercent:0,
 sourceRange:{min:-.5,max:.5},resultField:'normal.modelScalePercent'};
