/** Starter actors are world objects in SelectPokemonSequence, not UI cards.
 * The parent renderer supplies their camera projection in canvas pixels. */
export const STARTER_WORLD_POINTS=[[0,0,41],[-9,0,36],[10,0,46],[2,0,51],[-10,0,45]];
export function nativeStarterUI({starters,selected,species,portrait,project}){
 return `<section class="native-starter-screen" aria-label="选择伙伴">${starters.map((id,i)=>{const s=species(id),point=STARTER_WORLD_POINTS[i],p=project?.(...point)||[640,360];return `<button class="native-starter-actor ${id===selected?'selected':''}" data-starter="${id}" data-starter-point="${i}" aria-label="${s.name}" style="left:${p[0]}px;top:${p[1]}px">${portrait(s)}</button>`}).join('')}<div class="native-starter-message"><button class="native-starter-confirm" data-action="choose-starter" aria-label="选择 ${species(selected).name} 成为伙伴">和它们成为伙伴，让它们带我们探险怎么样？<span class="native-starter-current">${species(selected).name}</span></button></div></section>`;
}
export function placeStarterActors(project,root=document){root.querySelectorAll('[data-starter-point]').forEach(el=>{const p=project(...STARTER_WORLD_POINTS[+el.dataset.starterPoint]);if(p){el.style.left=p[0]+'px';el.style.top=p[1]+'px';}})}
