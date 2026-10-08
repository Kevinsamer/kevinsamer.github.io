import {CLIENT_STAGES} from './client-stages.js';
import {STAGE_SELECT_LAYOUT as L} from './client-stage-select-layout.js';
import {clientInitialStagePage,clientStageSlot,clientStagePageSteps,CLIENT_STAGE_MOVE_SECOND} from './client-stage-carousel.js';
import {STAGE_CARD_ANIMATION} from './client-stage-card-animation.js';
import {decodeEffectAnimation} from './native-effect-animation.js';
const S=2/3;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const at=name=>L.nodes.find(r=>r.path==='SquareIcon/start_anim/'+name);
const rect=b=>`left:${b[0]*S}px;top:${b[1]*S}px;width:${b[2]*S}px;height:${b[3]*S}px;`;
function art(name,regionId){const r=at(name);if(!r)return '';return r.images.map(im=>{const b=r.visibleBounds.map((v,i)=>i<2?v-(i===0?-95:-230):v);let style=rect(b);if(im.imageType===1){const border=im.slices.map(v=>v*S);const src=regionId&&['stage_plate','window'].includes(name)?`assets/original/ui-tinted/stageselect_runtime_${name}_${regionId}.png`:im.src;style+=`border:solid transparent;border-width:${border.join('px ')}px;border-image:url('${src}') ${im.slices.join(' ')} fill stretch;`;}else style+=`background:url('${im.src}') center/100% 100% no-repeat;`;return `<span class="native-stage-select-art" style="${style}"></span>`;}).join('');}
function text(name,value,color='#fff'){const r=at(name),b=r.visibleBounds.map((v,i)=>i<2?v-(i===0?-95:-230):v);return `<span class="native-stage-select-text" style="${rect(b)}font-size:${(r.texts[0]?.fontSize||40)*S}px;color:${color}">${esc(value)}</span>`;}
const slotPosition=(page,index)=>{const b=L.targetBounds[clientStageSlot(page,index,L.targetBounds.length)];return {x:b[0]+b[2]/2,y:b[1]+b[3]/2};};
export function nativeStageSelectUI({region,game,stageUnlocked,teamPower,selectedIndex=0,getStagePosition}){
 const sourceColor=CLIENT_STAGES.misc.m_stageCommon.m_dungeonColor[region.id-1],regionColor=`rgba(${[sourceColor.r,sourceColor.g,sourceColor.b].map(v=>Math.round(v*255)).join(',')},${sourceColor.a})`;
 const power=typeof teamPower==='function'?teamPower(game):teamPower;
 const flag=game.clientProgressFlags?.[region.id-1]??(game.cleared.includes(region.id+'-B')?99:region.stages.filter(stage=>stageUnlocked(game,stage)).length);
 const initial=clientInitialStagePage({dungeonID:region.id-1,flag,stageCount:region.stages.length,requestedStageIndex:selectedIndex});
 const cards=region.stages.map((stage,index)=>{const unlocked=stageUnlocked(game,stage),clear=game.cleared.includes(stage.id),boss=stage.id.endsWith('-B');
  const position=getStagePosition?.(stage,index)||slotPosition(initial.page,index),selected=index===Math.abs(initial.page);
  // Center the source hit rectangle on the target; the serialized prefab has a
  // local origin distinct from its graphic center. Source dimensions preserved.
  const left=position.x-185,top=position.y-140;
  return `<button class="native-stage-select-card" data-preview-stage="${esc(stage.id)}" data-stage-index="${index}" data-native-placement="source-slot-map" aria-pressed="${selected}" style="left:${left*S}px;top:${top*S}px;transform:scale(${selected?1.2000000476837158:1})" ${unlocked?'':'disabled'} aria-label="${esc(stage.id)}, 战力 ${stage.power}${clear?', 已通关':''}">${art('stage_plate',region.id)}${art('window',region.id)}${art('image')}${text(boss?'stage_boss':'stage_number',boss?'BOSS':stage.id,boss?'#f00':'#fff')}${text('LV','ENEMY POWER',regionColor)}${text('LV_number',stage.power.toLocaleString(),'#fff')}${clear?art('clear_base')+text('clear_base/clear','CLEAR!'):''}${unlocked?'':art('off')}</button>`;
 }).join('');
 return `<section class="native-stage-select" aria-label="${esc(region.name)} 关卡选择" data-native-stage-region="${region.id}" data-current-page="${initial.page}" data-team-power="${power??''}" data-position-evidence="source-initial-page-slot-map"><div class="native-stage-select-content">${cards}</div></section>`;
}
export function moveNativeStageCarousel(root,index){for(const card of root.querySelectorAll('.native-stage-select-card')){const p=slotPosition(-index,+card.dataset.stageIndex);card.style.left=(p.x-185)*S+'px';card.style.top=(p.y-140)*S+'px';}root.dataset.currentPage=String(-index);}

