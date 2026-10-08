import {ORIGINAL_ACTOR_COLOR_HASH} from './client-actor-material.js';
import {createOriginalActorMaterial} from './native-actor-lighting.js';
import {decodeEffectAnimation} from './native-effect-animation.js';

export function unpackActorBuffer(value,Type=Float32Array){
 if(Array.isArray(value))return new Type(value.flat());
 const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new Type(bytes.buffer);
}
export function createOriginalActorGeometry(THREE,m){
 const geometry=new THREE.BufferGeometry(),binary=m.encoding==='base64';
 const read=(name,Type=Float32Array)=>binary?unpackActorBuffer(m[name],Type):new Type(m[name].flat());
 geometry.setAttribute('position',new THREE.BufferAttribute(read('positions'),3));
 if(m.normals?.length)geometry.setAttribute('normal',new THREE.BufferAttribute(read('normals'),3));else geometry.computeVertexNormals();
 if(m.uv?.length)geometry.setAttribute('uv',new THREE.BufferAttribute(read('uv'),2));
 if(m.colors?.length)geometry.setAttribute('color',new THREE.BufferAttribute(read('colors',Uint8Array),3,true));
 else geometry.setAttribute('color',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count*3).fill(1),3));
 if(m.boneIndices)geometry.setAttribute('skinIndex',new THREE.BufferAttribute(Uint16Array.from(read('boneIndices',Uint32Array)),4));
 if(m.boneWeights)geometry.setAttribute('skinWeight',new THREE.BufferAttribute(read('boneWeights'),4));
 const lists=m.submeshes.map(v=>binary?unpackActorBuffer(v,Uint32Array):Uint32Array.from(v)),indices=new Uint32Array(lists.reduce((n,v)=>n+v.length,0));let offset=0;
 lists.forEach((list,i)=>{geometry.addGroup(offset,list.length,i);indices.set(list,offset);offset+=list.length});geometry.setIndex(new THREE.BufferAttribute(indices,1));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.actorShared=true;return geometry;
}
/** Native bindposes already include the renderer bind transform. Identity bind
 * matrix and attached mode produce Unity's boneWorld * bindpose convention. */
