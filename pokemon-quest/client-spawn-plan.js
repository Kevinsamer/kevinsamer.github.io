/** Recovered static ARM rules; see reverse/metadata/spawn-plan-evidence.md. */
export const NG_MAP_CHIPS=Object.freeze([
 Object.freeze([2,5,6,7,8]),Object.freeze([6,7,8]),Object.freeze([0,3,6,7,8]),
 Object.freeze([2,5,8]),Object.freeze([]),Object.freeze([0,3,6]),
 Object.freeze([0,1,2,5,8]),Object.freeze([0,1,2]),Object.freeze([0,1,2,3,6]),
]);
const ALL=Object.freeze([0,1,2,3,4,5,6,7,8]);
function randomIndex(n,random){if(n<1)throw new RangeError('Original map-chip candidate list is empty');return Math.floor(random()*n);}
export function nextEnemyChipCandidates(bossIndex,previousIndex,indices=ALL){
 const ng=NG_MAP_CHIPS[previousIndex];if(!ng)throw new RangeError('Invalid original map-chip index');
 return indices.filter(i=>i!==bossIndex&&i!==previousIndex&&!ng.includes(i));
}
export function playerChipCandidates(firstEnemyIndex,indices=ALL){
 const ng=NG_MAP_CHIPS[firstEnemyIndex];if(!ng)throw new RangeError('Invalid original map-chip index');
 return indices.filter(i=>i!==firstEnemyIndex&&!ng.includes(i));
}
function lotteryEnemyChip(boss,previous,random){
 // Native orders candidates by Random.Range(int.MinValue,int.MaxValue),
 // then takes First. Preserve per-candidate random calls and stable ties.
 const candidates=nextEnemyChipCandidates(boss,previous);
 if(!candidates.length)throw new RangeError('Original map-chip candidate list is empty');
 return candidates.map((index,order)=>({index,order,key:Math.floor(random()*4294967295)-2147483648})).sort((a,b)=>a.key-b.key||a.order-b.order)[0].index;
}
function marker(tile,spawnMode,pointType){
 if(spawnMode<0||spawnMode>=4)throw new RangeError('Original spawn mode index is out of range');
 const group=tile?.groups?.[spawnMode]??tile?.groups?.[0];
 if(!group)throw new RangeError('Original spawn group is missing');
 if(pointType<0||pointType>=group.points.length)throw new RangeError('Original spawn point index is out of range');
 return group.points[pointType]??group.points[0];
}
export function createStageWorldPlan(map,registDatas,tiles,{random=Math.random}={}){
 if(!registDatas?.length)throw new RangeError('Original enemy pack is empty');
 const bossIndex=map.bossIndex>-1?map.bossIndex:randomIndex(9,random);
 const rows=new Array(registDatas.length);let current=bossIndex,keepCurrent=true;
 for(let i=registDatas.length-1;i>=0;i--){
  const r=registDatas[i];if(!keepCurrent)current=lotteryEnemyChip(bossIndex,current,random);
  const point=marker(tiles[current],r.m_spawnMode,r.m_setType);
  rows[i]={registIndex:i,mapChipIndex:current,spawnMode:r.m_spawnMode,pointType:r.m_setType,enemySetIndex:r.m_setIndex,position:point.position.slice(),radius:point.radius,point};
  keepCurrent=r.m_setType!==0;
 }
 const first=rows[0],candidates=playerChipCandidates(first.mapChipIndex);
 const playerIndex=map.playerIndex>-1?map.playerIndex:candidates[randomIndex(candidates.length,random)];
 // Source player position uses first lottery result's spawnMode/pointType.
 const p=marker(tiles[playerIndex],first.spawnMode,first.pointType);
 return {bossIndex,playerIndex,player:{position:p.position.slice(),radius:p.radius,spawnMode:first.spawnMode,pointType:first.pointType,point:p},rows};
}
