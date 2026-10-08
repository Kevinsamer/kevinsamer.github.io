// Original Custom/Gf/SimpleBase GLES3 DIRECTIONAL LIGHTPROBE_SH branch.
// Coefficients are explicit inputs; this module supplies no guessed ambient light.
export function packUnitySphericalHarmonics(coefficients){
 if(!coefficients||coefficients.length!==27)throw new Error('Expected 27 Unity SH coefficients');
 const A=[],B=[],C=[];
 for(let channel=0;channel<3;channel++){
  const s=coefficients.slice(channel*9,channel*9+9);
  A.push([s[3],s[1],s[2],s[0]-s[6]]);
  B.push([s[4],s[5],3*s[6],s[7]]);
  C.push(s[8]);
 }
 return {A,B,C};
}
export function evaluateOriginalActorSH(worldNormal,probe,{reflectZ=true}={}){
 const packed=Array.isArray(probe)?packUnitySphericalHarmonics(probe):probe;
 const length=Math.hypot(...worldNormal)||1;
 const [x,y,z0]=worldNormal.map(v=>v/length),z=reflectZ?-z0:z0;
 return packed.A.map((a,c)=>{
  const b=packed.B[c];
  const linear=Math.max(0,a[0]*x+a[1]*y+a[2]*z+a[3]+b[0]*x*y+b[1]*y*z+b[2]*z*z+b[3]*z*x+packed.C[c]*(x*x-y*y));
  return Math.max(0,1.05499995*Math.pow(linear,.416666657)-.0549999997);
 });
}
export function evaluateOriginalActorLighting(vertexRGB,tint,worldNormal,lighting,probe,options){
 const length=Math.hypot(...worldNormal)||1;
 const d=Math.max(0,worldNormal.reduce((sum,v,i)=>sum+v/length*lighting.direction[i],0));
 const ambient=probe?evaluateOriginalActorSH(worldNormal,probe,options):[0,0,0];
 return vertexRGB.map((v,i)=>(v+tint[i])*(d*lighting.color[i]+ambient[i]));
}
export function createOriginalActorMaterial(THREE,source,{lighting,ambientProbe=null,ambientColor=null,skinned=false,reflectProbeZ=true}={}){
 if(!lighting)throw new Error('Choose explicit actor directional lighting');
 const tint=source.colors?._Color||{r:0,g:0,b:0};
 const uniforms={tint:{value:new THREE.Vector3(tint.r,tint.g,tint.b)},lightDir:{value:new THREE.Vector3(...lighting.direction)},lightColor:{value:new THREE.Vector3(...lighting.color)},worldNormalMatrix:{value:new THREE.Matrix3()}};
 if(ambientProbe){
  const p=Array.isArray(ambientProbe)?packUnitySphericalHarmonics(ambientProbe):ambientProbe;
  for(let c=0;c<3;c++){uniforms['shA'+c]={value:new THREE.Vector4(...p.A[c])};uniforms['shB'+c]={value:new THREE.Vector4(...p.B[c])};}
  uniforms.shC={value:new THREE.Vector3(...p.C)};
 }
 if(ambientColor)uniforms.flatAmbient={value:new THREE.Vector3(...ambientColor)};
 const defines={...(ambientColor?{ORIGINAL_FLAT_AMBIENT:1}:{}),...(ambientProbe?{ORIGINAL_LIGHTPROBE_SH:1}:{}),...(reflectProbeZ?{ORIGINAL_PROBE_REFLECT_Z:1}:{})};
 const material=new THREE.ShaderMaterial({vertexColors:true,defines,uniforms,vertexShader:actorVertex(skinned),fragmentShader:ACTOR_FRAGMENT});
 material.onBeforeRender=(_renderer,_scene,_camera,_geometry,object)=>{uniforms.worldNormalMatrix.value.getNormalMatrix(object.matrixWorld);const animatedTint=object.userData?.originalActorColor;uniforms.tint.value.set(...(animatedTint?animatedTint.slice(0,3):[tint.r,tint.g,tint.b]));material.uniformsNeedUpdate=true;};
 material.userData.originalShader='Custom/Gf/SimpleBase';
 material.userData.originalVariant=ambientColor?'DIRECTIONAL LIGHTPROBE_SH (Flat constant)':ambientProbe?'DIRECTIONAL LIGHTPROBE_SH':'DIRECTIONAL';
 return material;
}
function actorVertex(skinned){return `${skinned?'#include <common>\n#include <skinning_pars_vertex>':''}
uniform mat3 worldNormalMatrix;
varying vec3 vColor;
varying vec3 vNormal;
#ifdef ORIGINAL_LIGHTPROBE_SH
uniform vec4 shA0;uniform vec4 shA1;uniform vec4 shA2;
uniform vec4 shB0;uniform vec4 shB1;uniform vec4 shB2;uniform vec3 shC;
varying vec3 vAmbient;
#endif
void main(){
${skinned?'#include <beginnormal_vertex>\n#include <skinbase_vertex>\n#include <skinnormal_vertex>\n#include <begin_vertex>\n#include <skinning_vertex>':'vec3 objectNormal=normal;vec3 transformed=position;'}
vColor=color;vNormal=normalize(worldNormalMatrix*objectNormal);
#ifdef ORIGINAL_LIGHTPROBE_SH
 vec3 n=vNormal;
 #ifdef ORIGINAL_PROBE_REFLECT_Z
 n.z=-n.z;
 #endif
 vec4 n4=vec4(n,1.);vec4 quadratic=n.yzzx*n.xyzz;
 vec3 sh=vec3(dot(shA0,n4),dot(shA1,n4),dot(shA2,n4))+vec3(dot(shB0,quadratic),dot(shB1,quadratic),dot(shB2,quadratic))+shC*(n.x*n.x-n.y*n.y);
 sh=max(sh,vec3(0.));
 vAmbient=max(pow(sh,vec3(.416666657))*1.05499995-.0549999997,vec3(0.));
#endif
gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);
}`;}
const ACTOR_FRAGMENT=`uniform vec3 tint;uniform vec3 lightDir;uniform vec3 lightColor;
varying vec3 vColor;varying vec3 vNormal;
#ifdef ORIGINAL_FLAT_AMBIENT
uniform vec3 flatAmbient;
#endif
#ifdef ORIGINAL_LIGHTPROBE_SH
varying vec3 vAmbient;
#endif
void main(){vec3 illumination=lightColor*max(dot(normalize(vNormal),lightDir),0.);
#ifdef ORIGINAL_LIGHTPROBE_SH
illumination+=vAmbient;
#endif
#ifdef ORIGINAL_FLAT_AMBIENT
illumination+=flatAmbient;
#endif
gl_FragColor=vec4((vColor+tint)*illumination,1.);}`;