export function createOriginalActor(THREE,data,{lighting,ambientProbe=null,ambientColor=null,reflectProbeZ=true,geometryCache=new Map(),materialCache=new Map()}={}){
 const root=new THREE.Group(),nodes={},skeletons=[],boneIDs=new Set(Object.values(data.nodes).flatMap(n=>n.skinned?.bones||[])),meshes={};
 for(const[id,m]of Object.entries(data.meshes)){
  if(!geometryCache.has(id))geometryCache.set(id,createOriginalActorGeometry(THREE,m));meshes[id]=geometryCache.get(id);
 }
 for(const[id,n]of Object.entries(data.nodes)){
  let object;
  if(n.mesh){const materials=n.materials.map(id=>{const key=id+':'+!!n.skinned+':'+reflectProbeZ+':'+JSON.stringify({lighting,ambientColor,ambientProbe});if(!materialCache.has(key)){const material=createOriginalActorMaterial(THREE,data.materials[id]||{},{lighting,ambientProbe,ambientColor,reflectProbeZ,skinned:!!n.skinned});material.userData.actorShared=true;materialCache.set(key,material);}return materialCache.get(key)});
   object=n.skinned?new THREE.SkinnedMesh(meshes[n.mesh],materials):new THREE.Mesh(meshes[n.mesh],materials);object.frustumCulled=false;
  }else object=boneIDs.has(id)?new THREE.Bone():new THREE.Group();
  object.name=n.name;object.position.fromArray(n.position);object.quaternion.fromArray(n.rotation);object.scale.fromArray(n.scale);object.visible=!!n.active;nodes[id]=object;
 }
 for(const[id,n]of Object.entries(data.nodes))(nodes[n.parent]||root).add(nodes[id]);root.updateMatrixWorld(true);
 for(const[id,n]of Object.entries(data.nodes))if(n.skinned){const bones=n.skinned.bones.map(key=>nodes[key]),inverse=data.meshes[n.mesh].bindposes.map(value=>new THREE.Matrix4().fromArray(value));const skeleton=new THREE.Skeleton(bones,inverse);nodes[id].bind(skeleton,new THREE.Matrix4());skeletons.push(skeleton);}
 root.updateMatrixWorld(true);
 const byHash=new Map();for(const[id,n]of Object.entries(data.nodes)){const list=byHash.get(n.animationPathHash)||[];list.push(nodes[id]);byHash.set(n.animationPathHash,list);}
 const rest=new Map(Object.values(nodes).map(n=>[n,{position:n.position.clone(),quaternion:n.quaternion.clone(),scale:n.scale.clone()}]));
 const reset=()=>{for(const[n,t]of rest){n.position.copy(t.position);n.quaternion.copy(t.quaternion);n.scale.copy(t.scale);}};
 const sample=(animation,time)=>{for(const channel of animation?.sample(time)||[])for(const node of byHash.get(channel.path)||[]){if(channel.values.some(v=>!Number.isFinite(v)))continue;if(channel.field==='rotation')node.quaternion.fromArray(channel.values).normalize();else node[channel.field].fromArray(channel.values);}root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();};
 // Source Uniq layer is additive. For all original species its first frame
 // equals Avatar.defaultPose; use that clip reference without adding rest twice.
 const sampleAdditive=(animation,time)=>{if(!animation)return;const reference=new Map(animation.sample(0).map(c=>[c.path+':'+c.field,c.values]));for(const channel of animation.sample(time))for(const node of byHash.get(channel.path)||[]){const base=reference.get(channel.path+':'+channel.field);if(!base||channel.values.some(v=>!Number.isFinite(v)))continue;if(channel.field==='rotation'){const delta=new THREE.Quaternion().fromArray(base).invert().multiply(new THREE.Quaternion().fromArray(channel.values));node.quaternion.multiply(delta).normalize();}else if(channel.field==='position')node.position.add(new THREE.Vector3().fromArray(channel.values).sub(new THREE.Vector3().fromArray(base)));else if(channel.field==='scale')node.scale.multiply(new THREE.Vector3(...channel.values.map((v,i)=>base[i]===0?1:v/base[i])));}root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();};
 const resetMaterial=()=>{for(const node of Object.values(nodes))delete node.userData.originalActorColor;};
 const sampleMaterial=(animation,time)=>{for(const binding of animation?.sampleBindings(time)||[]){const channel=(binding.attribute>>>28)-4;if(binding.typeID!==137||binding.customType!==22||(binding.attribute&0x0fffffff)!==ORIGINAL_ACTOR_COLOR_HASH||channel<0||channel>3||!Number.isFinite(binding.values[0]))continue;for(const node of byHash.get(binding.path)||[]){if(!node.isSkinnedMesh)continue;node.userData.originalActorColor??=[0,0,0,1];node.userData.originalActorColor[channel]=binding.values[0];}}};
 const capturePose=()=>new Map(Object.values(nodes).map(n=>[n,{position:n.position.clone(),quaternion:n.quaternion.clone(),scale:n.scale.clone()}]));
 const blendPose=(pose,alpha)=>{for(const[node,source]of pose){node.position.lerpVectors(source.position,node.position,alpha);node.quaternion.copy(source.quaternion.clone().slerp(node.quaternion,alpha));node.scale.lerpVectors(source.scale,node.scale,alpha);}root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();};
 return {root,nodes,skeletons,data,reset,sample,sampleAdditive,resetMaterial,sampleMaterial,capturePose,blendPose,decode:decodeEffectAnimation,dispose(){root.removeFromParent();for(const skeleton of skeletons)skeleton.dispose();}};
}




