import {CLIENT_BATTLE_FAILURE_LAYOUT as L,CLIENT_BATTLE_FAILURE_MESSAGES as M,CLIENT_PAUSE_LOOT_BINDINGS as B} from './client-battle-failure-layout.js';
const scale=2/3,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=b=>`left:${b[0]*scale}px;top:${b[1]*scale}px;width:${b[2]*scale}px;height:${b[3]*scale}px;`;
const find=(root,path)=>L.find(r=>r.root===root&&r.path===root+'/'+path);
function art(r){if(!r)return '';return r.images.map(im=>{
 if(!im.originalCanvasPath)return '';
 const rgba=['r','g','b','a'].map(k=>Math.round(im.color[k]*255));
 const src=`assets/original/ui-tinted/failure_${im.sprite}_${rgba.join('_')}.png`;
 let style=rect(r.visibleBounds);
 if(im.imageType===1){const b=im.border,edges=[b.w,b.z,b.y,b.x],widths=edges.map(v=>v*scale);for(const[i,j,size]of[[0,2,r.visibleBounds[3]*scale],[1,3,r.visibleBounds[2]*scale]])if(widths[i]+widths[j]>size){const f=size/(widths[i]+widths[j]);widths[i]*=f;widths[j]*=f;}style+=`border-style:solid;border-color:transparent;border-width:${widths.join('px ')}px;border-image:url('${src}') ${edges.join(' ')} fill stretch;`;}
 else style+=`background:url('${src}') center/100% 100% no-repeat;`;
 return `<span class="native-failure-art" style="${style}"></span>`;
 }).join('');}
const label=(r,value,size=r?.texts[0]?.fontSize||40,color='#fff')=>r?`<span class="native-failure-text" style="${rect(r.visibleBounds)}font-size:${size*scale}px;color:${color}">${esc(value)}</span>`:'';
const hit=(r,action,name,disabled=false)=>r?`<button class="native-failure-hit" data-action="${action}" aria-label="${esc(name)}" style="${rect(r.visibleBounds)}" ${disabled?'disabled':''}></button>`:'';
const message=(table,id)=>M[table]?.[id]?.text||'';
export function nativeFailureExplanation({timeUp=false}={}){
 const root='Canvas_gameover_1button',base='window_general/general_window/',get=p=>find(root,base+p);
 return `<section class="native-failure-window" role="dialog" aria-label="探险失败">${art(get('general_waku'))}${label(get('explain_text'),message('battle',timeUp?12:11))}${art(get('button/button_general/Image'))}${label(get('button/button_general/Text'),message('common_dialog',3))}${hit(get('button/button_general/Image/button_hit_range'),'failure-close',message('common_dialog',3))}</section>`;
}
export function nativeBattleConfirmation({collect=false}={}){
 const root='Canvas_windowgeneral_2button',base='window_general/general_window/',get=p=>find(root,base+p);
 return `<section class="native-failure-window native-failure-confirm" role="dialog" aria-label="${collect?'回收物品确认':'放弃探险确认'}"><span class="native-failure-dimmer"></span>${art(get('general_waku'))}${label(get('explain_text'),message('battle',collect?55:0),40,'#323232')}${['L','R'].map((side,i)=>art(get(`button_${side}/button_general/Image`))+label(get(`button_${side}/button_general/Text`),message('common_dialog',i?5:4))+hit(get(`button_${side}/button_general/Image/button_hit_range`),i?'failure-cancel':collect?'failure-collect-yes':'failure-forgo-yes',message('common_dialog',i?5:4))).join('')}</section>`;
}
export function nativeBattlePauseUI({tickets,cost,collectEnabled,failed=false,itemsHTML=''}={}){
 const root='Canvas_battle_pose',get=p=>find(root,p),base='pose_menu/button_collect/button_general';
 let html=`<section class="native-failure-window native-battle-pause" role="dialog" aria-label="探险物品回收"><span class="native-failure-dimmer"></span>${itemsHTML}`;
 for(const p of [base,base+'/card_base',base+'/giftcard','pose_menu/button_forgo/button_general/Image','pose_menu/giftcard_window/card_base','pose_menu/giftcard_window/giftcard'])html+=art(get(p));
 html+=label(get(base+'/Text'),message('battle',13))+label(get(base+'/count'),cost)+label(get('pose_menu/button_forgo/button_general/Text'),message('battle',14))+label(get('pose_menu/giftcard_window/count'),tickets);
 if(!collectEnabled)html+=art(get(base+'/off'));
 html+=hit(get(base+'/button_hit_range'),'failure-collect','回收后撤退',!collectEnabled)+hit(get('pose_menu/button_forgo/button_general/Image/button_hit_range'),'failure-forgo','放弃探险');
 if(!failed)html+=art(get('button_exit/allround_button'))+hit(get('button_exit/allround_button/button_hit_range'),'failure-resume','继续探险');
 return html+'</section>';
}
export function nativeBattlePauseItems({drops={},ingredients=[],foodIcon,gem,moveStoneIcon}){
 const root='Canvas_battle_pose',get=p=>find(root,p),record=b=>L.find(r=>r.root===root&&r.id===b?.id);
 let html=art(get('get_stone/back'));
 for(const r of L.filter(r=>r.root===root&&r.path.startsWith(root+'/get_stone/waku')&&r.sourceActive&&r.images.length))html+=art(r);
 const ordered=[...ingredients].sort((a,b)=>a.clientId-b.clientId);
 B.items.forEach((binding,i)=>{const food=ordered[i];if(!food)return;const icon=binding.m_graphic.image,count=binding.m_property.valueText,n=drops.ingredients?.[food.id]||0;
  const candidates=L.filter(r=>r.root===root&&r.path===count.path.replace(/Text$/,'Image'));
  const target=candidates.sort((a,b)=>Math.hypot(a.visibleBounds[0]-count.visibleBounds[0],a.visibleBounds[1]-count.visibleBounds[1])-Math.hypot(b.visibleBounds[0]-count.visibleBounds[0],b.visibleBounds[1]-count.visibleBounds[1]))[0];
  html+=art(target)+`<span class="native-pause-food ${n?'':'empty'}" style="${rect(icon.visibleBounds)}" aria-label="${esc(food.name)} ${n}">${foodIcon(food.id)}</span>`+label(record(count),n);
 });
 [...(drops.stones||[]),...(drops.moveStones||[])].slice(0,B.stones.length).forEach((stone,i)=>{const graphic=B.stones[i].m_graphic,skill=!['hp','atk'].includes(stone.kind);html+=`<span class="native-pause-stone" style="${rect(graphic.image.visibleBounds)}" aria-label="${esc(skill?stone.kind:stone.kind==='hp'?'铁打石':'大力石')}">${skill?moveStoneIcon?.(stone)||'':gem(stone)}</span>`;if(!skill)html+=label(record(graphic.valueText),stone.value);});
 return html;
}
