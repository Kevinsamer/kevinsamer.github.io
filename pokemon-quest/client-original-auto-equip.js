/** Verified ARM scoring kernel. Callers supply source-decoded, source-ordered lists. */
export const SOURCE_AUTO_EQUIP_UI = Object.freeze({
 button: 'autoSetButton', reset: 'resetButton', hasTypePicker: false,
 passes: [0, 1, 2], slotTypes: [1, 0, 2], fillsEmptySlotsOnly: true,
 candidateExtractionRecovered: true,
});
const f = Math.fround;
export function originalAutoCalculateValue(base, flat1 = 0, flat2 = 0, percent1 = 0, percent2 = 0) {
 const flat = f(f(f(base) + f(flat1)) + f(flat2));
 const multiplier = Math.max(0, f(f(f(1) + f(percent1)) + f(percent2)));
 return f(flat * multiplier);
}
/** Flat entries are accumulated BEFORE percent entries, as in 0x836b94–0x836e38.
 * Keep input order: equal scores retain dictionary insertion order.
 */
export function originalAutoStoneScores({base = 0, plusValueEntries = [], plusPercentEntries = [], usedIDs = []}) {
 const used = new Set(usedIDs), scores = new Map();
 for (const {storageID, value} of plusValueEntries) {
  if (used.has(storageID)) continue;
  const score = originalAutoCalculateValue(base, value);
  scores.set(storageID, f((scores.get(storageID) ?? 0) + score));
 }
 for (const {storageID, value} of plusPercentEntries) {
  if (used.has(storageID)) continue;
  scores.set(storageID, originalAutoCalculateValue(base, scores.get(storageID) ?? 0, 0, value));
 }
 return [...scores].map(([storageID, score]) => ({storageID, score})).sort((a,b) => b.score-a.score);
}
export function originalAutoSlotEligible(slot, autoSetType) {
 return !!slot.enabled && (slot.storageID === -1 || slot.storageID === 65535)
  && slot.type === SOURCE_AUTO_EQUIP_UI.slotTypes[autoSetType];
}
/** Inner scoring pass; the source candidate and scratch adapters below supply
 * decoded potential commands and Parameter.ApplyPotential inputs.
 */
export function originalAutoEquipPass({slots, autoSetType, baseHP, baseAttack, plusValueEntries, plusPercentEntries, usedIDs = []}) {
 if (![0,1,2].includes(autoSetType)) throw new RangeError('Unknown source AutoSetType');
 const used = new Set(usedIDs), assignments = [];
 const base = autoSetType === 0 ? baseHP : autoSetType === 1 ? baseAttack : 0;
 for (let slotIndex=0; slotIndex<slots.length; slotIndex++) {
  if (!originalAutoSlotEligible(slots[slotIndex], autoSetType)) continue;
  const best = originalAutoStoneScores({base, plusValueEntries, plusPercentEntries, usedIDs:[...used]})[0];
  if (!best) continue;
  used.add(best.storageID); assignments.push({slotIndex, ...best});
 }
 return {assignments, usedIDs:[...used]};
}
/** Source deliberately starts a second OrderByDescending, not ThenBy.
 * The stable second sort makes commandCount primary, rank a tie-breaker.
 */
export function originalAutoCandidateOrder(candidates) {
 return [...candidates].sort((a,b)=>b.rank-a.rank).sort((a,b)=>b.commandCount-a.commandCount);
}
/** GetValue on the eight source HP/Attack classes returns stored value directly;
 * flat classes convert signed int to float32, percent classes return float32.
 * rank is stored separately and does not multiply command value here.
 */
export function originalAutoCommandValue(command) {
 return f(command.kind.includes('Percent') ? command.value : Math.trunc(f(command.value)));
}
export function originalAutoBuildLists({candidates, autoSetType, pokemonTypes}) {
 const flat = new Map(), percent = new Map();
 const eligible = candidates.filter(c=>!c.attached && c.potentialType===0)
  .map(c=>({...c,commandCount:c.commands.length}));
 for(const candidate of originalAutoCandidateOrder(eligible)) {
  for(const command of candidate.commands) {
   const match = /^ParameterCommand_(Hp|Attack)(Value|Percent)(Type)?$/.exec(command.kind);
   if(!match) continue;
   if(match[1]==='Hp' && autoSetType!==0 && autoSetType!==2) continue;
   if(match[1]==='Attack' && autoSetType!==1 && autoSetType!==2) continue;
   if(match[3] && !pokemonTypes.includes(command.pokeType)) continue;
   const table=match[2]==='Value'?flat:percent;
   table.set(candidate.storageID, f((table.get(candidate.storageID)??0)+originalAutoCommandValue(command)));
  }
 }
 const entries=table=>[...table].map(([storageID,value])=>({storageID,value})).sort((a,b)=>b.value-a.value);
 return {plusValueEntries:entries(flat),plusPercentEntries:entries(percent)};
}
/** Parameter constructor: saved initial + species growth * level (ARM MLA),
 * clamp 25..9999. ApplyPotential adds flat terms, then additive percentages,
 * truncates float32 result to int and clamps again. Type1==Type2 counts once.
 */
