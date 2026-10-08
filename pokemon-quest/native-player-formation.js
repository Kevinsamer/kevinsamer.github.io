import {CLIENT_PLAYER_FORMATIONS} from './client-player-formation.js';
import {CLIENT_ACTOR_SHADOW_DATA} from './client-actor-shadow-data.js';

// FormationData.Initialize matches each team index to the first unused slot
// with its range type. Positions are in Unity world units (not pixels).
export function originalPlayerFormationOffsets(rangeTypes) {
  if (!Array.isArray(rangeTypes) || rangeTypes.some(v=>v!==0&&v!==1)) return null;
  const row=CLIENT_PLAYER_FORMATIONS.find(r=>r.m_memberNum===rangeTypes.length &&
    [0,1].every(t=>r.m_rangeTypes.filter(v=>v===t).length===rangeTypes.filter(v=>v===t).length));
  if (!row) return null;
  const used=new Set();
  return rangeTypes.map(type=>{
    const slot=row.m_rangeTypes.findIndex((t,i)=>t===type&&!used.has(i));
    used.add(slot);
    return {...row.m_relativePositions[slot]};
  });
}

// CalculateFormationPosition: origin + TransformDirection(right)*X
// + TransformDirection(forward)*Z. Caller supplies the original manager basis;
// the start-marker rotation is not yet proven to be that basis.
export function originalPlayerFormationPositions(rangeTypes,origin,right,forward) {
  const offsets=originalPlayerFormationOffsets(rangeTypes);
  if (!offsets) return null;
  return offsets.map(p=>({
    x:origin.x+right.x*p.x+forward.x*p.z,
    y:origin.y+right.y*p.x+forward.y*p.z,
    z:origin.z+right.z*p.x+forward.z*p.z,
  }));
}

export function originalActorVolume(dex,{modelScale=1}={}) {
  if (!Number.isInteger(dex)||dex<1||dex>151) return null;
  const v=CLIENT_ACTOR_SHADOW_DATA.volumes[dex];
  return {
    colliderCenter:{...v.m_colliderCenter}, colliderRadius:v.m_colliderRadius,
    // AddNavMesh applies modelScale to height, explicitly NOT radius.
    navMeshAgentRadius:v.m_navMeshAgentRadius,
    navMeshAgentHeight:v.m_navMeshAgentHeight*modelScale,
  };
}

// FormationManager.Ready calls LookAt(path.corners[1], Vector3.up).
// Supply ORIGINAL WORLD coordinates; no Unity/Three Z reflection here.
export function originalFormationNavigationBasis(origin,corners) {
  if (!Array.isArray(corners)||corners.length<2) return null;
  const target=corners[1];
  const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z;
  const length=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz);
  if (!length||!flat) return null;
  return {right:{x:dz/flat,y:0,z:-dx/flat},
    forward:{x:dx/length,y:dy/length,z:dz/length}};
}
