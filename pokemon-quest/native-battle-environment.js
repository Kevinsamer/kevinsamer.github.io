import {CLIENT_BATTLE_ENVIRONMENT as SOURCE} from './client-battle-environment.js';
// Source SimpleBase FORWARDBASE equation: max(dot(worldNormal, lightDir),0)
// * (vertexRGB + _Color.rgb) * _LightColor0.rgb. No ambient, texture or fog term.
export function originalBattleLighting({intensity=SOURCE.light.m_Intensity,rotation=SOURCE.lightRotation,color=SOURCE.light.m_Color}={}){
 const [x,y,z,w]=rotation;
 // Unity directional light points along local +Z; shader light vector is -Z.
 const direction=[-2*(x*z+w*y),-2*(y*z-w*x),-(1-2*(x*x+y*y))];
 const norm=Math.hypot(...direction);direction[2]*=-1; // Unity Z reflection used by native-scene.
 return {direction:direction.map(v=>v/norm),color:['r','g','b'].map(k=>color[k]*intensity),intensity,runtimeVerified:SOURCE.runtimeLightingVerified};
}
export function evaluateSimpleBase(vertexColor,tint,worldNormal,lighting=originalBattleLighting()){
 const n=Math.hypot(...worldNormal)||1,d=Math.max(0,worldNormal.reduce((sum,v,i)=>sum+v/n*lighting.direction[i],0));
 return vertexColor.map((v,i)=>(v+tint[i])*lighting.color[i]*d);
}
/** Pass THREE and an explicit lighting choice from the caller. Serialized light
 * intensity is available, but original runtime override has not been proven. */
export function createOriginalSimpleBaseMaterial(THREE,source,lighting,{skinned=false}={}){
 if(!lighting)throw new Error('Choose serialized or runtime-verified lighting explicitly');
 const c=source.colors?._Color||{r:0,g:0,b:0};
 const material=new THREE.ShaderMaterial({vertexColors:true,uniforms:{tint:{value:new THREE.Vector3(c.r,c.g,c.b)},lightDir:{value:new THREE.Vector3(...lighting.direction)},lightColor:{value:new THREE.Vector3(...lighting.color)},worldNormalMatrix:{value:new THREE.Matrix3()}},vertexShader:skinned?SIMPLE_BASE_SKINNED_VERTEX:SIMPLE_BASE_VERTEX,fragmentShader:'uniform vec3 tint;uniform vec3 lightDir;uniform vec3 lightColor;varying vec3 vColor;varying vec3 vNormal;void main(){float d=max(dot(normalize(vNormal),lightDir),0.);gl_FragColor=vec4((vColor+tint)*lightColor*d,1.);}'});
 material.onBeforeRender=(_renderer,_scene,_camera,_geometry,object)=>{material.uniforms.worldNormalMatrix.value.getNormalMatrix(object.matrixWorld);material.uniformsNeedUpdate=true;};
 return material;
}
/** The old sampler used local face normal and highest surface, so tilted faces
 * and terrain decorations could become floor. This transforms face normals to
 * world space and chooses the eligible surface nearest the source marker Y.
 * Ground role/native physics still needs original collider evidence. */
export function chooseOriginalGroundHit(THREE,hits,sourceElevation,{acceptObject=()=>true,minUp=.4}={}){
 const eligible=hits.filter(h=>{if(!h.face||!acceptObject(h.object))return false;const normal=h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();return normal.y>minUp;});
 return eligible.sort((a,b)=>Math.abs(a.point.y-sourceElevation)-Math.abs(b.point.y-sourceElevation)||a.distance-b.distance)[0]||null;
}

export const SIMPLE_BASE_VERTEX='uniform mat3 worldNormalMatrix; varying vec3 vColor; varying vec3 vNormal; void main(){vColor=color;vNormal=normalize(worldNormalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}' ;
export const SIMPLE_BASE_SKINNED_VERTEX=`
#include <common>
#include <skinning_pars_vertex>
uniform mat3 worldNormalMatrix;
varying vec3 vColor;
varying vec3 vNormal;
void main(){
 #include <beginnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <begin_vertex>
 #include <skinning_vertex>
 vColor=color;
 vNormal=normalize(worldNormalMatrix*objectNormal);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);
}`;
