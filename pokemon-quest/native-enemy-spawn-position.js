// EnemySpawnObject.Update_Spawning, original Unity world coordinates.
export const ORIGINAL_ENEMY_SPAWN_RAY={heightOffset:100,maxDistance:1000,layerMask:0x8000,direction:{x:0,y:-1,z:0}};
export function originalEnemySpawnCandidate(anchor,{isFixPosition=false,spawnRadius=0}={},sampleUnitCircle) {
 if (isFixPosition) return {...anchor};
 if (typeof sampleUnitCircle!=='function') throw new TypeError('A Unity unit-circle sample provider is required');
 const p=sampleUnitCircle();
 return {x:anchor.x+p.x*spawnRadius,y:anchor.y,z:anchor.z+p.y*spawnRadius};
}
// One attempt only. Ray miss leaves pending spawn count intact; the caller
// waits a fresh spawnInterval before invoking this again, consuming a new sample.
export function attemptOriginalEnemySpawnPosition(anchor,options,{sampleUnitCircle,raycast}) {
 const candidate=originalEnemySpawnCandidate(anchor,options,sampleUnitCircle);
 const origin={...candidate,y:candidate.y+ORIGINAL_ENEMY_SPAWN_RAY.heightOffset};
 const hit=raycast(origin,ORIGINAL_ENEMY_SPAWN_RAY.direction,
  ORIGINAL_ENEMY_SPAWN_RAY.maxDistance,ORIGINAL_ENEMY_SPAWN_RAY.layerMask);
 return hit ? {...(hit.point??hit)} : null;
}
// Explicit Web fallback: uniform-area disk, two JS RNG draws. Unity native RNG
// implementation/consumption is not recovered, so this is not seed-equivalent.
export function approximateUnitDiskSample(random=Math.random) {
 const theta=random()*Math.PI*2,radius=Math.sqrt(random());
 return {x:Math.cos(theta)*radius,y:Math.sin(theta)*radius};
}

// Serialized scenes_normal_00 GO11 layer15 / BoxCollider562 / Transform544.
export const ORIGINAL_STAGE_SPAWN_COLLIDER={center:{x:0,y:0,z:0},size:{x:300,y:1,z:300},layer:15};
export function originalStageSpawnRaycast(origin,direction,maxDistance,layerMask) {
 if (!(layerMask&(1<<15))||direction.x!==0||direction.z!==0||direction.y>=0) return null;
 const top=.5,t=(top-origin.y)/direction.y;
 if(t<0||t>maxDistance||Math.abs(origin.x)>150||Math.abs(origin.z)>150) return null;
 return {point:{x:origin.x,y:top,z:origin.z}};
}
export function createOriginalSpawnTimer() {return {state:'wait',timeCount:10,intervalCount:0};}
// Clear preloads timeCount=spawnTime10. One update switches state without
// spawning. Later updates reset interval before attempting, including misses.
export function tickOriginalSpawnTimer(timer,dt) {
 if(timer.state==='wait') {timer.timeCount+=dt;if(timer.timeCount>=10){timer.timeCount=0;timer.state='spawning';}return false;}
 timer.intervalCount+=dt;
 if(timer.intervalCount<.10000000149011612) return false;
 timer.intervalCount=0;return true;
}
