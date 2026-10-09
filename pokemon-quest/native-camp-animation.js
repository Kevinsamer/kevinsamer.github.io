import {decodeEffectAnimation} from './native-effect-animation.js';
export function createCampClipPlayer(raw,entries){const clip=decodeEffectAnimation(raw),byHash=new Map(entries.map(e=>[e.source.animationPathHash,e.object]));const bindings=clip.bindings.filter(b=>b.typeID===4&&[1,2,3].includes(b.attribute)),missing=[...new Set(bindings.filter(b=>!byHash.has(b.path)).map(b=>b.path))];let samples=0;
 return{duration:clip.duration,loop:clip.loop,missing,bound:bindings.filter(b=>byHash.has(b.path)).length,update(time){for(const t of clip.sample(time)){const o=byHash.get(t.path);if(!o||!t.values.every(Number.isFinite))continue;if(t.field==='rotation')o.quaternion.fromArray(t.values).normalize();else o[t.field].fromArray(t.values);}samples++;},get samples(){return samples;}};
}
export function createCampSceneAnimations(store,library){const players=[],nodes=store.data.nodes;function add(name,ids){const raw=library.clips[name];if(!raw||!ids.length)return;const entries=ids.map(id=>({source:nodes[id],object:store.nodes[id]}));const root=entries.find(e=>e.source.animationPathHash===0)?.object;players.push({name,root,player:createCampClipPlayer(raw,entries),start:null,active:false});}
 const field=Object.keys(nodes).find(id=>nodes[id].name==='BC_field');function below(id,ancestor){let p=id;for(let n=0;n<100&&nodes[p];n++){if(p===ancestor)return true;p=nodes[p].parent;}return false;}
 add('BC_field',Object.keys(nodes).filter(id=>below(id,field)));
 for(const[id,n]of Object.entries(nodes)){if(id.startsWith('goods:')&&id.split(':').length===2)add(n.name+'_idle',Object.keys(nodes).filter(k=>k.startsWith(id+':')));
  if(id.startsWith('campPot:')&&n.parent&&nodes[n.parent]?.name?.startsWith('BC_pot')){const prefix=id.slice(0,id.lastIndexOf(':')+1);add(n.name,Object.keys(nodes).filter(k=>k.startsWith(prefix)));}
 }
 return{players,update(time){for(const p of players){let visible=true;for(let o=p.root;o;o=o.parent)if(o.visible===false){visible=false;break;}if(!visible){p.active=false;continue;}if(!p.active){p.start=time;p.active=true;}p.player.update(time-p.start);}store.effectVersion=(store.effectVersion||0)+1;},report(){return players.map(p=>({name:p.name,active:p.active,bound:p.player.bound,missing:p.player.missing,samples:p.player.samples}));}};
}