export function originalAutoScratchBase({savedHP,savedAttack,hpGrow,attackGrow,level,normal={},typeParameters={},pokemonTypes=[],additional=[]}) {
 const clamp=v=>Math.max(25,Math.min(9999,v));
 const basisHP=clamp((savedHP|0)+Math.imul(hpGrow|0,level|0));
 const basisAttack=clamp((savedAttack|0)+Math.imul(attackGrow|0,level|0));
 let hp=(basisHP+(normal.hpValue??0))|0, attack=(basisAttack+(normal.attackValue??0))|0;
 let hpMultiplier=f(1+f(normal.hpPercent??0)), attackMultiplier=f(1+f(normal.attackPercent??0));
 for(const type of [...new Set(pokemonTypes)]) {
  const p=typeParameters[type]??{};
  hp=(hp+(p.hpValue??0))|0; attack=(attack+(p.attackValue??0))|0;
  hpMultiplier=f(hpMultiplier+f(p.hpPercent??0));attackMultiplier=f(attackMultiplier+f(p.attackPercent??0));
 }
 for(const p of additional) {
  hp=(hp+(p.hpValue??0))|0;attack=(attack+(p.attackValue??0))|0;
  hpMultiplier=f(hpMultiplier+f(p.hpPercent??0));attackMultiplier=f(attackMultiplier+f(p.attackPercent??0));
 }
 return {baseHP:clamp(Math.trunc(f(f(hp)*hpMultiplier))),baseAttack:clamp(Math.trunc(f(f(attack)*attackMultiplier)))};
}
/** Reviewable assignment plan. getScratchBase is called for each original pass,
 * with virtual slots including earlier assignments; no game state is mutated.
 */
export function originalAutoEquipPlan({slots,candidates,pokemonTypes,getScratchBase}) {
 const working=slots.map(s=>({...s})),assignments=[],passes=[];
 for(const autoSetType of [0,1,2]) {
  const lists=originalAutoBuildLists({candidates:candidates.map(c=>({...c,attached:c.attached||assignments.some(a=>a.storageID===c.storageID)})),autoSetType,pokemonTypes});
  const scratch=getScratchBase(working.map(s=>({...s})),autoSetType);
  const pass=originalAutoEquipPass({slots:working,autoSetType,...scratch,...lists});
  for(const a of pass.assignments) {working[a.slotIndex].storageID=a.storageID;assignments.push({...a,autoSetType});}
  passes.push({autoSetType,...scratch,assignments:pass.assignments});
 }
 return {assignments,slots:working,passes};
}
export const SOURCE_TO_LEGACY_AUTO_SLOT = Object.freeze([6,7,8,2,0,1,3,4,5]);
const SOURCE_AUTO_COMMAND_KINDS = {0:'AttackValue',1:'AttackPercent',2:'HpValue',3:'HpPercent',15:'AttackValueType',16:'AttackPercentType',17:'HpValueType',18:'HpPercentType'};
/** New saved stone contract: source.header plus source.commands preserves every
 * sampled command, its order and params, even when bonuses share a UI label.
 */
