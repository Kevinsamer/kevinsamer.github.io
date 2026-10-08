import {pokemon,cookWeights,cookRecipes,potVolumes,visit} from './client-rules.js';

const recipeIds=['mulligan','red','blue','yellow','gray','water','normal','poison','ground','grass','bug','psychic','rock','flying','fire','electric','fighting','legend'];
const qualities={'普通':0,'好':1,'非常好':2,'极致':3,basic:0,good:1,very_good:2,special:3};
const potIds=['normal','bronze','silver','gold'];
const integerRoll=(max,rng)=>Math.min(max-1,Math.floor(rng()*max));

// PokemonCookData.GetRatio 0x74e45c maps quality 0..3 to rare1..4.
// Visit.LotteryCore 0x672454..0x672614 builds this integer-weight lottery.
// Pot volume is absent from this weighting path: it controls recruit level.
export function clientRecruitWeights(recipeId,quality=0){
  const recipe=typeof recipeId==='object'?recipeId:cookRecipes[typeof recipeId==='number'?recipeId:recipeIds.indexOf(recipeId)];
  if(!recipe)throw new RangeError('Unknown client recipe');
  const rarity=typeof quality==='number'?quality:qualities[quality];
  if(!Number.isInteger(rarity)||rarity<0||rarity>3)throw new RangeError('Unknown client cooking quality');
  return pokemon.slice(1,152).map(p=>{
    const rarityWeight=cookWeights[p.m_cookTableID]?.['m_rare'+(rarity+1)+'_ratio']||0;
    let base=0;
    if(recipe.m_pokeType===0)base=p.m_cookAllWeight;
    // The actual color branch loads +0x30, the SAME cookTypeWeight as
    // the type branch. Getter get_cookColorWeight is +0x2c and is not read.
    // Preserve this verified client behavior instead of substituting the
    // tempting, differently named cookColorWeight field.
    if(recipe.m_pokeType===1&&p.m_color===recipe.m_pokeTypeValue)base=p.m_cookTypeWeight;
    if(recipe.m_pokeType===2&&(p.m_type1===recipe.m_pokeTypeValue||p.m_type2===recipe.m_pokeTypeValue))base=p.m_cookTypeWeight;
    if(recipe.m_pokeType===3)base=p.m_cookLegendWeight;
    return {dex:p.m_monsterNo,weight:Math.imul(base,rarityWeight),baseWeight:base,rarityWeight};
  }).filter(v=>v.weight>0);
}

export function clientLotteryRecruit(recipeId,quality=0,rng=Math.random){
  const candidates=clientRecruitWeights(recipeId,quality),total=candidates.reduce((n,v)=>n+v.weight,0);
  if(!total)return null;
  let roll=integerRoll(total,rng);
  for(const candidate of candidates){roll-=candidate.weight;if(roll<0)return candidate.dex}
  return null;
}

// VisitParameter.LotteryLevelCook 0x672b54: integer Range(min,max+1),
// then clamp to 1..100. Roll independently for each recruited creature.
export function clientLotteryRecruitLevel(potId='normal',rng=Math.random){
  const index=typeof potId==='number'?potId:potIds.indexOf(potId),pot=potVolumes[index];
  if(!pot)throw new RangeError('Unknown client pot');
  return Math.max(1,Math.min(100,pot.m_pokeLevelMin+integerRoll(pot.m_pokeLevelMax-pot.m_pokeLevelMin+1,rng)));
}

// CalculateLotteryVisitNumWeight 0x674bfc leaves the one-visitor weight
// untouched; all later weights multiply the goods coefficient, then truncate.
export function clientLotteryRecruitCount(multiplier=1,rng=Math.random){
  const weights=visit.m_CookPokeNumWeights.map((weight,i)=>i?Math.trunc(Math.fround(weight*Math.fround(multiplier))):weight);
  let roll=integerRoll(weights.reduce((n,v)=>n+v,0),rng);
  for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<0)return Math.min(visit.m_CookPokeNumMax,visit.m_CookPokeNumMin+i)}
  return visit.m_CookPokeNumMin;
}

// FixInitialSpec 0x8c2770: Range(0,25) when seikaku is the random sentinel.
export function clientLotteryNature(rng=Math.random){return integerRoll(25,rng)}

// LotterySkillIDs 0x651194 requests one move with 100%, then one with 50%.
// LotterySkillID 0x65152c chooses uniformly from legal, not-yet-known IDs;
// predicate 0x871ecc rejects 65535 and known moves. Slot allocation consumes
// additional random numbers; this reproduces the distribution, not RNG state.
export function clientLotteryInitialSkills(dex,rng=Math.random){
  const species=pokemon[dex];if(!species)throw new RangeError('Unknown client species');
  const available=species.m_skillIDs.filter(id=>id!==65535),result=[];
  if(!available.length)return result;
  result.push(available[integerRoll(available.length,rng)]);
  const remaining=available.filter(id=>!result.includes(id));
  if(remaining.length&&integerRoll(100,rng)<50)result.push(remaining[integerRoll(remaining.length,rng)]);
  return result;
}

// PokemonData.LotterySlotPropertyType 0x74e6b8 builds weights in ATK, HP,
// MULTI order. Only MULTI receives the goods coefficient and float32 truncation.
export function clientLotterySlotKind(dex,multiMultiplier=1,rng=Math.random){
  const p=pokemon[dex];if(!p)throw new RangeError('Unknown client species');
  const weights=[p.m_slotTypeWeightAttack,p.m_slotTypeWeightHp,Math.trunc(Math.fround(p.m_slotTypeWeightMulti*Math.fround(multiMultiplier)))];
  let roll=integerRoll(weights.reduce((n,v)=>n+v,0),rng);
  for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<0)return ['atk','hp','both'][i]}
  return 'atk';
}

// FixInitialSpec 0x8c2a9c compares an integer 0..99 to m_meleePercent.
export function clientLotteryRangedAttack(dex,rng=Math.random){
  const p=pokemon[dex];if(!p)throw new RangeError('Unknown client species');
  return integerRoll(100,rng)>=p.m_meleePercent;
}
