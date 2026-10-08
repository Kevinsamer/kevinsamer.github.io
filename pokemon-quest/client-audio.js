// Original audio event IDs from the supplied client's SoundbanksInfo.xml.
export const AUDIO_KEYS={camp:'2835101412',battle:'1546343780',boss:'2259380375',victory:'81132857',title:'379376351',stageSelect:'1965382254',click:'4102266795',cancel:'3973903881',waveClear:'3980542379',areaClear:'239493662'};

export function createOriginalAudio({musicVolume=.25,effectVolume=.45}={}){
 const manifestURL=new URL('./assets/original/audio/manifest.json',import.meta.url);
 const ready=fetch(manifestURL).then(r=>{if(!r.ok)throw new Error(`Audio manifest: ${r.status}`);return r.json();});
 let context,music,musicKey,request=0,muted=false;
 const cache=new Map();
 function getContext(){if(!context){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)throw new Error('Web Audio unavailable');context=new Context();}return context;}
 async function buffer(track){if(cache.has(track.url))return cache.get(track.url);const promise=fetch(new URL('./'+track.url,import.meta.url)).then(r=>{if(!r.ok)throw new Error(`Audio asset: ${r.status}`);return r.arrayBuffer();}).then(bytes=>getContext().decodeAudioData(bytes));cache.set(track.url,promise);try{const value=await promise;if(cache.size>8){const oldest=cache.keys().next().value;if(oldest!==track.url)cache.delete(oldest);}return value;}catch(error){cache.delete(track.url);throw error;}}
 async function resolve(key){const events=await ready;const id=AUDIO_KEYS[key]||String(key);return events[id]||Object.values(events).find(e=>e.name===key);}
 function stopMusic(){request++;if(music){try{music.source.stop();}catch{}music.gain.disconnect();music=null;musicKey=null;}}
 async function playMusic(key,{loop,volume=musicVolume}={}){
  const id=AUDIO_KEYS[key]||String(key);if(id===musicKey&&music)return true;
  stopMusic();const token=request,event=await resolve(key);if(token!==request||!event?.tracks.length)return false;
  const track=event.tracks[0],data=await buffer(track);if(token!==request)return false;
  const ctx=getContext(),source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=data;
  source.loop=loop??(track.loopEnd>track.loopStart);if(track.loopEnd>track.loopStart){source.loopStart=track.loopStart;source.loopEnd=track.loopEnd;}
  gain.gain.value=muted?0:volume;source.connect(gain);gain.connect(ctx.destination);source.start();music={source,gain,volume};musicKey=id;return true;
 }
 async function playEffect(key,{volume=effectVolume}={}){
  if(muted)return false;const event=await resolve(key);if(!event?.tracks.length)return false;
  const track=event.tracks[0],data=await buffer(track),ctx=getContext(),source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=data;source.loop=false;source.playbackRate.value=event.playbackRate??1;gain.gain.value=volume*(event.gain??1);source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();return true;
 }
 return {ready,unlock:()=>getContext().resume(),playMusic,playEffect,stopMusic,setMuted(value){muted=!!value;if(music)music.gain.gain.value=muted?0:music.volume;},setMusicVolume(value){musicVolume=Math.max(0,Math.min(1,value));if(music){music.volume=musicVolume;music.gain.gain.value=muted?0:musicVolume;}},async close(){stopMusic();cache.clear();if(context)await context.close();context=null;}};
}
