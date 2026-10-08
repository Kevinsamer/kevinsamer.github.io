import {CLIENT_ACTOR_SHADOW_MESH as SHADOW} from './client-actor-shadow-mesh.js';
import {CLIENT_ACTOR_SHADOW_DATA as DATA} from './client-actor-shadow-data.js';
export function originalActorShadowParameters(dex){const v=DATA.volumes[dex];if(!v)throw new RangeError('Unknown original shadow volume');return{position:['x','y','z'].map(k=>v.m_shadowCenter[k]),scale:['x','y','z'].map(k=>v.m_shadowScale[k]),opacity:SHADOW.materialColors._Color.a};}
/** Original polygon/volume transform. Black transparent basic shading preserves
 * the zero RGB/emission source material; native shader name was stripped.
 * No guessed texture, ellipse, scale or elevation offset is introduced. */
const shared=new WeakMap();
export function createOriginalActorShadow(THREE,data,dex){
 if(dex===undefined){dex=data;data=null;}const p=originalActorShadowParameters(dex),source=data?.mesh||SHADOW.mesh;let resources=shared.get(THREE);if(!resources){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(source.positions.flat(),3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(source.normals.flat(),3));geometry.setIndex(source.submeshes.flat());geometry.userData.actorShared=true;const material=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:p.opacity,depthWrite:false,premultipliedAlpha:true});material.userData.actorShared=true;resources={geometry,material};shared.set(THREE,resources);}const mesh=new THREE.Mesh(resources.geometry,resources.material);mesh.name='shadow_monster';mesh.position.fromArray(p.position);mesh.scale.fromArray(p.scale);mesh.userData.originalActorShadow=true;
 return {mesh,root:mesh,dispose(){mesh.removeFromParent();}};
}
