import {pokemon} from './client-rules.js';
/** Native callback follows Unity integer Random.Range(minInclusive,maxExclusive).
 * Default Math.random adapter reproduces ranges/distribution, not Unity PRNG.
 */
export function originalRecruitIntegerRange(min,max,rng=Math.random){return min+Math.min(max-min-1,Math.floor(rng()*(max-min)));}
export function originalLotterySkillSlotIndex(occupiedSlots,range=(min,max)=>originalRecruitIntegerRange(min,max)) {
 const free=[0,1,2,3].filter(slot=>!occupiedSlots.includes(slot));
 if(!free.length)return -1;
 if(!occupiedSlots.length)return 0;
 const maxExisting=Math.max(...occupiedSlots);
 const candidates=free.filter(slot=>slot>maxExisting);
 if(!candidates.length)return -1; // Web fail-safe; native First on empty throws.
 return candidates.map(slot=>({slot,key:range(-2147483648,2147483647)})).sort((a,b)=>a.key-b.key)[0].slot;
}
/** Full initial LotterySkillIDs flow, preserving allocation before chance RNG.
 * Successful slots are returned alongside IDs; no PRNG state equivalence claim.
 */
export function originalLotteryInitialSkillLayout(dex,{rng=Math.random,range=(min,max)=>originalRecruitIntegerRange(min,max,rng)}={}) {
 const data=pokemon[dex];if(!data)throw new RangeError('Unknown client species');
 const legal=data.m_skillIDs.filter(id=>id!==65535),moves=[],skillSlotIndices=[],trace=[];
 for(const probability of [100,50]) {
  const slot=originalLotterySkillSlotIndex(skillSlotIndices,(min,max)=>{const value=range(min,max);trace.push({kind:'slotKey',min,max,value});return value;});
  if(slot<0)continue;
  const available=legal.filter(id=>!moves.includes(id));
  if(!available.length)continue;
  const chance=range(0,100);trace.push({kind:'chance',min:0,max:100,value:chance,probability});
  if(chance>=probability)continue;
  const index=range(0,available.length);trace.push({kind:'move',min:0,max:available.length,value:index});
  moves.push(available[index]);skillSlotIndices.push(slot);
 }
 return {moves,skillIDs:moves,skillSlotIndices,trace};
}
/** Drop-in plan companion to legacy clientLotteryInitialSkills(dex,rng). */
export function clientLotteryInitialSkillPlan(dex,rng=Math.random){return originalLotteryInitialSkillLayout(dex,{rng});}
