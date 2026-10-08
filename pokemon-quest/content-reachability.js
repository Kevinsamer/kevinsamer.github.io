import {SPECIES,STARTERS,INGREDIENTS,RECIPES,identifyRecipe} from './engine.js';
import {clientRecruitWeights} from './client-recruit-rules.js';
import {originalTimeVisitorWeights} from './client-time-visitor-rules.js';
import {PACK_POKEMON} from './client-offline-packs.js';
export function contentReachability(){
 const combos=[],recipes=new Map();function walk(start,ids){if(ids.length===5){const info=identifyRecipe(ids),key=`${info.recipe.id}:${info.rarity}`;combos.push(ids);const row=recipes.get(key)||{recipeId:info.recipe.id,rarity:info.rarity,count:0,example:ids};row.count++;recipes.set(key,row);return;}for(let i=start;i<INGREDIENTS.length;i++)walk(i,[...ids,INGREDIENTS[i].id]);}walk(0,[]);
 const routes=new Map(),add=(dex,route)=>{if(!routes.has(dex))routes.set(dex,[]);routes.get(dex).push(route);};
 for(const row of recipes.values()){row.recruits=clientRecruitWeights(row.recipeId,row.rarity).filter(p=>p.weight>0);for(const p of row.recruits)add(p.dex,{source:'cook',recipeId:row.recipeId,rarity:row.rarity,weight:p.weight,ingredients:row.example});}
 for(const p of originalTimeVisitorWeights())if(p.weight>0)add(p.dex,{source:'visitor-default',weight:p.weight});
 for(const p of originalTimeVisitorWeights(Object.fromEntries(SPECIES.map(s=>[s.dex,true]))))if(p.weight>0)add(p.dex,{source:'visitor-after-defeat',weight:p.weight,conditional:true});
 for(const id of STARTERS)add(SPECIES.find(s=>s.id===id).dex,{source:'starter'});for(const p of PACK_POKEMON)add(p.m_monsterNo,{source:'pack'});
 const unconditional=new Set([...routes].filter(([,r])=>r.some(x=>!x.conditional)).map(([dex])=>dex));let changed=true;while(changed){changed=false;for(const s of SPECIES)if(s.evolveFrom){const parent=SPECIES.find(p=>p.id===s.evolveFrom);if(unconditional.has(parent.dex)&&!unconditional.has(s.dex)){unconditional.add(s.dex);add(s.dex,{source:'evolution',from:parent.dex,level:s.evolveLevel});changed=true;}}}
 const eevee=SPECIES.find(s=>s.id==='eevee');if(unconditional.has(eevee.dex))for(const [id,condition]of [['vaporeon','hp>atk'],['jolteon','hp=atk'],['flareon','atk>hp']]){const s=SPECIES.find(s=>s.id===id);unconditional.add(s.dex);add(s.dex,{source:'eevee-runtime-evolution',from:eevee.dex,level:36,condition});}
 return{combinations:combos.length,recipeTiers:[...recipes.values()],routes:Object.fromEntries(routes),reachable:[...unconditional].sort((a,b)=>a-b),missing:SPECIES.filter(s=>!unconditional.has(s.dex)).map(s=>({dex:s.dex,id:s.id}))};
}
