import {RESULT_LAYOUT} from './client-result-layout.js';
import {originalSprite} from './native-ui.js';
import {nativeTapMarker} from './native-tap-marker.js';
import {LOOT_ITEMS,LOOT_STONES} from './client-loot-bindings.js';
const SCALE=2/3;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pos=([x,y,w,h])=>`left:${x*SCALE}px;top:${y*SCALE}px;width:${w*SCALE}px;height:${h*SCALE}px;`;
const row=p=>RESULT_LAYOUT.find(r=>r.path===p);
const transform=(bounds,anchor,scale=.75)=>bounds.map((v,i)=>i<2?(anchor[i]+scale*(v-(i===0?50:-50))):v*scale);
function image(r,bounds=r?.visibleBounds){if(!r||!r.images.length)return '';return r.images.map(im=>{let css=pos(bounds);if(im.src&&im.imageType===1){let borders=im.slices.map(x=>x*SCALE);for(const [i,j,size] of [[0,2,bounds[3]*SCALE],[1,3,bounds[2]*SCALE]])if(borders[i]+borders[j]>size){const f=size/(borders[i]+borders[j]);borders[i]*=f;borders[j]*=f;}css+=`border-style:solid;border-color:transparent;border-width:${borders.join('px ')}px;border-image:url('${im.src}') ${im.slices.join(' ')} fill stretch;`;}else if(im.src)css+=`background:url('${im.src}') center/100% 100% no-repeat;`;else{const [r,g,b,a]=im.color;css+=`background:rgba(${r},${g},${b},${a/255});`;}return `<span class="native-result-art" style="${css}"></span>`;}).join('');}
const text=(value,b,size=40,color='#fff')=>`<span class="native-result-text" style="${pos(b)}font-size:${size*SCALE}px;color:${color}">${esc(value)}</span>`;
const prefix='pokemon_status/pokemon_status/';
function pokemonStatus({m,s,stats,portrait,x,nextLevelXp}){
 const anchor=[x,270],at=p=>row(prefix+p),rect=p=>transform(at(p).bounds,anchor);
 const paths=['background_name_all','button_general','button_general/static/monster_name_line','button_general/Lv_window','button_general/HP/window','button_general/ATK/window','button_general/level_slider/Background','button_general/level_slider/waku','button_general/HP/text_window','button_general/ATK/text_window','button_general/HP/icon','button_general/ATK/icon'];
 let html=paths.map(p=>{const r=at(p);return image(r,r&&transform(r.bounds,anchor));}).join('');
 const labels=[['button_general/static/monster_name',s.name,60],['button_general/Lv','Lv.',25],['button_general/level_count',m.level,77],['button_general/HP/text','HP',25],['button_general/ATK/text','ATK',25],['button_general/HP/counter',stats.hp,60],['button_general/ATK/counter',stats.atk,60]];
 const colors={'button_general/static/monster_name':'#323232','button_general/Lv':'#ffdf55','button_general/HP/text':'#00389b','button_general/ATK/text':'#951200'};
 html+=labels.map(([p,v,size])=>text(v,rect(p),size*.75,colors[p]||'#fff')).join('');
 html+=`<div class="native-result-portrait" style="${pos(rect('button_general/pokemon_icon/monster_icon'))}">${portrait(s)}</div>`;
 const b=rect('button_general/level_slider/Background'),ratio=Math.min(1,Math.max(0,m.xp/Math.max(1,nextLevelXp(m.level))));
 html+=`<span class="native-result-exp-fill" style="${pos([b[0],b[1],b[2]*ratio,b[3]])}" aria-label="经验 ${Math.round(ratio*100)}%"></span>`;
 return html;
}
/** Authored monster_status_charm_in / result_title_in final geometry.
 * Dynamic prefabs are instantiated at their native .75 scale; this result
 * screen uses static pokemon_status content, not the editor's slide-in clip. */
