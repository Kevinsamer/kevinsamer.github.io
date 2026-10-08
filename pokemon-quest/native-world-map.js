// Original MapData geometry conventions. Unity X/Z stays separate from the
// existing simulation coordinates; this conversion does not change units.
export const WORLD_SCALE=.035;
export const ROTATION_ANGLES=[0,Math.PI,Math.PI/2,-Math.PI/2];
export function worldToSimulation(position,scale=WORLD_SCALE){return{x:position[0]/scale+500,y:position[2]/scale+330,worldY:position[1]};}
export function simulationToWorld(x,y,elevation=0,scale=WORLD_SCALE){return[(x-500)*scale,elevation,(y-330)*scale];}
export function transformTilePoint(position,tile){const a=ROTATION_ANGLES[tile.rotation],c=Math.cos(a),s=Math.sin(a);return[position[0]*c+position[2]*s+tile.position[0],position[1]+tile.position[1],-position[0]*s+position[2]*c+tile.position[2]];}
export function createMapTiles(map,library,spawns,random=Math.random){
 const names=library.candidateNames||Object.keys(library.chips);
 return map.chips.map((choice,index)=>{
  const name=choice.chip||names[Math.floor(random()*names.length)],rotation=choice.rotation===4?Math.floor(random()*4):choice.rotation;
  const tile={index,name,rotation,position:[(index%3-1)*50,0,(1-Math.floor(index/3))*50]};
  const source=spawns?.chips[name];tile.groups=(source?.groups||[]).map(group=>({...group,points:group.points.map(point=>({...point,position:transformTilePoint(point.position,tile)}))}));
  tile.collision=source?.collision||[];return tile;
 });
}
export function spawnPoint(tile,mode,index){const group=tile.groups[mode]||tile.groups[0];return group?.points[index]||group?.points[0]||null;}
