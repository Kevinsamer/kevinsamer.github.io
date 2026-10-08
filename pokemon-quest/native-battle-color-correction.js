import {CLIENT_BATTLE_COLOR_CORRECTION as SOURCE} from './client-battle-color-correction.js';
export function evaluateOriginalBattleColorCurve(channel,x){const keys=SOURCE.tree[channel+'Channel'].m_Curve;x=Math.max(0,Math.min(1,x));const a=keys[0],b=keys[1],span=b.time-a.time,t=(x-a.time)/span,t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*a.value+(t3-2*t2+t)*span*a.outSlope+(-2*t3+3*t2)*b.value+(t3-t2)*span*b.inSlope;}
export function correctOriginalBattleColor(rgb){const out=rgb.map((v,i)=>evaluateOriginalBattleColorCurve(['red','green','blue'][i],v)),luma=out[0]*.22+out[1]*.707+out[2]*.071;return out.map(v=>luma+SOURCE.tree.saturation*(v-luma));}
// Original fragment shader samples 3 distinct curve rows at y=.125/.375/.625.
// Texture quantization/Unity LUT update filtering still needs native verification.
export function createOriginalBattleColorCorrectionPass(THREE,{lutWidth=256}={}){
 const bytes=new Uint8Array(lutWidth*4*4);
 for(let row=0;row<4;row++)for(let i=0;i<lutWidth;i++){const v=row<3?evaluateOriginalBattleColorCurve(['red','green','blue'][row],i/(lutWidth-1)):1,at=(row*lutWidth+i)*4;bytes[at]=bytes[at+1]=bytes[at+2]=Math.round(Math.max(0,Math.min(1,v))*255);bytes[at+3]=255;}
 const texture=new THREE.DataTexture(bytes,lutWidth,4,THREE.RGBAFormat);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{inputTexture:{value:null},curveTexture:{value:texture},saturation:{value:SOURCE.tree.saturation}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D inputTexture;uniform sampler2D curveTexture;uniform float saturation;varying vec2 vUv;void main(){vec4 src=texture2D(inputTexture,vUv);vec3 c=vec3(texture2D(curveTexture,vec2(src.r,.125)).r,texture2D(curveTexture,vec2(src.g,.375)).g,texture2D(curveTexture,vec2(src.b,.625)).b);float l=dot(c,vec3(.22,.707,.071));gl_FragColor=vec4(vec3(l)+saturation*(c-vec3(l)),src.a);}'});
 return{material,texture,dispose(){material.dispose();texture.dispose();},runtimeLutVerified:false};
}