export function nativeExperienceResult({game,battle,reward,species,portrait,monsterStats,nextLevelXp,isSlotUnlocked,slotOrder=[0,1,2,3,4,5,6,7,8],gem,skillIcon,moves,skillCells,teamPower,regionName=''}){
 let html='<section class="native-exp-result" aria-label="探险结果">';
 // back_black_in animates Image alpha from 0 to 2/3 (source binding 304273561).
 html+='<span class="native-result-dimmer"></span>';
 const base='Canvas_result_title/title_group/title_window';
 for(const p of ['','/icon_back','/icon_cover','/window_dent','/Image','/icon'])html+=image(row(base+p));
 html+=text('探险结果',row(base+'/Text').visibleBounds,50);
 const info='Canvas_result_title/dungeon_group/dungeon_info';
 html+=image(row(info+'/dungeon_name'))+image(row(info+'/stage_count'))+text(regionName,row(info+'/dungeon_name/stagename').visibleBounds,40);
 const stage=battle?.stage?.id||'';html+=text(stage.endsWith('-B')?'BOSS':stage,row(info+'/stage_count/count').visibleBounds,40);
 const power='Canvas_pokemon_team_status/pstatus_all/team_power/';
 for(const p of ['line_up','line_down1','line_down2','line_corner','window','window2','image','text_window'])html+=RESULT_LAYOUT.filter(r=>r.path===power+p).map(r=>image(r)).join('');
 html+=text(teamPower,row(power+'counter').visibleBounds,60)+text('TEAM POWER',row(power+'text').visibleBounds,25);
 game.team.forEach((uid,i)=>{const m=game.monsters.find(m=>m.uid===uid);if(!m)return;const s=species(m.speciesId),x=330+i*630;html+=pokemonStatus({m,s,x,stats:monsterStats(game,m),portrait,nextLevelXp});
  const anchor=[x,670],grid=transform(row('charm_board/charm_all/passive_grid').bounds,anchor),cell=112.5,gap=15;
  slotOrder.forEach((id,j)=>{const stone=game.stones.find(s=>s.id===m.slots[id]),kind=m.slotKinds[id]==='hp'?'HP':m.slotKinds[id]==='atk'?'ATK':'ATKHP',b=[grid[0]+(j%3)*(cell+gap),grid[1]+Math.floor(j/3)*(cell+gap),cell,cell];html+=`<span class="native-result-stone-cell" style="${pos(b)}">${originalSprite('window_pcharm_blank_'+kind)}${!isSlotUnlocked(m,id)?originalSprite('window_pcharm_hibi_'+kind):stone?gem(stone):''}</span>`;});
  const skillGrid=transform(row('charm_board/charm_all/skill_grid').bounds,anchor);
  // GridLayoutGroup is one row: 150px cells + 20px gaps before .75 instance scaling.
  // Runtime skill / move-stone indices must be supplied from verified engine placement.
  for(const cell of skillCells?.(m)||[]){html+=`<span class="native-result-skill" style="${pos([skillGrid[0]+cell.index*127.5,skillGrid[1],112.5,112.5])}" aria-label="${esc(cell.label||'')}">${cell.html||skillIcon(cell.moveId)}</span>`;}
 });
 html+=`<button class="native-result-continue" data-action="result-next" aria-label="查看探险奖励">${nativeTapMarker()}</button>`;
 return html+'</section>';
}

/** Canvas_drop_window source panel rectangles and component-array order. */
export function nativeLootResult({game,battle,reward={},ingredients,foodIcon,gem,stoneBonuses=[],moveStones=[],moveStoneIcon,regionName='',ingredientOrder}){
 let html='<section class="native-exp-result native-loot-result" aria-label="探险奖励"><span class="native-result-dimmer"></span>';
 const title='Canvas_result_title/title_group/title_window';
 for(const p of ['','/icon_back','/icon_cover','/window_dent','/Image','/icon'])html+=image(row(title+p));
 html+=text('探险结果',row(title+'/Text').visibleBounds,50);
 const info='Canvas_result_title/dungeon_group/dungeon_info',stage=battle?.stage?.id||'';
 html+=image(row(info+'/dungeon_name'))+image(row(info+'/stage_count'))+text(regionName,row(info+'/dungeon_name/stagename').visibleBounds,40)+text(stage.endsWith('-B')?'BOSS':stage,row(info+'/stage_count/count').visibleBounds,40);
 for(const kind of ['get_stone','get_zairyou'])for(const p of ['back','waku','title/waku','title/icon','title/line','title/line2'])html+=image(row('Canvas_drop_window/'+kind+'/'+p));
 // The serialized title/Text rectangles are off-screen in this prefab; their
 // runtime repositioning is not established, so no invented header is added.
 const orderedIngredients=ingredientOrder||[...ingredients].sort((a,b)=>a.clientId-b.clientId);
 LOOT_ITEMS.forEach((binding,i)=>{const f=orderedIngredients[i];if(!f)return;const n=reward.ingredients?.[f.id]||0;html+=`<span class="native-loot-ingredient ${n?'':'empty'}" style="${pos(binding.icon.bounds)}" aria-label="${esc(f.name)} ${n}">${foodIcon(f.id)}</span>`+text(n,binding.count.bounds,binding.count.texts[0]?.fontSize||50);});
 const obtained=[...(reward.stones|| (reward.stone?[reward.stone]:[])),...(reward.moveStones||[])];
 obtained.slice(0,LOOT_STONES.length).forEach((s,i)=>{const binding=LOOT_STONES[i],isSkill=!!s.kind&&!['hp','atk'].includes(s.kind),branch=isSkill?binding.skill:binding.passive;
  html+=image(branch.frame)+image(branch.main);
  html+=`<span class="native-loot-stone-icon" style="${pos(binding.image.visibleBounds)}">${isSkill?moveStoneIcon?.(s)||'':gem(s)}</span>`;
  const properties=branch.properties;
  const t=(record,value)=>record?text(value,record.visibleBounds,record.texts[0]?.fontSize||30):'';
  if(isSkill){const def=moveStones.find(d=>d.kind===s.kind);html+=t(properties[0].titleText,def?.name||s.kind);}
  else{html+=t(properties[0].titleText,s.kind==='hp'?'铁打石':'大力石')+t(properties[0].typeText,s.kind==='hp'?'HP':'ATK')+t(properties[0].valueText,'+'+s.value)+t(binding.valueText,s.value);Object.entries(s.bonus||{}).slice(0,3).forEach(([id,value],j)=>{const p=properties[j+1];html+=t(p.titleText,stoneBonuses.find(b=>b.id===id)?.name||id)+t(p.valueText,'+'+value+'%');});}
 });
 return html+`<button class="native-result-continue" data-action="return-camp" aria-label="返回大本营">${nativeTapMarker()}</button></section>`;
}
