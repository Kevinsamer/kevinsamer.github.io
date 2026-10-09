import {CLIENT_TRAINING_UI_LAYOUT as L} from './client-training-ui-layout.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const node=p=>L.nodes.find(n=>n.path===p),s=L.scale;
const rect=n=>`left:${n.bounds[0]*s}px;top:${n.bounds[1]*s}px;width:${n.bounds[2]*s}px;height:${n.bounds[3]*s}px;`;
function art(p){const n=node(p);return n?n.images.map(im=>`<span class="native-training-art" style="${rect(n)}${im.imageType===1?`border:solid transparent;border-width:${im.slices.map(v=>v*s+'px').join(' ')};border-image:url('${im.src}') ${im.slices.join(' ')} fill stretch;`:`background:url('${im.src}') center/100% 100% no-repeat;`}"></span>`).join(''):'';}
const text=(p,v)=>{const n=node(p);return n?`<span class="native-training-text" style="${rect(n)}font-size:${(n.texts[0]?.fontSize||30)*s}px">${esc(v)}</span>`:'';};
const hit=(p,attrs,label,disabled=false)=>`<button class="native-training-hit" style="${rect(node(p))}" ${attrs} aria-label="${esc(label)}" ${disabled?'disabled':''}></button>`;
export function nativeTrainingUI({game,monster,mode='level',moveIndex=0,supports=[],species,moveName,portrait,expProgress,monsterStats}){
 const sp=id=>typeof species==='function'?species(id):species.find?.(x=>x.id===id)||species[id];
 const face=m=>portrait({...sp(m.speciesId),shiny:m.shiny});
 const base='Canvas/tokkun_group/',right='Canvas/custom_team_all/';
 let h='<section class="native-training" aria-label="特训">'+art('Canvas_back_ground/background');
 for(const p of ['Canvas/title_group/back_black','Canvas/title_group/title_window','Canvas/title_group/title_window/icon_back','Canvas/title_group/title_window/waku',base+'background',right+'setumei_window/general_window/window',right+'monster_window/window_waku',base+'tokkun_pokemon/base_window',base+'tokkun_pokemon/title_window',base+'support_pokemon/base_window',base+'support_pokemon/title_window'])h+=art(p);
 h+=text('Canvas/title_group/title_window/Text','特训')+text(base+'tokkun_pokemon/Text','接受特训的伙伴')+text(base+'support_pokemon/Text','支持伙伴')+text(base+'Text','支持伙伴在特训后会离开');
 for(const [id,p,label]of [['level','levelUP_button','升级特训'],['move','skillChange_button','招式特训']])h+=art(base+p)+art(base+p+(id===mode?'/window_anim':'/window_base'))+text(base+p+'/Text',label)+hit(base+p,`data-train-mode="${id}" aria-pressed="${id===mode}"`,label);
 const target=base+'tokkun_pokemon/memberA';h+=art(target)+art(target+'/waku_naka')+art(target+'/waku');
 h+=`<div class="native-training-target">${face(monster)}</div>`+text(target+'/cell_team/Text',sp(monster.speciesId)?.name||monster.speciesId);
 h+=`<div class="native-training-summary"><strong>Lv. ${monster.level}</strong><span>${esc(sp(monster.speciesId)?.name||monster.speciesId)}</span>${mode==='level'?`<progress aria-label="当前等级经验" value="${Math.max(0,Math.min(1,expProgress?.(monster)||0))}" max="1"></progress><small>选择支持伙伴，获得经验并提升等级</small>`:'<small>选择需要更换的招式</small>'}</div>`;
 if(mode==='move')h+='<div class="native-training-moves" role="group" aria-label="选择要更换的招式">'+monster.moves.map((id,i)=>`<button data-train-move-index="${i}" aria-pressed="${i===moveIndex}">招式 ${i+1}：${esc(moveName(id))}</button>`).join('')+'</div>';
 for(let i=0;i<4;i++){const p=base+'support_pokemon/member'+String.fromCharCode(65+i)+'_waku',m=game.monsters.find(m=>m.uid===supports[i]);h+=art(p)+art(p+'/waku_naka')+art(p+'/waku');h+=`<button class="native-training-support" style="left:${(72+182*i)*s}px" data-support-remove="${i}" aria-label="${m?'移除支持伙伴 '+esc(sp(m.speciesId)?.name):'空支持槽 '+(i+1)}">${m?face(m)+`<small>Lv.${m.level}</small>`:'＋'}</button>`;}
 h+=art(base+'ok_button/button')+text(base+'ok_button/button/Text','特训开始')+hit(base+'ok_button/button','data-action="train"','特训开始',!supports.length);
 h+=`<button class="native-training-everstone" data-action="everstone" aria-pressed="${!!monster.everstone}">不变石 ${monster.everstone?'ON':'OFF'}</button>`;
 h+=`<div class="native-training-help"><strong>选择最多 4 只支持伙伴</strong><span>目标伙伴和探险队成员不能作为支持伙伴。</span><span>${mode==='move'?'招式可能改变，支持伙伴将消耗。':'获得经验后，达到等级的伙伴会进化。'}</span></div><div class="native-training-roster">`;
 for(const m of game.monsters){const disabled=m.uid===monster.uid||game.team.includes(m.uid),selected=supports.includes(m.uid);h+=`<button class="native-training-candidate ${selected?'is-selected':''}" data-support="${esc(m.uid)}" ${disabled?'disabled':''} aria-pressed="${selected}" aria-label="${esc(sp(m.speciesId)?.name)} Lv.${m.level}${disabled?'，不能作为支持伙伴':''}">${face(m)}<span>${esc(sp(m.speciesId)?.name)}</span><small>Lv.${m.level}${selected?' ✓':''}${disabled?' · 队伍中':''}</small></button>`;}
 h+='</div>'+art(right+'button_exit/allround_button')+hit(right+'button_exit/allround_button','data-view="team"','返回队伍编组')+'</section>';return h;
}