const boundCarousels=new WeakSet(),selectionClips={select:decodeEffectAnimation(STAGE_CARD_ANIMATION.select),unselect:decodeEffectAnimation(STAGE_CARD_ANIMATION.unselect)};
function animateSelection(card,selected){card.setAttribute('aria-pressed',String(selected));const clip=selectionClips[selected?'select':'unselect'],started=performance.now();const frame=now=>{if(!card.isConnected)return;const age=(now-started)/1000,scale=clip.sample(age).find(c=>c.field==='scale'&&c.path===0)?.values[0]??1;card.style.transform=`scale(${scale})`;if(age<clip.duration)requestAnimationFrame(frame);};requestAnimationFrame(frame);}
function animateStagePage(root,page){const cards=[...root.querySelectorAll('.native-stage-select-card')],targets=cards.map(card=>{const point=slotPosition(page,+card.dataset.stageIndex);return {card,from:parseFloat(card.style.left),to:(point.x-185)*S};}),started=performance.now();root.dataset.currentPage=String(page);return new Promise(resolve=>{const frame=now=>{if(!root.isConnected){resolve(false);return;}const t=Math.min(1,(now-started)/(CLIENT_STAGE_MOVE_SECOND*1000));for(const {card,from,to}of targets)card.style.left=(from+(to-from)*t)+'px';if(t<1)requestAnimationFrame(frame);else resolve(true);};requestAnimationFrame(frame);});}
export function bindNativeStageCarousel(root){
 if(!root||boundCarousels.has(root))return;boundCarousels.add(root);let page=Number(root.dataset.currentPage),busy=false,suppressClick=false,drag=null;const cards=[...root.querySelectorAll('.native-stage-select-card')];root.tabIndex=0;
 const select=()=>{for(const card of cards){const selected=+card.dataset.stageIndex===Math.abs(page);if(card.getAttribute('aria-pressed')!==String(selected))animateSelection(card,selected);}root.dispatchEvent(new CustomEvent('native-stage-selected',{bubbles:true,detail:{stageId:cards[Math.abs(page)]?.dataset.previewStage,index:Math.abs(page)}}));};
 const move=async index=>{index=Math.max(0,Math.min(cards.length-1,index));if(busy||-index===page)return;busy=true;root.dataset.moving='true';try{for(const target of clientStagePageSteps(page,-index)){for(const card of cards)if(card.getAttribute('aria-pressed')==='true')animateSelection(card,false);if(!await animateStagePage(root,target))return;page=target;select();}}finally{busy=false;root.dataset.moving='false';}};
 root.addEventListener('pointerdown',e=>{if(e.button!==0||busy)return;suppressClick=false;const card=e.target.closest('.native-stage-select-card');if(card&&!card.disabled&&+card.dataset.stageIndex!==Math.abs(page)){suppressClick=true;move(+card.dataset.stageIndex);return;}drag={id:e.pointerId,x:e.clientX,index:Math.abs(page),scale:root.getBoundingClientRect().width/1280,positions:cards.map(card=>parseFloat(card.style.left))};});
 root.addEventListener('pointermove',e=>{if(!drag||busy||e.pointerId!==drag.id)return;const dx=(e.clientX-drag.x)/drag.scale;if(Math.abs(dx)>8)suppressClick=true;if(suppressClick)cards.forEach((card,i)=>card.style.left=drag.positions[i]+dx+'px');});
 const end=e=>{if(!drag||e.pointerId!==drag.id)return;const dx=(e.clientX-drag.x)/drag.scale,index=Math.max(0,Math.min(cards.length-1,drag.index-Math.round(dx/(400*S))));drag=null;if(suppressClick){if(index===Math.abs(page))moveNativeStageCarousel(root,index);else move(index);}};
 root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
 root.addEventListener('click',e=>{const card=e.target.closest('.native-stage-select-card');if(!card)return;if(suppressClick||busy||+card.dataset.stageIndex!==Math.abs(page)){e.preventDefault();e.stopImmediatePropagation();const pending=suppressClick;suppressClick=false;if(!busy&&!pending&&!card.disabled)move(+card.dataset.stageIndex);}},true);
 root.addEventListener('wheel',e=>{const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(delta)<10)return;move(Math.abs(page)+Math.sign(delta));e.preventDefault();},{passive:false});
 root.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;move(Math.abs(page)+(e.key==='ArrowRight'?1:-1));e.preventDefault();});
}