export function originalAutoStoneCandidate(stone,{attached=false}={}) {
 const source=stone.source;
 if(source?.header && Array.isArray(source.commands)) {
  return {storageID:stone.id,attached,rank:source.header.rank,potentialType:source.header.potentialType,
   fidelity:'source',commands:source.commands.map(c=>({kind:SOURCE_AUTO_COMMAND_KINDS[c.commandID]?'ParameterCommand_'+SOURCE_AUTO_COMMAND_KINDS[c.commandID]:'Unsupported_'+c.commandID,
    value:c.params[0],pokeType:c.params[1],commandID:c.commandID}))};
 }
 const primary={kind:'ParameterCommand_'+(stone.kind==='hp'?'HpValue':'AttackValue'),value:stone.value};
 // Only legacy primary scoring is available. Dummy entries preserve observable
 // bonus key count as a fallback; the original multiplicity/rank cannot be recovered.
 return {storageID:stone.id,attached,rank:0,potentialType:0,fidelity:'legacy',commands:[primary,...Object.keys(stone.bonus??{}).map(k=>({kind:'LegacyBonus_'+k,value:0}))]};
}
/** Legacy-compatible Web plan; source-header stones retain original sorting.
 * species is the current SPECIES entry, isSlotUnlocked/activeBingoCount are caller
 * verified source slot/bingo calculations. This function never mutates game.
 */
export function originalAutoGamePlan({game,monster,species,isSlotUnlocked,enabledSlots,activeBingoCount}) {
 if(!isSlotUnlocked && !enabledSlots) throw new TypeError("Supply source slot unlock callback or enabledSlots; slots are not a prefix");
 const attached=new Set(game.monsters.flatMap(m=>m.slots).filter(id=>id!=null));
 const candidates=game.stones.map(s=>originalAutoStoneCandidate(s,{attached:attached.has(s.id)}));
 const flags=[];
 if(candidates.some(c=>c.fidelity==='legacy')) flags.push('legacy rank unavailable; original command multiplicity unavailable');
 const slots=monster.slots.map((id,i)=>({enabled:isSlotUnlocked?!!isSlotUnlocked(monster,i):!!enabledSlots[i],storageID:id??-1,type:{atk:0,hp:1,both:2}[monster.slotKinds[i]]}));
 const base={savedHP:species.hp+monster.ivHp+monster.potBonus,savedAttack:species.atk+monster.ivAtk+monster.potBonus,
  hpGrow:species.client.m_hpGrow,attackGrow:species.client.m_attackGrow,level:monster.level};
 const getScratchBase=virtualSlots=>{
  const normal={hpValue:0,attackValue:0,hpPercent:0,attackPercent:0},typeParameters={};
  for(const slot of virtualSlots) {
   const stone=game.stones.find(s=>s.id===slot.storageID);if(!stone) continue;
   const candidate=originalAutoStoneCandidate(stone);
   for(const command of candidate.commands) {
    const match=/^ParameterCommand_(Hp|Attack)(Value|Percent)(Type)?$/.exec(command.kind);
    if(!match)continue;
    const target=match[3]?(typeParameters[command.pokeType]??={hpValue:0,attackValue:0,hpPercent:0,attackPercent:0}):normal;
    const key=(match[1]==='Hp'?'hp':'attack')+match[2];
    target[key]=match[2]==='Percent'?f(target[key]+originalAutoCommandValue(command)):target[key]+originalAutoCommandValue(command);
   }
  }
  const virtualMonster={...monster,slots:virtualSlots.map(s=>s.storageID===-1?null:s.storageID)};
  const count=activeBingoCount(virtualMonster);
  for(const text of (monster.bingo??[]).slice(0,count)) {
   const match=/^(HP|ATK) \+(\d+)(%)?$/.exec(text);if(!match)continue;
   const key=(match[1]==='HP'?'hp':'attack')+(match[3]?'Percent':'Value');
   normal[key]=match[3]?f(normal[key]+f(Number(match[2])/100)):normal[key]+Number(match[2]);
  }
  return originalAutoScratchBase({...base,normal,typeParameters,pokemonTypes:[species.client.m_type1,species.client.m_type2]});
 };
 flags.push('Web bingo label adapter; source additional terms not represented');
 const order=slots.length===9?SOURCE_TO_LEGACY_AUTO_SLOT:slots.map((_,i)=>i);
 const toLegacy=canonical=>{const legacy=[];canonical.forEach((slot,i)=>legacy[order[i]]=slot);return legacy;};
 const plan=originalAutoEquipPlan({slots:order.map(i=>slots[i]),candidates,pokemonTypes:[species.client.m_type1,species.client.m_type2],getScratchBase:canonical=>getScratchBase(toLegacy(canonical))});
 const remap=a=>({...a,sourceSlotIndex:a.slotIndex,slotIndex:order[a.slotIndex]});
 return {...plan,assignments:plan.assignments.map(remap),slots:toLegacy(plan.slots),passes:plan.passes.map(p=>({...p,assignments:p.assignments.map(remap)})),fidelityFlags:flags};
}
