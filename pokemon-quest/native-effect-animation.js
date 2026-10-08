// Serialized Unity rigid-transform clips. Scalar channels preserve streamed
// cubic coefficients, dense sample rate and constant channel offsets.
export function decodeEffectAnimation(clip){
 if(!clip)return null;const curves=new Map(),raw=clip.streamed.data,buffer=new ArrayBuffer(4),v=new DataView(buffer),float=n=>{v.setUint32(0,n,true);return v.getFloat32(0,true)};let i=0;
 while(i+2<=raw.length){const time=float(raw[i++]),count=raw[i++];if(count<0||count>(raw.length-i)/5)throw Error('Invalid original streamed animation frame');for(let j=0;j<count;j++){const index=raw[i++],coefficients=raw.slice(i,i+4).map(float);i+=4;if(Number.isFinite(time)){const keys=curves.get(index)||[];keys.push({time,coefficients});curves.set(index,keys)}}}
 const bindings=[];let cursor=0;for(const b of clip.bindings){const size=b.typeID===4?({1:3,2:4,3:3,4:3}[b.attribute]||1):1;bindings.push({...b,index:cursor,size});cursor+=size;}
 const scalar=(index,time)=>{if(index<clip.streamed.curveCount){const keys=curves.get(index)||[];let key;for(const k of keys){if(k.time>time)break;key=k;}if(!key)return 0;const d=time-key.time,[a,b,c,e]=key.coefficients;return ((a*d+b)*d+c)*d+e;}
  const d=clip.dense,j=index-clip.streamed.curveCount;if(j<d.m_CurveCount){const frame=Math.max(0,Math.min(d.m_FrameCount-1,(time-d.m_BeginTime)*d.m_SampleRate)),lo=Math.floor(frame),hi=Math.min(d.m_FrameCount-1,lo+1),a=d.m_SampleArray[lo*d.m_CurveCount+j],b=d.m_SampleArray[hi*d.m_CurveCount+j];return a+(b-a)*(frame-lo);}
  return clip.constant[j-d.m_CurveCount];};
 return {duration:clip.duration,loop:clip.loop,bindings,sampleBindings(time){time=clip.loop&&clip.duration>0?time%clip.duration:Math.max(0,Math.min(time,clip.duration));return bindings.map(b=>({...b,values:Array.from({length:b.size},(_,i)=>scalar(b.index+i,time))}));},sample(time){time=clip.loop&&clip.duration>0?time%clip.duration:Math.max(0,Math.min(time,clip.duration));return bindings.filter(b=>b.typeID===4&&[1,2,3].includes(b.attribute)).map(b=>({path:b.path,field:{1:'position',2:'rotation',3:'scale'}[b.attribute],values:Array.from({length:b.size},(_,i)=>scalar(b.index+i,time))}));}};
}

