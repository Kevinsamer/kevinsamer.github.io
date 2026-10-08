import {CLIENT_TEAM_UI_LAYOUT as SOURCE} from './client-team-ui-layout.js';
import {CLIENT_TEAM_STATUS_LAYOUT as STATUS} from './client-team-status-layout.js';
import {UI_SPRITES} from './client-ui-assets.js';
const SCALE=2/3,L=SOURCE.nodes,byID=id=>L.find(r=>r.id===String(id));
let lastToggleClick={uid:null,time:0};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=(b,dx=0,dy=0)=>`left:${(b[0]+dx)*SCALE}px;top:${(b[1]+dy)*SCALE}px;width:${b[2]*SCALE}px;height:${b[3]*SCALE}px;`;
function art(r,dx=0,dy=0){if(!r)return '';return r.images.map(im=>{let style=rect(r.visibleBounds,dx,dy);if(im.imageType===1){const widths=im.slices.map(v=>v*SCALE);for(const[i,j,size]of[[0,2,r.visibleBounds[3]*SCALE],[1,3,r.visibleBounds[2]*SCALE]])if(widths[i]+widths[j]>size){const f=size/(widths[i]+widths[j]);widths[i]*=f;widths[j]*=f;}style+=`border:solid transparent;border-width:${widths.join('px ')}px;border-image:url('${im.src}') ${im.slices.join(' ')} fill stretch;`;}else style+=`background:url('${im.src}') center/100% 100% no-repeat;`;return `<span class="native-team-art" data-source-node="${r.id}" style="${style}"></span>`;}).join('');}
function text(id,value,{color,dx=0,dy=0,node}={}){const r=node||byID(id);if(!r)return '';const t=r.texts[0]||{},c=t.m_fontColor||{r:1,g:1,b:1,a:1};return `<span class="native-team-text" data-source-node="${id}" style="${rect(r.visibleBounds,dx,dy)}font-size:${(t.m_fontSize||30)*SCALE}px;color:${color||`rgba(${c.r*255},${c.g*255},${c.b*255},${c.a})`}">${esc(value)}</span>`;}
const hit=(id,attrs,label)=>{const r=byID(id),uid=attrs.includes('data-team-slot')?attrs.match(/data-team-toggle="([^"]+)"/)?.[1]:null;if(uid)attrs+=` draggable="true" data-drag-monster="${uid}"`;return `<button type="button" class="native-team-hit" style="${rect(r.visibleBounds)}" ${attrs} aria-label="${esc(label)}" title="${esc(label)}"></button>`;};
const message=id=>SOURCE.messages.find(m=>m.index===id)?.text||'';
const speciesFor=(species,m)=>typeof species==='function'?species(m.speciesId):Array.isArray(species)?species.find(s=>s.id===m.speciesId):species[m.speciesId];
const portrait=(m,b,species)=>{const dex=speciesFor(species,m)?.dex,src=STATUS.icons['button_icon_M'+dex];return src?`<img class="native-team-portrait" src="${src}" style="${rect(b)}" alt="">`:'';};
export function originalTeamGridCell(index){const g=SOURCE.grids.find(g=>g.id===731),[x,y]=g.visibleBounds;return[x+g.m_Padding.m_Left+(index%5)*(g.m_CellSize.x+g.m_Spacing.x),y+Math.floor(index/5)*(g.m_CellSize.y+g.m_Spacing.y),g.m_CellSize.x,g.m_CellSize.y];}
const ORDERS=['level','join','hp','atk'];
export function originalTeamSortedMonsters({game,species,monsterStats,order='level'}){order=ORDERS.includes(order)?order:'level';const indexed=game.monsters.map((m,index)=>({m,index,stats:monsterStats?.(game,m)||{hp:0,atk:0},dex:speciesFor(species,m)?.dex||0}));indexed.sort((a,b)=>{const primary=order==='join'?Number(b.m.joinTime??b.m.timeTicks??b.index)-Number(a.m.joinTime??a.m.timeTicks??a.index):order==='level'?b.m.level-a.m.level:b.stats[order]-a.stats[order];return primary||a.dex-b.dex||a.index-b.index;});return indexed.map(r=>r.m);}
function inventory({game,selected,species,monsterStats,page=0,order='level'}){
 const list=originalTeamSortedMonsters({game,species,monsterStats,order}),total=Math.max(1,Math.ceil(list.length/20));
 page=Math.max(0,Math.min(page,total-1));let html='';
 list.slice(page*20,page*20+20).forEach((m,i)=>{const b=originalTeamGridCell(i),dx=b[0]-1020,dy=b[1]-465,chosen=m.uid===selected,inTeam=game.team.includes(m.uid),prefix='Canvas/custom_team_all/monster_all/cell_monster/';
  const variant=chosen?'button_G':inTeam?'button_R':'button_B';
  for(const r of L.filter(r=>r.path.startsWith(prefix+variant)&&r.images.length))html+=art(r,dx,dy);
  html+=portrait(m,[b[0]+25,b[1]+10,100,100],species);
  if(chosen)html+=art(L.find(r=>r.path===prefix+'icon/select_check'),dx,dy);
  html+=text(527,`Lv. ${m.level}`,{dx,dy});
  html+=`<button type="button" draggable="true" data-team-remove-target="true" data-drag-monster="${esc(m.uid)}" data-select="${esc(m.uid)}" data-team-toggle="${esc(m.uid)}" class="native-team-hit native-team-cell${chosen?' selected':''}" style="${rect(b)}" aria-label="${esc(speciesFor(species,m)?.name||m.name||m.speciesId)} Lv.${m.level}${inTeam?' 队伍成员':''}" title="拖到队伍槽位；双击或按 Enter 加入／移出队伍"></button>`;
 });
 html+=art(byID(485))+art(byID(498))+art(byID(534))+art(byID(474));
 html+=hit(485,'data-team-page="-1"','上一页')+hit(534,'data-team-page="1"','下一页');
 const g=SOURCE.grids.find(g=>g.id===769),width=total*20+(total-1)*10,start=g.visibleBounds[0]+(g.visibleBounds[2]-width)/2;
 for(let i=0;i<total;i++){const r=L.find(r=>r.path==='Canvas/custom_team_all/monster_all/page_scroll/dot');if(r)html+=`<span class="native-team-page-dot ${i===page?'current':''}" style="${rect([start+i*30,990,20,20])};background-image:url('${r.images[0]?.src||''}')"></span>`;}
 return{html,page,total};
}
export function nativeTeamPokemonStatus({game,monster:m,species,monsterStats,expProgress}){
 const get=p=>STATUS.nodes.find(r=>r.path==='pokemon_status/pokemon_status/'+p),label=(p,v)=>{const r=get(p);return text(r?.id,v,{node:r});},s=speciesFor(species,m),stats=monsterStats?.(game,m)||{hp:0,atk:0};
 let html='';
 for(const p of ['background_name_all','button_general','button_general/Lv_window','button_general/HP/window','button_general/ATK/window','button_general/HP/text_window','button_general/ATK/text_window','button_general/HP/icon','button_general/ATK/icon','button_general/static/monster_name_line','button_general/level_slider/Background','button_general/level_slider/waku'])html+=art(get(p));
 html+=portrait(m,get('button_general/pokemon_icon/monster_icon').visibleBounds,species)+label('button_general/static/monster_name',m.nickname||m.name||s?.name)+label('button_general/Lv','Lv.')+label('button_general/level_count',m.level)+label('button_general/HP/text','HP')+label('button_general/ATK/text','ATK')+label('button_general/HP/counter',stats.hp.toLocaleString())+label('button_general/ATK/counter',stats.atk.toLocaleString());
 const typeNames=['一般','格斗','飞行','毒','地面','岩石','虫','幽灵','钢','火','水','草','电','超能力','冰','龙','恶','妖精'];
 (s?.types||[]).slice(0,2).forEach((name,i)=>{const id=typeNames.indexOf(name),r=get('button_general/type/'+(i?'B':'A'));if(id<0)return;const im=r.images[0];html+=art({...r,images:[{...im,src:`assets/original/ui-tinted/team_status_type_${id}.png`}]});});
 const ranged=m.skillRangeType!=null?m.skillRangeType===1:!!s?.range,icon=get('button_general/basic');html+=`<img class="native-team-art" style="${rect(icon.visibleBounds)}" src="${STATUS.icons[ranged?'button_basic_range':'button_basic_melee']}" alt="${ranged?'远距离型':'近距离型'}">`;
 if(m.shiny)html+=art(get('button_general/rare_icon'));
 const progress=expProgress?.(m);if(Number.isFinite(progress)){const r=get('button_general/level_slider/Background'),b=r.visibleBounds,p=Math.max(0,Math.min(1,progress)),src=get('button_general/level_slider/Fill Area/Fill').images[0].src;html+=`<span class="native-team-exp-fill" style="${rect([b[0],b[1],b[2]*p,b[3]])}background:url('${src}') center/100% 100% no-repeat"></span>`;}
 const r=get('button_general/button_hit_range');html+=`<button class="native-team-hit" data-monster="${esc(m.uid)}" style="${rect(r.visibleBounds)}" aria-label="查看${esc(s?.name)}详情"></button>`;
 return html;
}
/** Source geometry at 1280×720. Existing global app click/drag handlers retain save ownership. */
export function nativeTeamUI({game,selected,species,teamPower,monsterStats,expProgress,page,order='level'}){
 order=ORDERS.includes(order)?order:'level';
 const m=game.monsters.find(m=>m.uid===selected),selectedIndex=originalTeamSortedMonsters({game,species,monsterStats,order}).findIndex(m=>m.uid===selected);
 page=page??Math.max(0,Math.floor(selectedIndex/20));
 const grid=inventory({game,selected,species,monsterStats,page,order});
 let html=`<section class="native-team-ui" data-team-page-index="${grid.page}" data-team-pages="${grid.total}" data-team-order="${order}" aria-label="队伍组建">`;
 html+=art(byID(430))+art(byID(445))+art(byID(406))+art(byID(417));
 html+=`<canvas id="team-art" width="720" height="650" style="${rect([70,180,720,650])}" aria-label="原版队伍三维视图"></canvas>`;
 for(const id of [416,431,442,451,462,391,432,382,421,460,450,389,422,427,379,401,458,428,384,395,435,436,415,414])html+=art(byID(id));
 if(!m)html+=art(byID(383))+art(byID(377))+text(397,message(23))+text(402,message(24));
 html+=text(461,message(21))+text(399,message(23))+text(408,'TEAM POWER')+text(447,typeof teamPower==='function'?teamPower(game):teamPower)+text(381,game.monsters.length)+text(456,game.boxCapacity?.monsters??20)+text(396,'特训')+text(410,message(9+ORDERS.indexOf(order)));
 const slots=[[0,508,488,531],[1,510,489,532],[2,509,487,530]];
 for(const[i,cell,icon,name]of slots){const member=game.monsters.find(m=>m.uid===game.team[i]),letter='ABC'[i];for(const r of L.filter(r=>r.path.startsWith('Canvas/custom_team_all/battle_member/member'+letter)&&r.images.length).sort((a,b)=>a.path.split('/').length-b.path.split('/').length))html+=art(r);if(member){html+=portrait(member,byID(icon).visibleBounds,species)+text(name,`Lv. ${member.level}`);}html+=hit(cell,`data-team-slot="${i}"${member?` data-select="${esc(member.uid)}" data-team-toggle="${esc(member.uid)}"`:''}`,member?speciesFor(species,member)?.name||'队伍成员':'空队伍槽位');}
 html+=`<span class="native-team-remove-target" data-team-remove-target="true" style="${rect(SOURCE.grids.find(g=>g.id===731).visibleBounds)}" aria-hidden="true"></span>`;
 html+=grid.html+hit(401,'data-view="train"','特训')+hit(428,'data-view="camp"','返回基地')+hit(432,'data-view="camp"','返回基地')+hit(379,'data-team-sort="true"','排序');
 if(m){html+=nativeTeamPokemonStatus({game,monster:m,species,monsterStats,expProgress});for(const r of L.filter(r=>r.path.startsWith('Canvas/custom_team_all/status/charm_button')&&r.images.length).sort((a,b)=>a.path.split('/').length-b.path.split('/').length))html+=art(r);html+=text(457,message(25))+hit(463,`data-monster="${esc(m.uid)}"`,'P坠子／伙伴详情');}
 return html+'</section>';
}
/** Local presentation state only. onRender must replace UI and repaint portraits; onToggle uses engine transaction. */
export function bindNativeTeamUI(root,{onRender,onToggle}={}){
 const section=root.matches?.('.native-team-ui')?root:root.querySelector('.native-team-ui');if(!section)return()=>{};
 const click=e=>{const member=e.target.closest('[data-team-toggle]');if(member&&section.contains(member)){const uid=member.dataset.teamToggle,time=Date.now();if(lastToggleClick.uid===uid&&time-lastToggleClick.time<400){lastToggleClick={uid:null,time:0};onToggle?.(uid);}else lastToggleClick={uid,time};}const button=e.target.closest('[data-team-page],[data-team-sort]');if(!button||!section.contains(button))return;const current=Number(section.dataset.teamPageIndex),total=Number(section.dataset.teamPages);onRender?.({page:button.dataset.teamPage?Math.max(0,Math.min(total-1,current+Number(button.dataset.teamPage))):0,order:button.dataset.teamSort?ORDERS[(ORDERS.indexOf(section.dataset.teamOrder)+1)%4]:section.dataset.teamOrder});};
 const key=e=>{if(e.key==='Enter'&&e.target.matches('[data-team-toggle]')){e.preventDefault();onToggle?.(e.target.dataset.teamToggle);}};
 section.addEventListener('click',click);section.addEventListener('keydown',key);
 return()=>{section.removeEventListener('click',click);section.removeEventListener('keydown',key);};
}
