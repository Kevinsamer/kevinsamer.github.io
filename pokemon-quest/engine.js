import {separateBattleBodies} from './battle-body-collision.js';
import {gameSaveTransaction} from './game-save-transaction.js';
import {migrateSourceStoneResistance} from './client-stone-resistance-migration.js';
import {originalTargetConditionMultiplier} from './client-condition-bingo.js';
import {originalLinkedConditionChance} from './client-linked-condition-probability.js';
import {applyObjectDamageEffect} from './client-object-damage-effect.js';
import {markExpeditionStarted,markExpeditionSettled,recoverInterruptedExpedition} from './expedition-recovery.js';
import {originalDittoBattlePlan} from './client-ditto-transform.js';
import {updateDailyVisitor,claimDailyVisitor as commitDailyVisitor} from './daily-visitor.js';
import {originalTimeVisitorClearLayerIndex} from './client-time-visitor-rules.js';
import {SOURCE_TO_GRID,growthTarget,slotCount,gridSlotActive,createGrowthSlots,restoreGrowthSlots,advanceGrowthSlots} from './client-growth-slots.js';
import {originalSelectBingo,originalEncodeBingoIndices,originalBingoTexts,originalMigrateBingoTexts} from './client-bingo-selection.js';
import {battleTargets,selectBattleTarget,applyAttentionTarget} from './battle-targeting.js';
import {createBattleDecoy,updateBattleDecoy,pruneBattleDecoys} from './battle-decoy.js';
import {canSpendTickets,spendTickets} from './offline-currency.js';
import {originalVisitRareColorPlan} from './client-rare-color.js';
import {createOriginalUnityRandom,createOriginalBattleSeedData,allocateOriginalEnemyDropSeeds} from './client-unity-random.js';
import {originalCreateSkillStonePlan,originalLotterySkillStoneGroup,SOURCE_SKILL_STONE_KINDS} from './client-skill-stone-lottery.js';
import {originalCreatePassiveStonePlan} from './client-potential-stone-lottery.js';
import {originalEnemyDropGroupPlan,originalDropItemWeights,originalLotteryDropItem,originalFixedDropDescription,originalStageDropItemRatio,originalLotteryDropRow,originalDropItemQuantity} from './client-drop-lottery.js';
import {clientLotteryInitialSkillPlan} from './client-recruit-skill-layout.js';
import {originalRecycleCountForHeader,originalRecycleMaterials} from './client-custommonster-stone-actions.js';
import {originalSkillStoneCapacities} from './client-skill-slot-layout.js';
import {originalBingoModelScalePercent} from './client-model-scale.js';
import {attemptOriginalEnemySpawnPosition,approximateUnitDiskSample,createOriginalSpawnTimer,tickOriginalSpawnTimer} from './native-enemy-spawn-position.js';
import {originalDamageMaterialMotion} from './client-actor-event-rules.js';
import {originalPlayerFormationOffsets,originalFormationNavigationBasis} from './native-player-formation.js';
import {clientBattleExperience,clientRecoveryTicketCost} from './client-battle-result.js';
import {createBattleNavigation} from './battle-navigation.js';
import {clientNormalAttack,finishClientNormalAttack} from './client-normal-attacks.js';
import {CLIENT_STARTERS} from './client-starter-data.js';
import {STAGE_DESCRIPTION_NAMES} from './client-stage-description-messages.js';
import {clientLotteryRecruit,clientLotteryRecruitLevel,clientLotteryRecruitCount,clientLotteryInitialSkills,clientLotteryNature,clientLotterySlotKind,clientLotteryRangedAttack} from './client-recruit-rules.js';
import {beginSkillExecution,tickSkillExecutions,getSkillProgram} from './skill-execution.js';
import {CLIENT_SKILL_PROGRAMS} from './client-skill-programs.js';
import {CLIENT_STAGES,clientStageVariants,clientSpawnInstructions} from './client-stages.js';
import * as CLIENT from './client-rules.js';
import {QUEST_REGIONS} from './stage-data.js';
import {SLOT_LEVELS,SPECIES_FACTS} from './species-facts.js';
import {QUEST_MOVES} from './moves-data.js';
import {SPECIES} from './data.js';
export {SPECIES};
export const STARTERS=['bulbasaur','charmander','squirtle','pikachu','eevee'];
export const INGREDIENTS=[['tiny-mushroom','小蘑菇','red',1,'soft','mushroom'],['bluk-berry','墨莓果','blue',1,'soft','sweet'],['apricorn','球果','yellow',1,'hard','plant'],['fossil','化石','gray',1,'hard','mineral'],['big-root','大根茎','red',2,'soft','plant'],['icy-rock','冰冷岩石','blue',2,'hard','mineral'],['honey','甜甜蜜','yellow',2,'soft','sweet'],['balm-mushroom','芳香蘑菇','gray',2,'soft','mushroom'],['rainbow-matter','彩虹素材','rainbow',3,'special','special'],['mystical-shell','神秘贝壳','shell',2,'special','special']].map(([id,name,color,quality,texture,category])=>({id,name,color,quality,texture,category}));
export const POTS=[{id:'normal',name:'普通锅',cost:3,minLevel:1,maxLevel:15,bonus:0,unlock:null},{id:'bronze',name:'铜锅',cost:10,minLevel:20,maxLevel:40,bonus:50,unlock:'3-B'},{id:'silver',name:'银锅',cost:15,minLevel:40,maxLevel:70,bonus:100,unlock:'6-B'},{id:'gold',name:'金锅',cost:20,minLevel:70,maxLevel:100,bonus:300,unlock:'11-B'}];
export const RECIPES=[['mulligan','方可乐大杂烩','一般',{}],['red','方可乐红炖汤',null,{red:4}],['blue','方可乐蓝梦汁',null,{blue:4}],['yellow','方可乐黄焖锅',null,{yellow:4}],['gray','方可乐白焗饭',null,{gray:4}],['water','方可乐海鲜锅','水',{soft:4,blue:3}],['normal','方可乐奶油煮','一般',{sweet:3,gray:2}],['poison','方可乐黏黏糊','毒',{mushroom:4,soft:3}],['ground','方可乐大地煮','地面',{mineral:2,soft:3}],['grass','方可乐青草汤','草',{plant:4,soft:2}],['bug','方可乐蜂蜜甜汤','虫',{sweet:4,yellow:3}],['psychic','方可乐念力年糕','超能力',{sweet:3,hard:2}],['rock','方可乐顽石锅','岩石',{hard:4,mineral:2}],['flying','方可乐旋风小炒','飞行',{mineral:3,plant:2}],['fire','方可乐焰辣汤','火',{mushroom:3,red:1}],['electric','方可乐麻麻烩饭','电',{soft:4,yellow:3}],['fighting','方可乐壮壮欧蕾','格斗',{sweet:3,mushroom:2}],['legend','方可乐传奇汤',null,{shell:1}]].map(([id,name,type,rules],index)=>({id,name,type,rules,index,turns:2,types:type?[type]:[]}));
const ITEM_IDS=[null,'tiny-mushroom','big-root','bluk-berry','icy-rock','apricorn','honey','fossil','balm-mushroom','rainbow-matter','mystical-shell'];
for(const i of INGREDIENTS){const raw=CLIENT.cookItems[ITEM_IDS.indexOf(i.id)];i.clientId=raw.m_id;i.price=raw.m_price;i.rank=raw.m_rank;i.client=raw}
for(const [index,p] of POTS.entries()){const raw=CLIENT.potVolumes[index];p.minLevel=raw.m_pokeLevelMin;p.maxLevel=raw.m_pokeLevelMax;p.cost=raw.m_itemNum;p.extraTurns=raw.m_cookTime;p.bonus=0}
for(const r of RECIPES){r.name=CLIENT.recipeNames[r.index];r.description=CLIENT.recipeDescriptions[r.index];r.client=CLIENT.cookRecipes[r.index]}
for(const species of SPECIES){const raw=CLIENT.pokemon[species.dex];species.name=CLIENT.pokemonNames[species.dex];species.client=raw;species.hp=raw.m_hpBasis;species.atk=raw.m_attackBasis}
const regionNames=STAGE_DESCRIPTION_NAMES.map(name=>name.replace(/^\d+\./,''));
export const REGIONS=QUEST_REGIONS.map((r,i)=>({...r,name:regionNames[i]}));
export const MOVES=QUEST_MOVES;
for(const m of MOVES){const label={'电气场':'电气场地','泼沙':'掷泥','精神击':'精神击破'}[m.name]||m.name,index=CLIENT.skillNames.indexOf(label),raw=CLIENT.skillResources[index];if(raw){m.clientId=index;m.name=label;m.client=raw;m.attack=Math.round(raw.m_damagePercent*100);m.power=raw.m_damagePercent;m.cooldown=raw.m_chargeSecond;m.speciesDex=SPECIES.filter(s=>s.client.m_skillIDs.includes(index)).map(s=>s.dex)}}
{const raw=CLIENT.skillResources[102],base=MOVES.find(v=>v.id==='mud-slap');MOVES.push({...base,id:'sand-attack',clientId:102,name:CLIENT.skillNames[102],client:raw,attack:Math.round(raw.m_damagePercent*100),power:raw.m_damagePercent,cooldown:raw.m_chargeSecond,speciesDex:SPECIES.filter(s=>s.client.m_skillIDs.includes(102)).map(s=>s.dex)})}
export const MOVE_STONES=[['whack','连连石','增加一次攻击，等待时间延长'],['broad','展展石','增加攻击范围'],['scatter','散散石','增加投射数量'],['sharing','团团石','向同伴分享强化效果'],['stay','恒恒石','延长效果持续时间'],['wait','快快石','缩短招式等待时间']].map(([id,name,description])=>({id,name,description,kind:id}));
export function makeMoveStone(kind){
 const group=CLIENT.skillStoneGroups.find(g=>SOURCE_SKILL_STONE_KINDS[g.m_id]===kind);
 if(!group)throw new RangeError('Unknown skill stone');
 return {id:uid(),kind,source:{version:1,...originalCreateSkillStonePlan(group)}};
}
let webUidSequence=0;
const SAVE_KEY='pokemon-quest-web-v2',sp=id=>SPECIES.find(s=>s.id===id),move=id=>resolveBattleMove(id),uid=()=>`q${Date.now().toString(36)}-${++webUidSequence}`,pick=a=>a[Math.floor(Math.random()*a.length)],result=(ok,message,extra={})=>({ok,message,...extra});
const initialMove=s=>({'草':'vine-whip','火':'ember','水':'water-gun','电':'thunder-shock','超能力':'psychic','岩石':'rock-throw','飞行':'gust','毒':'poison-sting','冰':'ice-beam','格斗':'bulk-up'}[s.types[0]]||'tackle');
export function makeMonster(speciesId,level=1,potId='normal',modifiers={}){const s=sp(speciesId),pot=POTS.find(p=>p.id===potId)||POTS[0],pool=MOVES.filter(v=>v.speciesDex.includes(s.dex)),skillPlan=clientLotteryInitialSkillPlan(s.dex),rolledSkills=skillPlan.skillIDs.map(id=>MOVES.find(v=>v.clientId===id)?.id).filter(Boolean),first=rolledSkills[0]||pool[0].id,second=rolledSkills[1]||null,rarePlan=modifiers.visitRareColor?originalVisitRareColorPlan(createOriginalUnityRandom(Math.floor(Math.random()*4294967296)|0),CLIENT.visit.m_CookRareLotteryCount):null,bingoPlan=originalSelectBingo(s.dex,(min,max)=>min+Math.floor(Math.random()*(max-min)));return{uid:uid(),speciesId,level,xp:0,...(rarePlan?{shiny:rarePlan.shiny,clientRareColor:rarePlan}:{}),nature:rarePlan?.nature??clientLotteryNature(),skillRangeType:clientLotteryRangedAttack(s.dex)?1:0,moves:second?[first,second]:[first],moveSlots:second?[[],[]]:[[]],skillSlotIndices:second?skillPlan.skillSlotIndices.slice(0,2):[skillPlan.skillSlotIndices[0]??0],moveTrainingCount:0,slots:Array(9).fill(null),slotKinds:Array.from({length:9},()=>clientLotterySlotKind(s.dex,modifiers.multiSlotMultiplier||1)),sourceBingo:bingoPlan,bingo:originalBingoTexts(s.dex,bingoPlan.packed),sourceGrowth:createGrowthSlots(growthTarget(CLIENT.growth,level,s.client.m_growType)),growthClass:SPECIES_FACTS[String(s.dex).padStart(3,'0')].growthClass,ivHp:clientTalent(pot,'hp'),ivAtk:clientTalent(pot,'atk'),potBonus:0,everstone:false}}
export function createGame(starterId='bulbasaur'){const m=makeMonster(STARTERS.includes(starterId)?starterId:STARTERS[0]);return hydrateGame({version:2,starterChosen:false,monsters:[m],team:[m.uid],inventory:Object.fromEntries(INGREDIENTS.map(i=>[i.id,i.quality===1?20:0])),stones:[],tutorial:{completed:false,recruited:false,phase:'starter',worldMapDialogCompleted:false},expeditionBonus:0,moveStones:[],cleared:[],cooking:null,battery:{value:5,updatedAt:Date.now()},tickets:0,lastTicketDay:null,expeditions:0,discovered:[]})}
export function makeFixedMonster(raw){
 const species=SPECIES.find(s=>s.dex===raw.m_monsterNo);if(!species)throw Error('Unknown fixed gift species');
 const m=makeMonster(species.id,raw.m_level);m.shiny=false;m.clientRareColorPolicy={version:1,rareRandomMarker:0x1fffffff,mode:'forced-normal'};
 m.ivHp=raw.m_hp-species.hp-m.level;m.ivAtk=raw.m_attack-species.atk-m.level;m.moves=raw.m_uniqueSkills.filter(id=>id!==65535).map(id=>MOVES.find(v=>v.clientId===id)?.id).filter(Boolean);if(!m.moves.length)throw Error('Fixed gift has no supported moves');
 m.moveSlots=m.moves.map(()=>[]);m.skillRangeType=raw.m_skillRangeType;m.normalSkillId=raw.m_normalSkill;m.clientActiveSlotIndices=raw.m_activeSlotIndices;m.clientNextActiveSlotIndex=raw.m_nextActiveSlotIndex;m.clientUniqueSkillSlots=[...raw.m_uniqueSkillSlots];m.skillSlotIndices=raw.m_uniqueSkillSlots.filter(i=>i>=0&&i<4).slice(0,m.moves.length);m.clientBingoPropertyIndices=[...raw.m_bingoPropertyIndices];m.sourceBingo={version:1,indices:[...raw.m_bingoPropertyIndices],packed:originalEncodeBingoIndices(raw.m_bingoPropertyIndices)};m.bingo=originalBingoTexts(sp(m.speciesId).dex,m.sourceBingo.packed);
 const slots=[6,7,8,2,0,1,3,4,5];for(let i=0;i<9;i++)m.slotKinds[slots[i]]=['atk','hp','both'][raw.m_activeSlotPropertyTypes[i]];
 const facts=SPECIES_FACTS[String(species.dex).padStart(3,'0')];m.bingo=facts.bingos.map((pool,i)=>pool[raw.m_bingoPropertyIndices[i]]??pool[0]);m.clientFixedSpec=raw;delete m.sourceGrowth;growthState(m);return m;
}
export function chooseStarter(g,...args){return gameSaveTransaction(g,saveGame,()=>chooseStarterCore(g,...args));}
function chooseStarterCore(g,id){if(g.starterChosen||g.expeditions>0)return result(false,'已经选择初始伙伴');if(!STARTERS.includes(id))return result(false,'请选择五只初始伙伴之一');const m=makeMonster(id),raw=CLIENT_STARTERS.find(v=>v.m_monsterNo===sp(id).dex);m.shiny=false;m.clientRareColorPolicy={version:1,rareRandomMarker:0x1fffffff,mode:'forced-normal'};m.level=raw.m_level;m.ivHp=raw.m_hp-sp(id).hp-m.level;m.ivAtk=raw.m_attack-sp(id).atk-m.level;m.moves=raw.m_uniqueSkills.filter(v=>v!==65535).map(v=>MOVES.find(move=>move.clientId===v)?.id).filter(Boolean);m.moveSlots=m.moves.map(()=>[]);m.skillRangeType=raw.m_skillRangeType;m.normalSkillId=raw.m_normalSkill;m.clientStarter=raw;m.clientActiveSlotIndices=raw.m_activeSlotIndices;m.clientNextActiveSlotIndex=raw.m_nextActiveSlotIndex;m.clientUniqueSkillSlots=[...raw.m_uniqueSkillSlots];m.skillSlotIndices=raw.m_uniqueSkillSlots.filter(i=>i>=0&&i<4).slice(0,m.moves.length);m.clientBingoPropertyIndices=[...raw.m_bingoPropertyIndices];m.sourceBingo={version:1,indices:[...raw.m_bingoPropertyIndices],packed:originalEncodeBingoIndices(raw.m_bingoPropertyIndices)};m.bingo=originalBingoTexts(sp(m.speciesId).dex,m.sourceBingo.packed);const sourceToLegacySlot=[6,7,8,2,0,1,3,4,5];for(let i=0;i<9;i++)m.slotKinds[sourceToLegacySlot[i]]=['atk','hp','both'][raw.m_activeSlotPropertyTypes[i]];delete m.sourceGrowth;growthState(m);g.monsters=[m];g.team=[m.uid];g.starterChosen=true;g.tutorial.phase='expedition';recordBuddies(g,[m]);return result(true,'初始伙伴已加入',{monster:m})}
const transientGames=new WeakSet();
export function createTransientGame(starterId){const g=createGame(starterId);transientGames.add(g);return g}
export function saveGame(g){if(transientGames.has(g))return true;recordMaxStats(g);try{globalThis.localStorage?.setItem(SAVE_KEY,JSON.stringify(g));return true}catch{return false}}
export function restoreGameBackup(text,currentGame){
 const restored=JSON.parse(text);
 if(restored?.version!==2||!Array.isArray(restored.monsters)||!restored.monsters.length||!restored.battery||!Array.isArray(restored.team))throw Error('存档格式不兼容');
 if(restored.monsters.some(m=>!m||!SPECIES.some(s=>s.id===m.speciesId)||!Array.isArray(m.moves)||!m.uid))throw Error('存档伙伴数据不兼容');
 if(restored.team.some(id=>!restored.monsters.some(m=>m.uid===id)))throw Error('存档队伍数据不兼容');
 hydrateGame(restored);recoverInterruptedExpedition(restored);
 if(transientGames.has(currentGame))transientGames.add(restored);
 if(!saveGame(restored))throw Error('存档保存失败，当前进度已保留');
 return restored;
}
export function loadGame(){try{const g=JSON.parse(globalThis.localStorage?.getItem(SAVE_KEY));if(g?.version===2&&g.monsters?.length&&g.battery){hydrateGame(g);refreshEnergy(g);const active=g.activeExpedition,previous=g.lastInterruptedExpedition;if(recoverInterruptedExpedition(g)&&!saveGame(g)){g.activeExpedition=active;if(previous)g.lastInterruptedExpedition=previous;else delete g.lastInterruptedExpedition;g.interruptedRecoverySaveFailed=true;}return g}}catch{}return createGame()}
export function refreshEnergy(g,now=Date.now()){const cap=g.modifiers?.batteryCapacity||5;const interval=30*60*1000;if(now<g.battery.updatedAt)return g.battery.value;if(g.battery.value>=cap){g.battery.value=cap;g.battery.updatedAt=now;return cap}const ticks=Math.floor((now-g.battery.updatedAt)/interval);if(ticks){g.battery.value=Math.min(cap,g.battery.value+ticks);g.battery.updatedAt=g.battery.value===cap?now:g.battery.updatedAt+ticks*interval}return g.battery.value}
// Web tutorial maps the source final world-map dialog to this explicit event.
export function completeWorldMapTutorial(g,now=Date.now()){
 if(!g.tutorial?.recruited)return result(false,'请先完成招募教程');
 const previousTutorial={...g.tutorial},previousVisitor=g.dailyVisitor;g.tutorial.worldMapDialogCompleted=true;
 if(!Number.isFinite(g.dailyVisitor?.clock))g.dailyVisitor={...g.dailyVisitor,clock:now,initialClockAdapter:'first-world-map-now'};
 if(!saveGame(g)){g.tutorial=previousTutorial;if(previousVisitor)g.dailyVisitor=previousVisitor;else delete g.dailyVisitor;return result(false,'无法保存访客开启状态',{reason:'save-failed'});}return result(true,'营地访客已开放');
}
export function refreshDailyVisitor(g,now=Date.now(),random=Math.random){
 const unlocked=!!g.tutorial?.worldMapDialogCompleted;
 if(!unlocked)return {ok:false,reason:'locked'};
 const previous=g.dailyVisitor?{...g.dailyVisitor}:undefined;
 if(!Number.isFinite(g.dailyVisitor?.clock))g.dailyVisitor={...g.dailyVisitor,clock:now,initialClockAdapter:'legacy-first-open-now'};
 const clearLayerIndex=originalTimeVisitorClearLayerIndex(world=>g.cleared.includes(REGIONS.find(r=>r.id===world)?.stages.at(-1)?.id));
 const outcome=updateDailyVisitor(g,{now,unlocked,clearLayerIndex,random,createMonster:plan=>{const species=SPECIES.find(s=>s.dex===plan.dex);if(!species)return null;const monster=makeMonster(species.id,plan.level,'normal',{visitRareColor:true});monster.clientVisit={version:1,...plan};return monster;}});
 if(outcome.generated||previous===undefined||previous?.clock!==g.dailyVisitor.clock){try{if(!saveGame(g))throw Error('save-failed');}catch(error){if(previous)g.dailyVisitor=previous;else delete g.dailyVisitor;return result(false,'无法保存访客，请检查本地存储',{reason:'save-failed'});}}
 return outcome;
}
export function collectDailyVisitor(g){
 hydrateGame(g);const previous={monsters:[...g.monsters],records:JSON.parse(JSON.stringify(g.records)),discovered:[...(g.discovered||[])],visitor:{...g.dailyVisitor}};
 const outcome=commitDailyVisitor(g);if(!outcome.ok)return result(false,outcome.reason==='monster-storage-full'?'伙伴盒空间不足，请先整理或扩容':'当前没有来访伙伴',outcome);
 recordBuddies(g,outcome.monsters);g.discovered??=[];if(!g.discovered.includes(outcome.monster.speciesId))g.discovered.push(outcome.monster.speciesId);
 try{if(!saveGame(g))throw Error('save-failed');}catch(error){g.monsters=previous.monsters;g.records=previous.records;g.discovered=previous.discovered;g.dailyVisitor=previous.visitor;return result(false,'无法保存访客，请检查本地存储',{reason:'save-failed'});}
 return result(true,`${sp(outcome.monster.speciesId).name}成为伙伴`,outcome);
}
export function claimDailyTickets(g,...args){return gameSaveTransaction(g,saveGame,()=>claimDailyTicketsCore(g,...args));}
function claimDailyTicketsCore(g,now=Date.now()){const interval=CLIENT.misc.m_fsGiftTicket.m_oneDayIntervalHour*3600000,last=g.lastTicketClaimAt??(g.lastTicketDay?Date.parse(g.lastTicketDay+'T00:00:00+08:00'):null);if(last!==null&&now-last<interval)return result(false,'领取间隔未满22小时',{availableAt:last+interval});const amount=CLIENT.misc.m_fsGiftTicket.m_baseValue+(g.modifiers?.dailyTicketsBonus||0);g.lastTicketClaimAt=now;g.lastTicketDay=new Date(now).toISOString().slice(0,10);g.tickets=Math.min(CLIENT.misc.m_fsGiftTicket.m_max,g.tickets+amount);g.records??={};g.records.dailyClaims=(g.records.dailyClaims||0)+1;return result(true,`获得 ${amount} 张礼券`,{amount,availableAt:now+interval})}
export function refillBattery(g,...args){return gameSaveTransaction(g,saveGame,()=>refillBatteryCore(g,...args));}
function refillBatteryCore(g){refreshEnergy(g);if(g.battery.value===(g.modifiers?.batteryCapacity||5))return result(false,'电池已满');if(!spendTickets(g,25))return result(false,'需要 25 张礼券');g.battery={value:g.modifiers?.batteryCapacity||5,updatedAt:Date.now()};return result(true,'电池已补满')}
function growthFor(m){return growthTarget(CLIENT.growth,m.level,sp(m.speciesId).client.m_growType)}
function growthState(m){const target=growthFor(m),state=restoreGrowthSlots(m,target);if(target.count>slotCount(state.mask))advanceGrowthSlots(state,target);else state.progress=target.progress;return state}
function updateGrowth(m){advanceGrowthSlots(growthState(m),growthFor(m))}
export function unlockedSlots(m){return slotCount(growthState(m).mask)}
export function activeBingos(m){const lines=[[6,7,8],[2,0,1],[3,4,5],[6,2,3],[7,0,4],[8,1,5]];return Math.min(3,lines.filter(line=>line.every(i=>m.slots[i])).length)}
export function monsterStats(g,m,basisSpeciesId=m.speciesId){const s=sp(m.speciesId),basis=sp(basisSpeciesId);let hp=basis.hp+m.level+m.ivHp+m.potBonus,atk=basis.atk+m.level+m.ivAtk+m.potBonus;const effects={};for(const id of m.slots){const stone=g.stones.find(v=>v.id===id);if(stone){stone.kind==='hp'?hp+=stone.value:atk+=stone.value;for(const [key,v] of Object.entries(stone.bonus||{}))effects[key]=(effects[key]||0)+v}}const bingo=activeBingos(m);for(const text of m.bingo.slice(0,bingo)){const match=text.match(/^(HP|ATK) \+(\d+)(%)?$/);if(match){const n=Number(match[2]);if(match[1]==='HP')hp=match[3]?hp*(1+n/100):hp+n;else atk=match[3]?atk*(1+n/100):atk+n}}return{hp:Math.round(hp),atk:Math.round(atk),effects,bingo,modelScalePercent:originalBingoModelScalePercent(s.dex,m.bingo,bingo),unlocked:unlockedSlots(m)}}
export const stats=monsterStats;
export function teamPower(g,stage=null){return g.team.reduce((n,id)=>{const m=g.monsters.find(m=>m.uid===id),s=m&&stageStats(g,m,stage);return n+(s?s.hp+s.atk:0)},0)}
export function toggleTeam(g,...args){return gameSaveTransaction(g,saveGame,()=>toggleTeamCore(g,...args));}
function toggleTeamCore(g,id){if(!g.monsters.some(m=>m.uid===id))return result(false,'伙伴不存在');if(g.team.includes(id)){if(g.team.length===1)return result(false,'队伍至少保留一位');g.team=g.team.filter(v=>v!==id)}else{if(g.team.length===3)return result(false,'队伍最多三位');g.team.push(id)}return result(true,'队伍已更新')}
export function equipStone(g,...args){return gameSaveTransaction(g,saveGame,()=>equipStoneCore(g,...args))===true;}
function equipStoneCore(g,id,stoneId,slotIndex=0){const m=g.monsters.find(m=>m.uid===id),s=g.stones.find(s=>s.id===stoneId);if(!m||!Number.isInteger(slotIndex)||slotIndex<0||!isSlotUnlocked(m,slotIndex)||stoneId&&!s)return false;if(s&&m.slotKinds[slotIndex]!=='both'&&m.slotKinds[slotIndex]!==s.kind)return false;for(const other of g.monsters)other.slots=other.slots.map(v=>stoneId&&v===stoneId?null:v);m.slots[slotIndex]=stoneId||null;return true}
export function equipMoveStone(g,...args){return gameSaveTransaction(g,saveGame,()=>equipMoveStoneCore(g,...args));}
function equipMoveStoneCore(g,id,stoneId,moveIndex=0,stoneSlot=null){
 const m=g.monsters.find(m=>m.uid===id),stone=g.moveStones.find(s=>s.id===stoneId);
 if(!m||!stone||!m.moves[moveIndex])return result(false,'招式石或伙伴不存在');
 const key={whack:'whack-whack',broad:'broadburst',scatter:'scattershot',sharing:'sharing',stay:'staystrong',wait:'waitless'}[stone.kind];
 if(!move(m.moves[moveIndex]).stones.includes(key))return result(false,'这招式不能装备该招式石');
 const max=originalSkillStoneCapacities(m)[moveIndex]??0,slots=m.moveSlots[moveIndex]||[];
 if(stoneSlot===null)stoneSlot=Array.from({length:max},(_,i)=>i).find(i=>!slots[i]);
 if(!Number.isInteger(stoneSlot)||stoneSlot<0||stoneSlot>=max)return result(false,'招式石槽已满');
 for(const other of g.monsters)other.moveSlots=other.moveSlots.map(a=>a.map(v=>v===stoneId?null:v));
 m.moveSlots[moveIndex]??=[];m.moveSlots[moveIndex][stoneSlot]=stoneId;return result(true,'招式石已装备');
}
export function removeMoveStone(g,...args){return gameSaveTransaction(g,saveGame,()=>removeMoveStoneCore(g,...args));}
function removeMoveStoneCore(g,id,moveIndex,stoneSlot){
 const m=g.monsters.find(m=>m.uid===id);if(!m?.moveSlots[moveIndex]?.[stoneSlot])return result(false,'槽内没有招式石');
 m.moveSlots[moveIndex][stoneSlot]=null;return result(true,'已取下招式石');
}
/** Calculate all rewards before mutating either storage. Legacy icon tiers lack
 * original headers; their known generated bonus commands have rarity 10 each. */
export function recycleStones(g,...args){return gameSaveTransaction(g,saveGame,()=>recycleStonesCore(g,...args));}
function recycleStonesCore(g,ids,{random=Math.random}={}){
 const unique=[...new Set(ids)];if(unique.length>9)return result(false,'一次最多回收9个方石');if(!unique.length)return result(false,'请选择要回收的方石');
 const attached=new Set(g.monsters.flatMap(m=>[...m.slots,...m.moveSlots.flat()]));
 if(unique.some(id=>attached.has(id)))return result(false,'已装备方石不能回收');
 const entries=unique.map(id=>({stone:g.stones.find(s=>s.id===id)||g.moveStones.find(s=>s.id===id),skill:g.moveStones.some(s=>s.id===id)}));
 if(entries.some(e=>!e.stone))return result(false,'方石不存在');
 const ingredients={};
 try{for(const{stone,skill}of entries){
  const rarity=(stone.source?.header??stone.clientHeader)?.rarity??(skill?0:({normal:0,bronze:10,silver:20,gold:30}[stone.rarity]??0));
  const count=originalRecycleCountForHeader({...(stone.source?.header??stone.clientHeader),potentialType:skill?1:0,rarity});
  const materials=originalRecycleMaterials({count,random,multiplier:g.modifiers?.recycleMultiplier??1});
  for(const[key,n]of Object.entries(materials)){const item=INGREDIENTS.find(i=>i.clientId===+key);if(item)ingredients[item.id]=(ingredients[item.id]||0)+n;}
 }}catch(error){return result(false,'回收计算未完成',{reason:error.message});}
 for(const[key,n]of Object.entries(ingredients))g.inventory[key]=(g.inventory[key]||0)+n;
 g.stones=g.stones.filter(s=>!unique.includes(s.id));g.moveStones=g.moveStones.filter(s=>!unique.includes(s.id));
 g.records.recycled=(g.records.recycled||0)+unique.length;return result(true,'回收完成',{ingredients,count:unique.length});
}
// First cooking tutorial: the mixed source ingredients make Mulligan Stew.
export const TUTORIAL_COOK_INGREDIENTS=Object.freeze(['tiny-mushroom','bluk-berry','apricorn','fossil','fossil']);
export function identifyRecipe(ids){if(!Array.isArray(ids)||ids.length!==5||ids.some(id=>!INGREDIENTS.some(i=>i.id===id)))return null;const items=ids.map(id=>INGREDIENTS.find(i=>i.id===id).client),average=items.reduce((sum,i)=>sum+i.m_price,0)/5;const matches=r=>r.m_itemType.every((type,index)=>{if(type===4)return items.some(i=>i.m_id===10);const field={1:'m_color',2:'m_hardness',3:'m_group'}[type],n=type===0?5:items.filter(i=>i[field]===r.m_itemTypeValue[index]).length;return n>=r.m_itemPoolNumMin[index]&&n<=r.m_itemPoolNumMax[index]});const raw=CLIENT.cookRecipes.filter(matches).sort((a,b)=>b.m_cookRank-a.m_cookRank)[0]||CLIENT.cookRecipes[0],rarity=CLIENT.cookRarities.filter(v=>average>=v.m_itemPriceAverage).at(-1),recipe=RECIPES[raw.m_no];return{recipe,quality:average*5,averagePrice:average,rarity:rarity.m_no,tier:['普通','好','非常好','极致'][rarity.m_no],turns:raw.m_cookTime+rarity.m_cookTime}}
export function cookingStationCount(g){return Math.max(1,Math.trunc(g.offline?.cookingStations||1));}
export function cookingAtStation(g,index){return index===(g.activeCookingStation||0)?g.cooking:(g.extraCookings?.[index]||null);}
// APK ShowCheckShortCutCooking: truncate(float32(remaining * m_ticketCoef)).
export function cookingShortcutCost(g,index=g.activeCookingStation||0){const cooking=cookingAtStation(g,index);return cooking&&!cooking.ready?Math.trunc(Math.fround(Math.fround(cooking.remaining)*Math.fround(CLIENT.misc.m_cooking.m_ticketCoef))):0;}
export function completeCookingEarly(g,index=g.activeCookingStation||0,expectedCost){return gameSaveTransaction(g,saveGame,()=>{if(!Number.isInteger(index)||index<0||index>=cookingStationCount(g))return result(false,'无效料理锅');const cooking=cookingAtStation(g,index);if(!cooking||cooking.ready||!Number.isInteger(cooking.remaining)||cooking.remaining<=0)return result(false,'该料理无需提前完成');const cost=cookingShortcutCost(g,index);if(expectedCost!==undefined&&expectedCost!==cost)return result(false,'料理进度已变化，请重新确认');if(!spendTickets(g,cost))return result(false,`点券不足，需要 ${cost} 张点券`,{reason:'insufficient-tickets',cost});cooking.remaining=0;cooking.ready=true;return result(true,'料理已提前完成，可以领取了',{cost,station:index});});}
export function selectCookingStation(g,...args){return gameSaveTransaction(g,saveGame,()=>selectCookingStationCore(g,...args));}
function selectCookingStationCore(g,index){if(!Number.isInteger(index)||index<0||index>=cookingStationCount(g))return result(false,'无效料理锅');const previous=g.activeCookingStation||0;if(previous===index)return result(true,'料理锅已选中');g.extraCookings??={};g.extraCookings[previous]=g.cooking||null;g.cooking=g.extraCookings[index]||null;delete g.extraCookings[index];g.activeCookingStation=index;return result(true,'已切换料理锅');}
function requireTrainingSave(g){if(!saveGame(g))throw Object.assign(new Error('本地保存失败，请检查存储空间后重试'),{trainingSaveFailed:true});}
function trainingSaveTransaction(g,operation,{preservePending=false}={}){
 const snapshot=JSON.parse(JSON.stringify(g));
 try{return operation();}catch(error){
  if(!error.trainingSaveFailed)throw error;
  const pending=preservePending?g.cooking?.pendingRecruits:null;
  for(const key of Object.keys(g))delete g[key];Object.assign(g,snapshot);
  // Keep the first lottery in memory so retrying a failed pending write cannot reroll.
  // A browser restart before any successful write necessarily uses the last durable save.
  if(pending&&g.cooking&&!g.cooking.pendingRecruits)g.cooking.pendingRecruits=pending;
  return result(false,'本地保存失败，操作未提交。请检查存储空间后重试',{reason:'save-failed'});
 }
}
export function cook(g,...args){return trainingSaveTransaction(g,()=>cookCore(g,...args));}
export function claimCooking(g){return trainingSaveTransaction(g,()=>claimCookingCore(g),{preservePending:true});}
export function train(g,...args){return trainingSaveTransaction(g,()=>trainCore(g,...args));}
function cookCore(g,ids,potId='normal'){if(g.cooking)return result(false,'请先领取或完成当前料理');const info=identifyRecipe(ids),pot=POTS.find(p=>p.id===potId);if(!info||!pot)return result(false,'请选择五格食材与有效锅具');if(pot.unlock&&!g.cleared.includes(pot.unlock)&&!(g.unlockedPots||[]).includes(pot.id))return result(false,'尚未解锁该锅具');const cost={};for(const id of ids)cost[id]=(cost[id]||0)+pot.cost;if(!g.offline?.infiniteIngredients&&Object.entries(cost).some(([id,n])=>g.inventory[id]<n))return result(false,'食材数量不足');if(!g.offline?.infiniteIngredients)for(const[id,n]of Object.entries(cost))g.inventory[id]-=n;const turns=info.turns+pot.extraTurns;const tutorialCook=g.tutorial?.completed&&!g.tutorial.recruited&&g.expeditions>=2&&info.recipe.id==='mulligan';g.cooking={tutorial:tutorialCook,recipeId:info.recipe.id,potId,ingredients:[...ids],remaining:tutorialCook?0:turns,total:turns,ready:tutorialCook,tier:info.tier};g.campPotTypes??={};g.campPotTypes[g.activeCookingStation||0]=potId;g.records??={};g.records.pots??=[];if(!g.records.pots.includes(potId))g.records.pots.push(potId);requireTrainingSave(g);return result(true,`${info.recipe.name}开始烹饪`,{cooking:g.cooking})}
function claimCookingCore(g){
 if(!g.cooking?.ready)return result(false,'料理还未完成');hydrateGame(g);const cooking=g.cooking;
 if(!cooking.pendingRecruits){
  if(cooking.tutorial){cooking.pendingRecruits=['rattata','pidgey'].map(id=>{const m=makeMonster(id);m.shiny=false;m.clientRareColorPolicy={version:1,rareRandomMarker:0x1fffffff,mode:'forced-normal'};return m;});}
  else{const r=RECIPES.find(r=>r.id===cooking.recipeId),pot=POTS.find(p=>p.id===cooking.potId);let pool=SPECIES.filter(s=>s.recipes.includes(r.id));if(!pool.length)pool=SPECIES.filter(s=>!s.evolveFrom&&s.dex<144);
   const selected=weightedRecruit(pool,r.id,cooking.tier);cooking.pendingRecruits=[];
   if(selected){const count=clientLotteryRecruitCount(g.modifiers?.multipleRecruitMultiplier||1);for(let i=0;i<count;i++){const species=i===0?selected:weightedRecruit(pool,r.id,cooking.tier);if(species)cooking.pendingRecruits.push(makeMonster(species.id,clientLotteryRecruitLevel(pot.id),pot.id,{...g.modifiers,visitRareColor:true}));}}
  }requireTrainingSave(g);
 }
 g.campPotTypes??={};g.campPotTypes[g.activeCookingStation||0]=cooking.potId;const recruited=cooking.pendingRecruits;if(g.monsters.length+recruited.length>g.boxCapacity.monsters)return result(false,'伙伴盒空间不足，请先整理或扩容',{reason:'monster-storage-full',required:recruited.length});
 if(!g.records.recipes.includes(cooking.recipeId))g.records.recipes.push(cooking.recipeId);g.monsters.push(...recruited);recordBuddies(g,recruited);g.records.cooked=(g.records.cooked||0)+1;g.cooking=null;
 if(cooking.tutorial){g.tutorial.recruited=true;g.tutorial.phase='done';}requireTrainingSave(g);
 return result(true,recruited.length?`${sp(recruited[0].speciesId).name}成为伙伴`:'料理完成，但没有伙伴到访',{monster:recruited[0]||null,recruited:recruited[0]||null,monsters:recruited});
}
function evolve(m,g){if(m.everstone)return;let target=SPECIES.find(s=>s.evolveFrom===m.speciesId&&m.level>=s.evolveLevel);if(m.speciesId==='eevee'&&m.level>=36){const hp=m.slots.filter(v=>g.stones.find(s=>s.id===v)?.kind==='hp').length,atk=m.slots.filter(v=>g.stones.find(s=>s.id===v)?.kind==='atk').length;target=sp(hp>atk?'vaporeon':atk>hp?'flareon':'jolteon')}if(target){const old=SPECIES_FACTS[String(sp(m.speciesId).dex).padStart(3,'0')],next=SPECIES_FACTS[String(target.dex).padStart(3,'0')];if(m.sourceBingo)m.bingo=originalBingoTexts(target.dex,m.sourceBingo.packed);else m.bingo=m.bingo.map((text,i)=>next.bingos[i][Math.max(0,old.bingos[i].indexOf(text))%next.bingos[i].length]);m.speciesId=target.id;updateGrowth(m);return true}return false}
function trainCore(g,id,supportIds,mode='level',moveIndex=0){hydrateGame(g);const m=g.monsters.find(m=>m.uid===id);if(!m||!Array.isArray(supportIds)||supportIds.length<1||supportIds.length>4||new Set(supportIds).size!==supportIds.length||supportIds.includes(id))return result(false,'选择一至四位不同的支持伙伴');const supporters=supportIds.map(v=>g.monsters.find(m=>m.uid===v));if(supporters.some(v=>!v)||supportIds.some(v=>g.team.includes(v)))return result(false,'支持伙伴不存在或正在探险队伍中');if(mode!=='level'&&mode!=='move')return result(false,'未知特训模式');if(mode==='move'&&(!Number.isInteger(moveIndex)||moveIndex<0||moveIndex>=m.moves.length||!m.moves[moveIndex]))return result(false,'招式不存在');g.monsters=g.monsters.filter(v=>!supportIds.includes(v.uid));const trainingRecord=mode==='move'?'moveTraining':'levelTraining';g.records[trainingRecord]=(g.records[trainingRecord]||0)+1;if(mode==='move'){const chance=trainingChance(g,m,supporters);m.moveTrainingCount=(m.moveTrainingCount||0)+1;if(Math.random()>=chance){requireTrainingSave(g);return result(false,'招式特训失败，支持伙伴已消耗',{chance,consumed:true})}const pool=MOVES.filter(v=>v.speciesDex.includes(sp(m.speciesId).dex)&&!m.moves.includes(v.id));if(pool.length)m.moves[moveIndex]=pick(pool).id}else{m.xp+=Math.round(trainingXpGain(g,m,supporters)*(g.modifiers?.trainingXpMultiplier||1));while(m.level<100&&m.xp>=nextLevelXp(m.level)){m.xp-=nextLevelXp(m.level);m.level++;updateGrowth(m);recordLevel(g,m);if(g.records)g.records.levelUps++;if(evolve(m,g)&&g.records)g.records.evolutions++}}requireTrainingSave(g);return result(true,mode==='move'?'招式特训完成':'升级特训完成',{monster:m})}
function stageUnlocked(g,s){if(s.region===1)return s.id==='1-1'||g.cleared.includes(REGIONS[0].stages[REGIONS[0].stages.findIndex(v=>v.id===s.id)-1]?.id);if(s.region<=3){if(!g.cleared.includes('1-B'))return false}else if(s.region<=6){if(!g.cleared.includes('2-B')||!g.cleared.includes('3-B'))return false}else if(s.region<=10){if(![4,5,6].every(r=>g.cleared.includes(`${r}-B`)))return false}else if(s.region===11){if(![7,8,9,10].every(r=>g.cleared.includes(`${r}-B`)))return false}else if(!g.cleared.includes('11-B'))return false;if(s.region===12)return true;const list=REGIONS[s.region-1].stages,i=list.findIndex(v=>v.id===s.id);return i===0||g.cleared.includes(list[i-1].id)}
export const isStageUnlocked=stageUnlocked;
const clientTypeNames=Object.fromEntries(SPECIES.flatMap(s=>[[s.client.m_type1,s.types[0]],...(s.types[1]?[[s.client.m_type2,s.types[1]]]:[])]));
const moveResolutionIssues=[];
export function getMoveResolutionIssues(){return moveResolutionIssues.map(v=>({...v}));}
export function clearMoveResolutionIssues(){moveResolutionIssues.length=0;}
// Strict audits must never report a substituted tackle as a valid source move.
// Production retains legacy-save compatibility, with bounded diagnostics.
export function resolveBattleMove(id,{strict=false,diagnostics}={}){
 const found=MOVES.find(v=>v.id===id);
 const clientId=typeof id==='string'&&/^client-\d+$/.test(id)?Number(id.slice(7)):null;
 const mapped=found||(clientId!==null?MOVES.find(v=>v.clientId===clientId):null);
 const raw=mapped?.client||(clientId!==null?CLIENT.skillResources[clientId]:null);
 const program=raw&&CLIENT_SKILL_PROGRAMS['Skill_'+raw.m_skillPath];
 if(!raw||!program){
  const issue={id,reason:!raw?'unknown-move':'missing-program',...(raw?{path:raw.m_skillPath}:{})};
  diagnostics?.push(issue);
  if(strict)throw new Error(`Invalid battle move ${String(id)}: ${issue.reason}`);
  if(!moveResolutionIssues.some(v=>v.id===id&&v.reason===issue.reason)){moveResolutionIssues.push(issue);if(moveResolutionIssues.length>100)moveResolutionIssues.shift();}
 }
 if(mapped)return mapped;
 return raw?{id:'client-'+clientId,clientId,name:CLIENT.skillNames[clientId],client:raw,attack:Math.round(raw.m_damagePercent*100),power:raw.m_damagePercent,cooldown:raw.m_chargeSecond,type:clientTypeNames[program?.header.type],effects:[]}:MOVES[0];
}
function clientMove(id){return resolveBattleMove('client-'+id)}

function enemyAttackMove(enemy){const candidates=(enemy?.m_uniqSkills||[]).filter(v=>v.m_skillID!==65535&&CLIENT.skillResources[v.m_skillID]?.m_damagePercent>0);return candidates.length?clientMove(pick(candidates).m_skillID).id:null}
function spawnWave(b){const phase=b.phases[b.wave-1];for(let i=0;i<phase.length;i++){const row=phase[i],species=SPECIES.find(s=>s.dex===row.dex)||SPECIES.find(s=>s.id===row.speciesId)||SPECIES[0],hp=Number(String(row.hp||species.hp).replaceAll(',',''))||species.hp,atk=Number(String(row.attack||species.atk).replaceAll(',',''))||species.atk;b.units.push({uid:`e${b.wave}-${i}`,speciesId:species.id,x:710+(i%3)*70,y:120+Math.floor(i/3)*90+(i%3)*100,hp,maxHp:hp,atk,clientEnemy:row.clientEnemy,dropSeedForEnemy:row.dropSeedForEnemy,dropSeedForDropManager:row.dropSeedForDropManager,spawnInstruction:row.spawnInstruction,registerIndex:row.registerIndex,cooldown:0,isEnemy:true,isBoss:!!row.isBoss,range:(row.clientEnemy?row.clientEnemy.m_normalSkillRangeType:species.range)?190:65,skillTimer:5,bossMoveId:enemyAttackMove(row.clientEnemy)});const enemy=b.units.at(-1);enemy.nativeSpawnYaw=Math.random()*Math.PI*2;if(b.worldLayout)configureNativeUnit(b,enemy);enemy.skillTimer=enemy.bossMoveId?move(enemy.bossMoveId).cooldown:0;}if(b.worldLayout)queueNativeEnemySpawns(b);b.log.unshift(phase.some(v=>v.isBoss)?'强大的宝可梦出现！':`第 ${b.wave} 段`)}
function stagePhases(stage){const rows=[...(stage.enemyRows||[]),...(stage.bossRows||[]).map(v=>({...v,isBoss:true}))];if(rows.length){const segments=[...new Set(rows.map(v=>v.segment))];return segments.map(segment=>{const part=rows.filter(v=>v.segment===segment),groups=[...new Set(part.map(v=>(v.isBoss?'boss':'enemy')+v.set))];return groups.map(key=>{const group=part.filter(v=>(v.isBoss?'boss':'enemy')+v.set===key);let weight=group.reduce((n,v)=>n+parseFloat(v.chance||'100'),0),ticket=Math.random()*weight;for(const v of group){ticket-=parseFloat(v.chance||'100');if(ticket<0)return v}return group[0]})})}const bossPool=SPECIES.filter(s=>(stage.bossSpecies||[]).some(name=>name.toLowerCase().replaceAll(' ','-')===s.id));return [[{speciesId:(pick(bossPool)||SPECIES[149]).id,isBoss:true}]]}

function applyDittoBattleUnit(g,u,stage){const original=g.monsters.find(m=>m.uid===u.uid);if(!original||sp(original.speciesId).dex!==132)return;const plan=originalDittoBattlePlan({defeatedSpecies:g.records.defeatedSpecies,scoutedDex:(g.discovered||[]).map(id=>SPECIES.find(s=>s.id===id)?.dex).filter(Boolean),level:original.level,nature:original.nature,shiny:original.shiny,hpVariable:original.level+original.ivHp+original.potBonus,atkVariable:original.level+original.ivAtk+original.potBonus,activeMask:growthState(original).mask,uniqueSkillNum:original.moves.length});u.dittoTransform=plan;if(!plan.applicable)return;const target=SPECIES.find(s=>s.dex===plan.dex),legal=target.client.m_skillIDs.filter(id=>id!==65535).map(id=>MOVES.find(move=>move.clientId===id)).filter(Boolean),moves=[];for(let n=0;n<original.moves.length&&legal.length;n++)moves.push(legal.splice(Math.floor(Math.random()*legal.length),1)[0].id);u.originalSpeciesId=original.speciesId;u.speciesId=target.id;const transformed=stageStats(g,original,stage,monsterStats(g,original,target.id));u.hp=u.maxHp=Math.max(1,transformed.hp);u.atk=Math.max(1,transformed.atk);u.skillRangeType=Number.isInteger(original.normalSkillId)&&original.normalSkillId>=0&&original.normalSkillId<36?original.normalSkillId%2:(original.skillRangeType??0);delete u.normalSkillId;u.range=u.skillRangeType?190:65;u.moves=moves.length?moves:[...original.moves];u.battleMonster={...original,speciesId:target.id,moves:[...u.moves],moveSlots:original.moveSlots.map(v=>[...v])};u.dittoTransform.skillSelectionAdapter='legal-without-replacement-original-count';}

export function startBattle(g,id){const entryBattery={...g.battery},entryActive=g.activeExpedition;hydrateGame(g);refreshEnergy(g);const stage=id==='tutorial'?TUTORIAL_STAGE:REGIONS.flatMap(r=>r.stages).find(s=>s.id===id);if(!stage||(id==='tutorial'?g.tutorial.completed:!stageUnlocked(g,stage)))throw Error('关卡尚未解锁');if(g.battery.value<1)throw Error('电池不足');if(!g.team.length)throw Error('请编组探险队伍');if(id!=='tutorial'&&g.stones.length+g.moveStones.length>=g.boxCapacity.stones)throw Error('P力石盒子已满，请先回收方石或扩容');if(g.battery.value===(g.modifiers?.batteryCapacity||5))g.battery.updatedAt=Date.now();g.battery.value--;const clientStage=pick(clientStageVariants(id));stage.stageBgmEventID=clientStage.m_stageBgmEventID;stage.bossBgmEventID=clientStage.m_bossBgmEventID;const phases=clientBattlePhases(clientStage),dropRandom=createOriginalUnityRandom(Math.floor(Math.random()*4294967296)|0),dropSeedData=createOriginalBattleSeedData(dropRandom);for(const row of phases.flat())Object.assign(row,allocateOriginalEnemyDropSeeds(dropSeedData));const b={clientStage,dropRandom,dropSeedData,drops:{ingredients:{},stones:[],moveStones:[]},loot:[],dropModifiers:g.modifiers,tutorialMonster:g.monsters[0],guaranteedGold:g.expeditionBonus>=10,aroundCount:g.expeditionBonus,goldDropped:false,records:g.records,phases,stageId:id,stage,level:stage.level,units:g.team.map((id,i)=>{const m=g.monsters.find(v=>v.uid===id),s=stageStats(g,m,stage);return{uid:id,speciesId:m.speciesId,shiny:!!m.shiny,normalSkillId:m.normalSkillId,skillRangeType:m.skillRangeType,x:160,y:170+i*120,hp:s.hp,maxHp:s.hp,atk:s.atk,modelScale:1+s.modelScalePercent,cooldown:0,skillCooldown:0,isEnemy:false,range:sp(m.speciesId).range?190:65,moves:[...m.moves],bingos:m.bingo.slice(0,s.bingo),stoneBonus:s.effects,revive:0,buff:0,scatterTarget:null}}),wave:1,maxWaves:phases.length,status:'fighting',elapsed:0,timeLimit:clientStage.m_timeLimitSecond,revivalCount:0,effects:[],log:['探险开始！'],paused:false,scatterCooldown:0,rewardClaimed:false};for(const unit of b.units)applyDittoBattleUnit(g,unit,stage);spawnWave(b);markExpeditionStarted(g,id);if(!saveGame(g)){g.battery=entryBattery;if(entryActive)g.activeExpedition=entryActive;else delete g.activeExpedition;throw Error('探险进度保存失败，电池未消耗，请重试');}return b}
const clientConditionKeys={1:'damageup',2:'damagedown',3:'defenseup',4:'defensedown',5:'speedup',6:'speeddown',7:'resistanceup',8:'resistancedown',9:'poisoned',10:'paralyzed',11:'asleep',12:'frozen',13:'burned',14:'confused',15:'hindered',16:'asleep'};
export function applyClientCondition(u,id,scale=1,durationScale=1){const data=CLIENT.conditions.find(v=>v.m_id===id);if(!data||data.m_type===0)return false;u.conditionStacks??={};const stacks=u.conditionStacks[data.m_type]??=[];const entry={id,remaining:data.m_time*durationScale,value:data.m_Value_A*scale,valueB:data.m_Value_B*scale};if(stacks.length<4)stacks.push(entry);else{const i=stacks.reduce((best,v,index)=>v.remaining<stacks[best].remaining?index:best,0);stacks[i]=entry}u.statuses??={};u.statuses[clientConditionKeys[data.m_type]]=Math.max(...stacks.map(v=>v.remaining));return true}
function conditionSum(u,type){return(u.conditionStacks?.[type]||[]).reduce((n,v)=>n+v.value,0)}
function conditionMultiplier(u,kind){const cfg=CLIENT.conditionParameters,types=kind==='attack'?[1,2]:kind==='damage'?[4,3]:[5,6],range=kind==='attack'?cfg.m_attackRatioClamp:kind==='damage'?cfg.m_damageRatioClamp:cfg.m_moveSpeedClamp;return Math.min(range.max,Math.max(range.min,1+conditionSum(u,types[0])-conditionSum(u,types[1])))}
function tickHitActions(b){for(const action of b.hitActions||[])if(!action.executed&&b.elapsed>=action.at){action.executed=true;const u=b.units.find(v=>v.uid===action.uid),t=battleTargets(b).find(v=>v.uid===action.targetUid),skill=move(action.skillId);if(u?.hp>0&&t?.hp>0){applySkillConditions(b,t,skill,u);hit(b,t,action.damage,u,skill.type)}}b.hitActions=(b.hitActions||[]).filter(v=>!v.executed)}
function tickRegeneration(b,dt){for(const u of b.units){if(u.hp<=0)continue;const base=(u.isEnemy?CLIENT.enemySetting:CLIENT.selfSetting).m_regeneration,percent=u.clientEnemy?.m_characterSettingParameterPercent?.m_regeneration,cfg=percent?{m_intervalSecond:base.m_intervalSecond*percent.m_intervalSecond,m_hpPercent:base.m_hpPercent*percent.m_hpPercent}:base;if(cfg.m_intervalSecond<=0)continue;u.regenerationTimer=(u.regenerationTimer||0)+dt;while(u.regenerationTimer>=cfg.m_intervalSecond){u.regenerationTimer-=cfg.m_intervalSecond;u.regenerationRemainder=(u.regenerationRemainder||0)+u.maxHp*cfg.m_hpPercent*(1+(u.stoneBonus?.naturalHealing||0)/100+bingoAmount(u,'Natural HP Healing')/100);const amount=Math.trunc(u.regenerationRemainder);u.regenerationRemainder-=amount;u.hp=Math.min(u.maxHp,u.hp+amount)}}}
function tickClientConditions(b,dt){for(const u of b.units)if(u.conditionStacks)for(const key of Object.keys(u.conditionStacks)){const remaining=u.conditionStacks[key].map(v=>({...v,remaining:v.remaining-dt})).filter(v=>v.remaining>0);u.conditionStacks[key]=remaining;if(remaining.length)u.statuses[clientConditionKeys[key]]=Math.max(...remaining.map(v=>v.remaining))}for(const action of b.conditionActions||[])if(!action.executed&&b.elapsed>=action.at){action.executed=true;const target=b.units.find(u=>u.uid===action.uid);if(target?.hp>0)applyClientCondition(target,action.id,action.scale,action.durationScale)}b.conditionActions=(b.conditionActions||[]).filter(v=>!v.executed)}
function hit(b,t,value,u,skillType,objectData){if(u&&skillType&&sp(u.speciesId).types.includes(skillType))value*=1.1;if(u?.conditionStacks)value*=conditionMultiplier(u,'attack');else{if(u?.statuses?.damageup)value*=1.3;if(u?.statuses?.damagedown)value*=.7}if(t.conditionStacks)value*=conditionMultiplier(t,'damage');else if(t.statuses?.defensedown)value*=1.3;if(u&&!u.isEnemy&&Math.random()<.05*(1+((u.stoneBonus?.criticalRate||0)+bingoAmount(u,'Critical Hit Rate'))/100))value*=1.5+((u.stoneBonus?.criticalDamage||0)+bingoAmount(u,'Critical Damage'))/100;if(!t.conditionStacks&&(t.buff||t.statuses?.defenseup))value*=.65;value=Math.max(0,Math.trunc(Math.fround(value)));const aliveBeforeDamage=t.hp>0;t.hp=Math.max(0,t.hp-value);if(originalDamageMaterialMotion({alive:aliveBeforeDamage,calculatedDamage:value,lethal:t.hp<=0})===25)t.damageAnimationVersion=(t.damageAnimationVersion||0)+1;if(!t.isDecoy&&!t.isEnemy&&t.hp===0)t.revive=CLIENT.revival.m_revivalSecond*(1-((t.stoneBonus?.recoveryTime||0)+bingoAmount(t,'Time To Recover'))/100);if(u&&!u.isEnemy&&u.hp>0){const heal=value*Math.min(10,(u.stoneBonus?.hitHealing||0)+bingoAmount(u,'Hit Healing'))/100+(t.hp===0?u.maxHp*((u.stoneBonus?.koHealing||0)+bingoAmount(u,'Healing from KO'))/100:0);u.hp=Math.min(u.maxHp,u.hp+heal)}const damageEffect=applyObjectDamageEffect(u,value,objectData);if(damageEffect.delta<0&&u.hp===0){if(u.isEnemy&&!u.dropGenerated)registerEnemyDefeat(b,u);else if(!u.isEnemy)u.revive=CLIENT.revival.m_revivalSecond*(1-(u.stoneBonus?.recoveryTime||0)/100);}if(!t.isDecoy&&t.isEnemy&&t.hp===0&&!t.dropGenerated)registerEnemyDefeat(b,t);b.effects.push({type:'hit',x:t.x,y:t.y,value:Math.round(value),ttl:.6,color:u?.isEnemy?'#ed7451':'#fff'})}
export function tickBattle(g,b,dt){if(b.status!=='fighting'||b.paused||b.nativeBossDeathTimeStopped)return b;dt=Math.min(.15,Math.max(0,dt));collectDrops(b,dt);b.elapsed+=dt;pruneBattleDecoys(b);tickSkillExecutions(b,dt,{moveActor:(unit,target)=>{if(b.nativeNavigation)b.nativeNavigation.displace(unit,target);else{unit.x=target.x;unit.y=target.y;}},moveEnabled:unit=>{unit.skillMoveEnabled=true;},createDecoy:(object,owner)=>createBattleDecoy(b,object,owner),updateDecoy:(object,owner,delta,age)=>updateBattleDecoy(b,object,owner,delta,age),attention:(target,source,life,options)=>applyAttentionTarget(b,target,source,life,options),selfCondition:applyClientCondition,changeHP:(u,type,ratio)=>{if(type===0)u.hp=Math.min(u.maxHp,u.hp+Math.round(Math.fround(u.maxHp*ratio)));else{u.hp=Math.max(0,u.hp-Math.round(Math.fround(u.maxHp*ratio)));if(!u.isEnemy&&u.hp===0)u.revive=CLIENT.revival.m_revivalSecond}},hit:(target,damage,source,skill,additional,objectData,cast)=>{applySkillConditions(b,target,skill,source,additional,cast?.mods);hit(b,target,damage,source,skill.type,objectData)},finished:(unit,cast)=>{unit.skillMoveEnabled=false;if(cast.uniqueCooldown!=null&&unit.hp>0){unit.skillCooldown=Math.max(unit.skillCooldown||0,cast.uniqueCooldown);unit.uniqueCooldownStartedAt=b.elapsed;}if(cast.skill.isBossAttack&&unit.hp>0)unit.skillTimer=cast.skill.cooldown;if(cast.skill.isNormalAttack&&unit.hp>0){finishClientNormalAttack(unit,cast.skill,cast.skill.cooldown*(1-bingoAmount(unit,'Wait for Standard Attacks')/100));unit.normalCooldownStartedAt=b.elapsed;}}});tickHitActions(b);tickClientConditions(b,dt);tickRegeneration(b,dt);for(const u of b.units.filter(v=>!v.isEnemy)){if(u.hp<=0){delete u.reservedSkill;continue;}if(Number.isInteger(u.reservedSkill)&&!u.skillCasting&&!u.statuses?.asleep&&!u.statuses?.frozen){const j=u.reservedSkill;delete u.reservedSkill;useSkill(g,b,b.units.filter(v=>!v.isEnemy).indexOf(u),j);}}b.scatterCooldown=Math.max(0,b.scatterCooldown-dt);b.effects=b.effects.map(e=>({...e,ttl:e.ttl-dt})).filter(e=>e.ttl>0);if(b.intermission>0){b.intermission-=dt;for(const u of b.units){u.statuses??={};for(const key of Object.keys(u.statuses)){u.statuses[key]-=dt;if(u.statuses[key]<=0)delete u.statuses[key]}if(u.hp>0&&(u.statuses.burned||u.statuses.poisoned))u.hp=Math.max(1,u.hp-u.maxHp*.015*dt);if(u.uniqueCooldownStartedAt!==b.elapsed)u.skillCooldown=Math.max(0,(u.skillCooldown||0)-dt);}if(b.intermission<=0)spawnWave(b);return b}if(b.timeLimit>0&&b.elapsed>=b.timeLimit){b.status='lost';b.failureReason='time';b.log.unshift('探险时间耗尽');return b}const living=b.units.some(u=>!u.isEnemy&&u.hp>0);if(!living){b.status='lost';return b}tickNativeEnemySpawns(b,dt);for(const u of b.units){u.statuses??={};for(const key of Object.keys(u.statuses)){u.statuses[key]-=dt;if(u.statuses[key]<=0)delete u.statuses[key]}if(u.hp>0&&(u.statuses.burned||u.statuses.poisoned))u.hp=Math.max(1,u.hp-u.maxHp*.015*dt);if(u.uniqueCooldownStartedAt!==b.elapsed)u.skillCooldown=Math.max(0,(u.skillCooldown||0)-dt);u.buff=Math.max(0,(u.buff||0)-dt);if(u.normalCooldownStartedAt!==b.elapsed)u.cooldown=Math.max(0,u.cooldown-dt);if(u.hp<=0){if(u.isEnemy&&!u.dropGenerated)registerEnemyDefeat(b,u);if(!u.isEnemy){u.revive-=dt;if(u.revive<=0){u.hp=Math.min(u.maxHp,Math.max(1,Math.trunc(u.maxHp*Math.max(CLIENT.revival.m_recoverHpMinPercent,CLIENT.revival.m_recoverHpPercent-CLIENT.revival.m_recoverHpSubPercent*(b.revivalCount||0))*(1+((u.stoneBonus?.recoveryHp||0)+bingoAmount(u,'HP upon Recovery'))/100))));b.revivalCount=(b.revivalCount||0)+1;u.x=u.nativeSpawnSimulation?.x??120;u.y=u.nativeSpawnSimulation?.y??300}}continue}if(u.statuses.asleep||u.statuses.frozen||(u.skillCasting&&!u.skillMoveEnabled))continue;const enemies=battleTargets(b).filter(v=>v.hp>0&&v.isEnemy!==u.isEnemy);if(!enemies.length)continue;if(u.scatterTarget&&b.elapsed>=(u.scatterUntil??Infinity)){u.scatterTarget=null;u.nativeRoute=null;}const t=selectBattleTarget(b,u);const target=u.scatterTarget||t,d=Math.hypot(target.x-u.x,target.y-u.y);if(b.nativeSkillPrograms&&!u.skillCasting&&u.isBoss&&u.bossMoveId){const skill=move(u.bossMoveId),program=getSkillProgram(skill);u.skillTimer=Math.max(0,u.skillTimer-dt);if(program&&!u.scatterTarget&&u.skillTimer===0&&d<=program.header.distance/b.worldScale){u.bossSkillAIApproximation=true;beginSkillExecution(b,u,{...skill,isBossAttack:true},[],u.atk*skill.client.m_damagePercent);continue}}if(u.scatterTarget||d>u.range||(b.nativeNavigation&&!b.nativeNavigation.hasLineOfSight(u,target))){if(d>5){const speed=(u.scatterTarget?220:(u.nativeMoveSpeed??(u.isEnemy?44:72)))*(u.conditionStacks?conditionMultiplier(u,'speed'):(u.statuses.speedup?1.4:1)*(u.statuses.speeddown||u.statuses.paralyzed?.5:1))*(1+((u.stoneBonus?.movementSpeed||0)+bingoAmount(u,'Movement Speed'))/100);if(b.nativeNavigation){const moved=b.nativeNavigation.step(u,target,speed*dt*b.worldScale);if(u.scatterTarget&&!moved){u.scatterTarget=null;u.nativeRoute=null;}}else{u.x+=(target.x-u.x)/d*speed*dt;u.y+=(target.y-u.y)/d*speed*dt}}else u.scatterTarget=null}else if(!u.skillCasting){if(!u.isEnemy&&b.auto&&tryAutoSkill(g,b,u))continue;if(u.cooldown===0){if(b.nativeSkillPrograms&&u.normalAttack){beginSkillExecution(b,u,u.normalAttack,[],u.atk*u.normalAttack.client.m_damagePercent);}else{hit(b,u.statuses.confused&&Math.random()<.25?u:t,u.atk,u);u.cooldown=(u.range>100?2.2:2)*(1-bingoAmount(u,'Wait for Standard Attacks')/100)}}}if(!b.nativeSkillPrograms&&!u.skillCasting&&u.isBoss&&u.bossMoveId&&u.clientEnemy?.m_uniqSkills.some(v=>v.m_skillID!==65535)){if(u.warning){u.warning.remaining-=dt;if(u.warning.remaining<=0){for(const e of enemies)if(Math.hypot(e.x-u.warning.x,e.y-u.warning.y)<140){const skill=move(u.bossMoveId);applySkillConditions(b,e,skill,u);hit(b,e,u.atk*(skill.attack/100),u)};b.effects.push({type:'ring',...u.warning,radius:140,ttl:.7,color:'#ec7251'});u.warning=null;u.skillTimer=move(u.bossMoveId).cooldown}}else if((u.skillTimer-=dt)<=0){u.warning={x:t.x,y:t.y,remaining:1};b.effects.push({type:'warning',x:t.x,y:t.y,radius:140,ttl:1,color:'#ec7251'})}}}separateBattleBodies(b,dt);if(!b.units.some(u=>u.isEnemy&&u.hp>0)&&!b.nativePendingSpawns?.some(group=>group.units.length)&&!(b.nativeBossDeathsEnabled&&b.units.some(u=>u.isBoss&&u.hp<=0&&!u.nativeBossDeathFinished))){if(b.wave===b.maxWaves){if(b.lastDeadBoss&&!b.finalBossDropGenerated){b.finalBossDropGenerated=true;spawnDrop(b,b.lastDeadBoss,{isLastDrop:true,isForceDropStone:true});}collectDrops(b,0,true);b.status='won'}else{b.wave++;b.units=b.units.filter(u=>!u.isEnemy);for(const u of b.units)if(u.hp>0)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*bingoAmount(u,'Healing per Wave')/100);b.intermission=2}}return b}
// Manual input reserves a ready unique move while the ordinary attack finishes.
// A pending request takes precedence over AUTO; cooldown/death/status remain blocking.
export function battleSkillState(b,index,moveIndex=0){
 const u=b.units.filter(v=>!v.isEnemy)[index];
 if(!u||!Number.isInteger(moveIndex)||moveIndex<0||moveIndex>=u.moves.length)return{enabled:false,label:'不可用'};
 if(b.status!=='fighting'||b.paused||b.loading)return{enabled:false,label:b.loading?'加载中':'暂停'};
 if(u.hp<=0)return{enabled:false,label:`↻ ${Math.ceil(u.revive)}`};
 if(u.skillCooldown>0)return{enabled:false,label:String(Math.ceil(u.skillCooldown))};
 if(u.statuses?.asleep||u.statuses?.frozen)return{enabled:false,label:u.statuses.asleep?'睡眠':'冰冻'};
 if(Number.isInteger(u.reservedSkill))return{enabled:false,label:u.reservedSkill===moveIndex?'等待释放':'等待'};
 const active=b.skillCasts?.some(c=>c.uid===u.uid&&!c.finished&&!c.skill.isNormalAttack);
 if(u.skillCasting&&active)return{enabled:false,label:'释放中'};
 return{enabled:true,label:''};
}
export function requestSkill(g,b,index,moveIndex=0){
 if(!battleSkillState(b,index,moveIndex).enabled)return false;
 const u=b.units.filter(v=>!v.isEnemy)[index];
 if(u.skillCasting){u.reservedSkill=moveIndex;return true;}
 return useSkill(g,b,index,moveIndex);
}
function tryAutoSkill(g,b,u){
 if(!u.moves?.length||!battleSkillState(b,b.units.filter(v=>!v.isEnemy).indexOf(u),0).enabled)return false;
 if(Math.floor(Math.random()*100)>=CLIENT.misc.m_battle.m_team.m_autoSkillUniqueProb)return false;
 const slots=u.moves.map((_,j)=>j).filter(j=>battleSkillState(b,b.units.filter(v=>!v.isEnemy).indexOf(u),j).enabled);
 return slots.length>0&&useSkill(g,b,b.units.filter(v=>!v.isEnemy).indexOf(u),slots[Math.floor(Math.random()*slots.length)]);
}
export function useSkill(g,b,index,moveIndex=0){const u=b.units.filter(v=>!v.isEnemy)[index];if(!u||!Number.isInteger(moveIndex)||moveIndex<0||moveIndex>=u.moves.length||b.loading||u.hp<=0||u.statuses?.asleep||u.statuses?.frozen||u.skillCooldown>0||u.skillCasting||b.status!=='fighting'||b.paused)return false;const m=u.battleMonster||g.monsters.find(v=>v.uid===u.uid),skill=move(u.moves[moveIndex]),targets=b.units.filter(e=>e.isEnemy&&e.hp>0&&Math.hypot(e.x-u.x,e.y-u.y)<(b.nativeSkillPrograms?((getSkillProgram(skill)?.header.distance||20)/b.worldScale):(skill.kind==='melee'?100:skill.kind==='dash'?220:400)));if(!b.nativeSkillPrograms&&!targets.length&&!['heal','buff'].includes(skill.kind))return false;const mods=(m.moveSlots[moveIndex]||[]).slice(0,originalSkillStoneCapacities(m)[moveIndex]??0).map(id=>g.moveStones.find(v=>v.id===id)?.kind);const typeEnglish={'一般':'Normal','火':'Fire','水':'Water','草':'Grass','电':'Electric','冰':'Ice','格斗':'Fighting','毒':'Poison','地面':'Ground','飞行':'Flying','超能力':'Psychic','虫':'Bug','岩石':'Rock','幽灵':'Ghost','龙':'Dragon','恶':'Dark','钢':'Steel','妖精':'Fairy'}[skill.type];const uniqueCooldown=skill.cooldown*(1-bingoAmount(u,typeEnglish+'-Type Moves Wait')/100)*(1-.05*mods.filter(v=>v==='wait').length)*(1+.5*mods.filter(v=>v==='whack').length);if(b.nativeSkillPrograms&&getSkillProgram(skill)){beginSkillExecution(b,u,skill,mods,u.atk*(skill.attack/100)*(1+bingoAmount(u,'ATK of '+typeEnglish+'-Type Moves')/100)*(1-.15*mods.filter(v=>v==='scatter').length));b.skillCasts.at(-1).uniqueCooldown=uniqueCooldown}else {u.skillCooldown=uniqueCooldown;if(skill.kind==='debuff'){for(const e of targets)applySkillConditions(b,e,skill,u)}else if(skill.kind==='heal')u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.35);else if(skill.kind==='buff'){const commands=CLIENT_SKILL_PROGRAMS['Skill_'+skill.client.m_skillPath]?.sections.flatMap(v=>v.commands).filter(v=>v.name==='ConditionSelf')||[];if(commands.length){b.conditionActions??=[];const durationScale=1+.25*mods.filter(v=>v==='stay').length,shareScale=.25*mods.filter(v=>v==='sharing').length;for(let repeat=0;repeat<=mods.filter(v=>v==='whack').length;repeat++)for(const command of commands){const data=command.data,repeatDelay=repeat*skill.client.m_rapidDelay;b.conditionActions.push({uid:u.uid,id:data.dataID,at:b.elapsed+command.startSecond+repeatDelay,scale:1,durationScale});if(shareScale>0)for(const ally of b.units.filter(v=>!v.isEnemy&&v.uid!==u.uid))b.conditionActions.push({uid:ally.uid,id:data.dataID,at:b.elapsed+command.startSecond+repeatDelay,scale:shareScale,durationScale})}tickClientConditions(b,0)}else applyMoveEffects(b,u,skill,u,true)}else for(const e of targets){applySkillConditions(b,e,skill,u);const damage=u.atk*(skill.attack/100)*(1+bingoAmount(u,'ATK of '+typeEnglish+'-Type Moves')/100)*(1-.15*mods.filter(v=>v==='scatter').length);hit(b,e,damage,u,skill.type);const repeats=mods.filter(v=>v==='whack').length;if(repeats){b.hitActions??=[];for(let i=1;i<=repeats;i++)b.hitActions.push({uid:u.uid,targetUid:e.uid,at:b.elapsed+skill.client.m_rapidDelay*i,damage,skillId:skill.id})}if(['ranged','dash','melee'].includes(skill.kind)&&!mods.includes('scatter'))break}}b.effects.push({type:'skill',x:u.x,y:u.y,radius:mods.includes('broad')?260:180,ttl:.8,color:sp(u.speciesId).color});if(b.records){b.records.movesUsed.push(skill.id);for(const kind of mods)b.records.moveStoneUsed[kind]=(b.records.moveStoneUsed[kind]||0)+1}b.log.unshift(`${sp(u.speciesId).name}：${skill.name}`);b.log=b.log.slice(0,12);return true}
export function scatter(b){
 if(b.status!=='fighting'||b.paused||b.scatterCooldown>0)return false;
 b.scatterCooldown=3;
 const players=b.units.filter(u=>!u.isEnemy&&u.hp>0),enemies=b.units.filter(u=>u.isEnemy&&u.hp>0);
 for(const [index,u] of players.entries()){
  let target;
  if(b.nativeNavigation){
   // Web escape adapter: retreat from the nearest enemy on the actual map.
   // Probe the existing straight-sweep collision routine without moving u.
   const enemy=enemies.reduce((best,e)=>!best||Math.hypot(e.x-u.x,e.y-u.y)<Math.hypot(best.x-u.x,best.y-u.y)?e:best,null);
   let dx=enemy?u.x-enemy.x:Math.cos(index*2*Math.PI/players.length),dy=enemy?u.y-enemy.y:Math.sin(index*2*Math.PI/players.length),length=Math.hypot(dx,dy);
   if(length<1e-6){dx=1;dy=0;length=1;}
   const probe={...u,nativeRoute:null};
   if(b.nativeNavigation.displace(probe,{x:u.x+dx/length*200,y:u.y+dy/length*200})){target={x:probe.x,y:probe.y,worldY:probe.worldY};}
  }else{
   const angle=Math.atan2(u.y-300,u.x-500);
   target={x:Math.max(45,Math.min(955,u.x+Math.cos(angle)*200)),y:Math.max(50,Math.min(550,u.y+Math.sin(angle)*200))};
  }
  u.nativeRoute=null;u.scatterTarget=target||null;u.scatterUntil=b.elapsed+3;
 }
 return true;
}
export function pauseBattle(b){b.paused=!b.paused;return b.paused}
export function battleHasDrops(b){return Object.values(b.drops?.ingredients||{}).some(v=>v>0)||!!b.drops?.stones?.length||!!b.drops?.moveStones?.length}
export function battleRetireUnlocked(g){if(g.clientFlags?.[159]!==undefined)return !!g.clientFlags[159];if(g.clientTutorialProgress!==undefined)return g.clientTutorialProgress>=56;return !!g.tutorial?.recruited}
export function battleRecoveryEnabled(g,b,recoveryUnlocked){return !!recoveryUnlocked&&canSpendTickets(g,battleRecoveryCost(b))&&battleHasDrops(b)}
export function battleRecoveryCost(b){return clientRecoveryTicketCost((b.clientStage?.m_stageLevel??b.level??0)+(b.plusStageLevel??0))}
function commitBattleDrops(g,b){const ingredients={...(b.drops?.ingredients||{})},stones=[...(b.drops?.stones||[])],moveStones=[...(b.drops?.moveStones||[])];for(const[id,amount]of Object.entries(ingredients))g.inventory[id]=(g.inventory[id]||0)+amount;g.stones.push(...stones);g.records.stonesObtained+=stones.length;g.moveStones.push(...moveStones);return{ingredients,stone:stones[0]||null,stones,moveStones}}
export function claimBattle(g,b,options={}){
 if(b.status==='fighting'||b.rewardClaimed)return null;
 const snapshot=JSON.parse(JSON.stringify(g));
 const reward=commitBattleResult(g,b,options);
 if(reward?.reason==='save-failed'){for(const key of Object.keys(g))delete g[key];Object.assign(g,snapshot);b.records=g.records;b.rewardClaimed=false;}
 return reward;
}
function commitBattleResult(g,b,{collectFailedDrops=false}={}){if(b.status==='fighting'||b.rewardClaimed)return null;const recoveryCost=collectFailedDrops&&b.status!=='won'?battleRecoveryCost(b):0;if(recoveryCost&&!battleHasDrops(b))return{ok:false,reason:'empty-drops',recoveryCost};if(!canSpendTickets(g,recoveryCost))return{ok:false,reason:'insufficient-tickets',recoveryCost};b.rewardClaimed=true;const activeExpedition=g.activeExpedition;markExpeditionSettled(g);hydrateGame(g);g.expeditions++;if(g.tutorial.completed&&!g.tutorial.recruited&&g.expeditions>=2)g.tutorial.phase='cook';for(const cooking of [g.cooking,...Object.values(g.extraCookings||{})])if(cooking&&!cooking.ready){cooking.remaining=Math.max(0,cooking.remaining-1);cooking.ready=cooking.remaining===0}const won=b.status==='won',ingredients={};for(const id of g.team){const m=g.monsters.find(v=>v.uid===id);const tier=(g.modifiers?.xpMultiplierByLevel||[]).filter(v=>m.level<=v.maxLevel).sort((a,c)=>a.maxLevel-c.maxLevel)[0];m.xp+=clientBattleExperience(stageXp(b.clientStage?.m_expRate||b.level),Math.max(0,b.wave-1),{won,retreated:b.status==='retreated',memberMultiplier:(tier?.multiplier||1)*(g.modifiers?.expeditionXpMultiplier||1)});while(m.level<100&&m.xp>=nextLevelXp(m.level)){m.xp-=nextLevelXp(m.level);m.level++;updateGrowth(m);recordLevel(g,m);if(g.records)g.records.levelUps++;if(evolve(m,g)&&g.records)g.records.evolutions++}}if(won){g.records.successful=(g.records.successful||0)+1;if(b.stageId==='tutorial'){g.tutorial.completed=true;g.tutorial.phase='stone'}else if(g.tutorial.completed&&!g.tutorial.recruited&&g.expeditions>=2)g.tutorial.phase='cook';const team=g.team.map(id=>g.monsters.find(m=>m.uid===id)),ranged=team.filter(m=>sp(m.speciesId).range).length;g.records.stageWins[b.stageId]=(g.records.stageWins[b.stageId]||0)+1;if(team.length===3){for(const type of sp(team[0].speciesId).types)if(team.every(m=>sp(m.speciesId).types.includes(type)))g.records.typeTeams[type]=(g.records.typeTeams[type]||0)+1;if(team.every(m=>sp(m.speciesId).evolveFrom))g.records.allTeamEvolved++}for(const m of team)for(const type of sp(m.speciesId).types)g.records.teamTypes[type]=(g.records.teamTypes[type]||0)+1;if(ranged===3)g.records.rangedTeams++;else if(ranged===0&&team.length===3)g.records.closeTeams++;else if(ranged===1&&team.length===3)g.records.mixed21++;else if(ranged===2&&team.length===3)g.records.mixed12++;if(b.stageId!=='tutorial'&&!g.cleared.includes(b.stageId))g.cleared.push(b.stageId);const {ingredients:collectedIngredients,stones,stone,moveStones}=commitBattleDrops(g,b);Object.assign(ingredients,collectedIngredients);g.expeditionBonus=b.goldDropped?0:(b.aroundCount??g.expeditionBonus)+1;if(!saveGame(g))return{ok:false,reason:'save-failed',message:'探险奖励保存失败，进度未提交。请重试。'};return{won,ingredients,stone,stones,moveStones:b.drops?.moveStones||[],tutorialCookingRequired:g.tutorial?.phase==='cook',cookingReady:!!g.cooking?.ready,recruited:null}}const collected=collectFailedDrops?commitBattleDrops(g,b):{ingredients:{},stone:null,stones:[],moveStones:[]};if(recoveryCost)spendTickets(g,recoveryCost);if(!saveGame(g))return{ok:false,reason:'save-failed',message:'探险奖励保存失败，进度未提交。请重试。'};return{won:false,...collected,recovered:collectFailedDrops,recoveryCost,tutorialCookingRequired:g.tutorial?.phase==='cook',cookingReady:!!g.cooking?.ready,recruited:null}}





export function trainingChance(g,m,supporters){const settings=CLIENT.misc.m_specialTraining.m_skill;return Math.min(1,(g.modifiers?.trainingChanceMultiplier||1)*supporters.reduce((sum,v)=>{const rate=sp(v.speciesId).client.m_Rate,row=CLIENT.trainingSkill[Math.min(CLIENT.trainingSkill.length-1,Math.max(0,v.level-1))].m_ratio,base=Math.max(settings.lowestLearnRatios[rate],row[rate]-(m.moveTrainingCount||0)*settings.learnCountRatio);return sum+base*trainingRelationMultiplier(m,v,settings)},0))}

export const learnableMoves = speciesId => MOVES.filter(v=>v.speciesDex.includes(sp(speciesId).dex));


function randomSlotKind(s,pot,modifiers={}){const raw=s.client;return weightedChoice([{kind:'hp',weight:raw.m_slotTypeWeightHp},{kind:'atk',weight:raw.m_slotTypeWeightAttack},{kind:'both',weight:raw.m_slotTypeWeightMulti*(modifiers.multiSlotMultiplier||1)}]).kind}
function weightedRecruit(pool,recipeId,tier){const dex=clientLotteryRecruit(recipeId,tier);return SPECIES.find(s=>s.dex===dex)||null}
export function bingoLabel(text){const pairs=[['ATK of','招式攻击力：'],['-Type Moves','属性招式'],['-Type','属性'],['Moves Wait','招式等待时间'],['Wait for Standard Attacks','普通攻击等待时间'],['Time To Recover','倒下复归时间'],['HP upon Recovery','复归时体力'],['Healing per Wave','每波回复'],['Healing from KO','击倒回复'],['Hit Healing','命中回复'],['Natural HP Healing','自然体力回复'],['Movement Speed','移动速度'],['Own Knockback Distance','自身被击退距离'],['Critical Hit Rate','暴击率'],['Critical Damage','暴击伤害'],['Taking Critical Hits Rate','被暴击率'],['Damage Taken','承受伤害'],['Resistant to Status Conditions','异常状态抗性'],['Pokemon Size Change','体型变化'],['Normal','一般'],['Fighting','格斗'],['Flying','飞行'],['Poison','毒'],['Ground','地面'],['Rock','岩石'],['Bug','虫'],['Ghost','幽灵'],['Steel','钢'],['Fire','火'],['Water','水'],['Grass','草'],['Electric','电'],['Psychic','超能力'],['Ice','冰'],['Dragon','龙'],['Burn Chance','灼伤概率'],['Confusion Chance','混乱概率'],['Sleep Chance','睡眠概率'],['Paralyze Chance','麻痹概率'],['Chance','概率']];for(const [en,zh] of pairs)text=text.replaceAll(en,zh);return text}

export function slotUnlockLevel(m,index){if(index<0||index>=9)return Infinity;if(gridSlotActive(growthState(m),index))return 1;const state=growthState(m);if(SOURCE_TO_GRID[state.next]!==index)return Infinity;const type=sp(m.speciesId).client.m_growType,count=slotCount(state.mask);const level=CLIENT.growth.findIndex(row=>Math.floor(row.m_progresses[type]??1)>count);return level<0?Infinity:level+1}
export const isSlotUnlocked=(m,index)=>gridSlotActive(growthState(m),index);




export function hydrateGame(g){for(const stone of g.stones||[])migrateSourceStoneResistance(stone);if(g.tutorial?.worldMapDialogCompleted===undefined&&g.tutorial?.recruited&&g.tutorial?.phase==='done'&&(g.cleared||[]).some(id=>id!=='tutorial')){g.tutorial.worldMapDialogCompleted=true;g.tutorial.visitorUnlockMigration='legacy-completed-tutorial';}g.tutorial??={completed:!!g.expeditions,recruited:g.monsters.length>=3,phase:g.monsters.length>=3?'done':'cook'};g.expeditionBonus??=Math.min(10,g.cleared?.length||0);g.modifiers??={};g.boxCapacity??={};for(const kind of ['monsters','stones'])g.boxCapacity[kind]=Number.isFinite(g.boxCapacity[kind])&&g.boxCapacity[kind]>=20?g.boxCapacity[kind]:Math.max(20,Math.ceil(((g[kind]?.length||0)+(kind==='stones'?(g.moveStones?.length||0):0))/20)*20);g.records??={};const r=g.records;for(const key of ['stonesObtained','cooked','levelTraining','moveTraining','dailyClaims','recycled','successful','rangedTeams','closeTeams','mixed21','mixed12','levelUps','evolutions','shinyBuddies','allTeamEvolved'])r[key]??=0;r.buddies??={};r.typeTeams??={};r.stageWins??={};r.recipes??=[];r.level50Reached??=[];r.level100Reached??=[];r.kills??={};r.defeatedSpecies??={};r.teamTypes??={};r.moveStoneUsed??={};r.movesUsed??=[];g.moveStones??=[];for(const stone of g.moveStones){if(!stone.source){const group=CLIENT.skillStoneGroups.find(row=>SOURCE_SKILL_STONE_KINDS[row.m_id]===stone.kind);if(group)stone.source={version:1,...originalCreateSkillStonePlan(group)};}}g.inventory??={};for(const i of INGREDIENTS)g.inventory[i.id]??=0;for(const m of g.monsters){m.slots??=Array(9).fill(null);growthState(m);m.slotKinds??=Array.from({length:9},(_,i)=>i%2?'atk':'hp');m.moveSlots??=m.moves.map(()=>[]);m.ivHp??=0;m.ivAtk??=0;m.potBonus??=0;m.moveTrainingCount??=0;const pools=learnableMoves(m.speciesId);m.moves=m.moves.filter(id=>pools.some(v=>v.id===id)||(m.clientFixedSpec?.m_uniqueSkills||[]).some(sourceID=>MOVES.find(v=>v.clientId===sourceID)?.id===id));if(!m.moves.length)m.moves=[pools[0].id];m.bingo??=SPECIES_FACTS[String(sp(m.speciesId).dex).padStart(3,'0')].bingos.map(pool=>pick(pool));if(!m.sourceBingo&&m.clientBingoPropertyIndices){m.sourceBingo={version:1,indices:[...m.clientBingoPropertyIndices],packed:originalEncodeBingoIndices(m.clientBingoPropertyIndices)};}if(m.sourceBingo)m.bingo=originalBingoTexts(sp(m.speciesId).dex,m.sourceBingo.packed);else{const migrated=originalMigrateBingoTexts(sp(m.speciesId).dex,m.bingo);if(migrated.resolved){m.sourceBingo={version:1,indices:migrated.indices,packed:migrated.packed};delete m.bingoMigration;}else m.bingoMigration={unresolved:migrated.unresolved};}}return g}

function bingoAmount(unit,prefix){return (unit.bingos||[]).filter(v=>v.startsWith(prefix+' ')).reduce((n,v)=>n+(Number(v.match(/[-+](\d+)%?/)?.[1])||0),0)}



export const TUTORIAL_STAGE={id:'tutorial',name:'初次探险',region:1,level:1,power:null,bossSpecies:['Rattata'],isTutorial:true};
export const STONE_BONUSES=[{id:'criticalRate',name:'暴击率',max:100},{id:'criticalDamage',name:'暴击伤害',max:100},{id:'naturalHealing',name:'自然回复',max:100},{id:'hitHealing',name:'命中回复',max:10},{id:'koHealing',name:'击倒回复',max:10},{id:'recoveryTime',name:'复归时间缩短',max:100},{id:'recoveryHp',name:'复归体力',max:100},{id:'effectResistance',name:'效果抗性',max:100},{id:'statusResistance',name:'异常状态抗性',max:100},{id:'movementSpeed',name:'移动速度',max:200}];
/** Source passive lottery. forceFour is the creator flag, not an extra reward. */
export function rollPowerStone(rank,forceFour=false,ranges={rangeInt:(min,max)=>min+Math.floor(Math.random()*(max-min)),rangeFloat:(min,max)=>min+Math.random()*(max-min)}){
 const plan=originalCreatePassiveStonePlan(rank,{...ranges,tutorial:false,forceFour});
 const first=plan.commands[0],kind=first.commandID===2?'hp':'atk',bonus={},mapping={26:'criticalRate',27:'criticalDamage',23:'movementSpeed',14:'naturalHealing',40:'hitHealing',41:'koHealing',28:'recoveryTime',29:'recoveryHp',48:'effectResistance',49:'statusResistance'};
 for(const c of plan.commands.slice(1)){const key=mapping[c.commandID];if(!key)continue;let v=c.params[0]*100;if([28,48,49].includes(c.commandID))v=-v;bonus[key]=(bonus[key]||0)+Math.round(v*100)/100;}
 return{id:uid(),kind,value:Math.trunc(first.params[0]),rarity:['normal','bronze','silver','gold'][Math.min(3,plan.commands.length-1)],bonus,source:{version:1,header:plan.header,commands:plan.commands}};
}
function clientPropertyValue(command,rank){const property=CLIENT.stoneProperties.find(v=>v.m_commandID===command),cfg=CLIENT.misc.m_battle.m_drop.m_passiveProperty,r=Math.max(1,Math.min(cfg.m_stageRankThreshold,rank));const max=property.m_rankMin+(property.m_rankMax-property.m_rankMin)*Math.pow(r/cfg.m_stageRankThreshold,cfg.m_calcMaxValueA),idx=cfg.m_calcMinRatioStageLevels.findIndex(level=>rank>=level),ratio=cfg.m_calcMinRatios[Math.max(0,idx)],min=property.m_rankMin<0?Math.min(max*ratio,property.m_rankMin):Math.max(max*ratio,property.m_rankMin),lo=Math.min(min,max),hi=Math.max(min,max),value=lo+Math.random()*(hi-lo);return Math.max(lo,Math.min(hi,value-value%property.m_increment))}
export function stageStats(g,m,stage,baseStats=null){const s=baseStats||monsterStats(g,m),region=stage&&REGIONS.find(r=>r.id===stage.region),map={Fighting:'格斗',Fire:'火',Grass:'草',Flying:'飞行',Water:'水',Bug:'虫',Rock:'岩石',Ground:'地面',Psychic:'超能力',Electric:'电'};if(region&&sp(m.speciesId).types.includes(map[region.bonusType])){s.hp+=Number(stage.bonusHp||0);s.atk+=Number(stage.bonusAtk||0);const multiplier=stage.bonusMultiplier||1.5;s.hp=Math.round(s.hp*multiplier);s.atk=Math.round(s.atk*multiplier)}return s}

function applySkillConditions(b,target,skill,source,linkedCommands,mods=[]){const program=CLIENT_SKILL_PROGRAMS['Skill_'+skill.client?.m_skillPath];if(!program)return applyMoveEffects(b,target,skill,source);for(const command of (linkedCommands||program.sections.flatMap(v=>v.additional)).filter(v=>v.name==='Condition')){const data=CLIENT.conditions.find(v=>v.m_id===command.data.dataID);if(!data)continue;const category=CLIENT.conditionTypes.find(v=>v.m_id===data.m_type)?.m_category,resist=Math.max(CLIENT.conditionParameters.m_resistBadConditionClamp.min,Math.min(CLIENT.conditionParameters.m_resistBadConditionClamp.max,conditionSum(target,7)-conditionSum(target,8))),prob=originalLinkedConditionChance({ratio:data.m_ratio,activeRatio:command.data.activeRatio,category,resistance:resist,typeMultiplier:originalTargetConditionMultiplier(target,data.m_type)});if(command.data.isForce||Math.floor(Math.random()*100)<prob*100)applyClientCondition(target,data.m_id,1,1+.25*mods.filter(v=>v==='stay').length)}}
function applyMoveEffects(b,target,skill,source,guaranteed=false,duration=6){target.statuses??={};const ailments=['asleep','burned','confused','frozen','paralyzed','poisoned'],positive=['damageup','defenseup','speedup','resistanceup'];for(const effect of skill.effects||[]){if(positive.includes(effect)){if(target===source||guaranteed)target.statuses[effect]=duration;continue}const isAilment=ailments.includes(effect),resist=(target.stoneBonus?.[isAilment?'statusResistance':'effectResistance']||0)+(isAilment?bingoAmount(target,'Resistant to Status Conditions'):0)+(target.statuses.resistanceup?50:0),specific={asleep:'Sleep Chance',burned:'Burn Chance',confused:'Confusion Chance',paralyzed:'Paralyze Chance',poisoned:'Poison Chance'}[effect];if(specific&&bingoAmount(target,specific)>=100)continue;const chance=(guaranteed?1:.25)*Math.max(0,1-resist/100);if(Math.random()<chance){target.statuses[effect]=duration;b.effects.push({type:'status',x:target.x,y:target.y,ttl:.8,value:STATUS_LABELS[effect]||effect,color:'#d6b5eb'})}}}
export const STATUS_LABELS={asleep:'睡眠',burned:'灼伤',confused:'混乱',frozen:'冰冻',paralyzed:'麻痹',poisoned:'中毒',damagedown:'攻击下降',damageup:'攻击提升',defensedown:'防御下降',defenseup:'防御提升',resistanceup:'抗性提升',speeddown:'减速',speedup:'加速'};


function registerEnemyDefeat(b,t){
 t.dropGenerated=true;
 if(b.records){const species=sp(t.speciesId);b.records.defeatedSpecies??={};b.records.defeatedSpecies[species.dex]=true;for(const type of species.types)b.records.kills[type]=(b.records.kills[type]||0)+1;}
 if(t.isBoss)b.lastDeadBoss=t;
 else spawnDrop(b,t);
}
function spawnDrop(b,t,{isLastDrop=false,isForceDropStone=false}={}){
 const enemy=t.clientEnemy,p=CLIENT_STAGES.dropProbabilities.m_enemys[enemy?.m_dropType??0];if(!p)return;
 if(!Number.isInteger(t.dropSeedForEnemy)||!Number.isInteger(t.dropSeedForDropManager))Object.assign(t,allocateOriginalEnemyDropSeeds(b.dropSeedData));
 const add=item=>{b.loot.push({id:uid(),x:t.x,y:t.y,...item});b.effects.push({type:'drop',x:t.x,y:t.y,ttl:1,color:item.type==='ingredient'?'#ffd96b':'#59bddd'})};
 const fixed=originalFixedDropDescription(enemy||{},{battleOption1Enabled:b.stageId==='tutorial',isEnemyDataTutorial:enemy?.m_fixDropGroup!==undefined});
 const plan=b.dropRandom.withSeed(t.dropSeedForEnemy,ranges=>originalEnemyDropGroupPlan({probability:p,stageRank:b.clientStage.m_stageLevel,stageStoneMax:b.clientStage.m_dropStoneMax,stageStoneCount:b.stoneDropsGenerated||0,isDropFix:fixed.isDropFix,fixDropGroup:fixed.fixDropGroup,isLastDrop,isForceDropStone,...ranges}));
 b.stoneDropsGenerated=plan.stageStoneCount;
 b.dropRandom.withSeed(t.dropSeedForDropManager,ranges=>{
 const {rangeInt}=ranges,itemCounts=new Map();
 for(const group of plan.groups){
  if(group===1){
   if(b.stageId==='tutorial'){
    const m=b.tutorialMonster;add({type:'stone',stone:{id:uid(),kind:m.slotKinds[0]==='atk'?'atk':'hp',value:50,rarity:'normal',bonus:{}}});
   }else{
    const forceFour=isForceDropStone&&(b.aroundCount??0)>=CLIENT.misc.m_battle.m_drop.m_propertyNum.m_rareDropAroundNum;
    const kind=forceFour?0:originalLotteryDropRow(CLIENT.stoneTypes.filter(v=>b.clientStage.m_stageLevel>=v.m_openRank).map(v=>({weight:v.m_weight,type:v.m_type})),rangeInt).type;
    if(kind===1){
     const row=originalLotterySkillStoneGroup(b.clientStage.m_stageLevel,rangeInt);
     if(row)add({type:'moveStone',stone:{id:uid(),kind:SOURCE_SKILL_STONE_KINDS[row.m_id],source:{version:1,...originalCreateSkillStonePlan(row)}}});
    }else{
     const stone=rollPowerStone(b.clientStage.m_stageLevel,forceFour,ranges);
     if(forceFour){b.aroundCount=0;b.goldDropped=true;}
     add({type:'stone',stone});
    }
   }
  }else{
   const row=CLIENT_STAGES.stageDropWeights.m_datas[b.clientStage.m_itemDropWeightID],ratio=id=>originalStageDropItemRatio(row||{},id)||0;
   const id=fixed.isDropFix?fixed.fixDropItem:originalLotteryDropItem(originalDropItemWeights(CLIENT_STAGES.dropItemWeights,b.clientStage.m_stageLevel,ratio),rangeInt);
   itemCounts.set(id,(itemCounts.get(id)||0)+1);
  }
 }
 for(const [id,count]of itemCounts){
  const ingredient=INGREDIENTS.find(i=>i.clientId===id);if(!ingredient)continue;
  const amount=originalDropItemQuantity(count,b.dropModifiers?.ingredientMultiplier?.[ingredient.color]??1);
  if(amount>0)add({type:'ingredient',ingredientId:ingredient.id,amount});
 }
 });
}
function collectDrops(b,dt,finish=false){const allies=b.units.filter(u=>!u.isEnemy&&u.hp>0);if(!allies.length)return;b.loot=b.loot.filter(item=>{const target=allies.reduce((a,c)=>Math.hypot(a.x-item.x,a.y-item.y)<Math.hypot(c.x-item.x,c.y-item.y)?a:c),distance=Math.hypot(target.x-item.x,target.y-item.y);if(finish||distance<24){if(item.type==='ingredient')b.drops.ingredients[item.ingredientId]=(b.drops.ingredients[item.ingredientId]||0)+item.amount;else if(item.type==='stone')b.drops.stones.push(item.stone);else b.drops.moveStones.push(item.stone);return false}const step=Math.min(distance,240*dt);item.x+=(target.x-item.x)/distance*step;item.y+=(target.y-item.y)/distance*step;return true})}

function recordBuddies(g,monsters){hydrateGame(g);for(const m of monsters){for(const type of sp(m.speciesId).types)g.records.buddies[type]=(g.records.buddies[type]||0)+1;if(m.shiny===true)g.records.shinyBuddies++}}
function recordLevel(g,m){for(const level of [50,100])if(m.level===level){const list=g.records['level'+level+'Reached'];if(!list.includes(m.uid))list.push(m.uid)}}

export function expandBox(g,...args){return gameSaveTransaction(g,saveGame,()=>expandBoxCore(g,...args));}
function expandBoxCore(g,kind){hydrateGame(g);if(!['monsters','stones'].includes(kind))return result(false,'无效盒子');if(g.boxCapacity[kind]>=300)return result(false,'容量已达上限');if(!spendTickets(g,50))return result(false,'需要50张礼券');g.boxCapacity[kind]=Math.min(300,g.boxCapacity[kind]+20);return result(true,'盒子容量增加20格',{capacity:g.boxCapacity[kind]})}

function clientTalent(pot,kind){const raw=CLIENT.talents[POTS.indexOf(pot)],low=raw[kind==='hp'?'m_hpLower':'m_atkLower'],high=raw[kind==='hp'?'m_hpHigher':'m_atkHigher'];return low+Math.floor(Math.random()*(high-low+1))}
export function nextLevelXp(level){return level>=100?0:Math.trunc(Math.fround(Math.pow(Math.fround(level+1),2.5)))}

function evolutionRoot(id){let s=sp(id);while(s.evolveFrom&&sp(s.evolveFrom))s=sp(s.evolveFrom);return s.id}
function trainingRelationMultiplier(m,v,settings){return(sp(m.speciesId).types.some(t=>sp(v.speciesId).types.includes(t))?settings.typeRatio:1)*(evolutionRoot(m.speciesId)===evolutionRoot(v.speciesId)?settings.groupRatio:1)}
export function trainingXpGain(g,m,supporters){const settings=CLIENT.misc.m_specialTraining.m_exp;return supporters.reduce((sum,v)=>{const rate=sp(v.speciesId).client.m_Rate,row=CLIENT.trainingXp[Math.min(CLIENT.trainingXp.length-1,Math.max(0,v.level-1))].m_exps,base=Math.max(row[rate],nextLevelXp(m.level)*settings.lowestExpRatios[rate]);return sum+Math.round(base*trainingRelationMultiplier(m,v,settings))},0)}
export function stageXp(stageLevel,multiplier=1){const p=CLIENT.misc.m_battle.m_result;return Math.trunc(Math.fround(Math.fround(Math.pow(Math.fround(stageLevel+1),2.5))*Math.fround(p.m_expCalclateRate_A-p.m_expCalclateRate_B*(stageLevel-1))*multiplier))}

function weightedChoice(rows){let value=Math.random()*rows.reduce((n,r)=>n+r.weight,0);for(const r of rows){value-=r.weight;if(value<0)return r}return rows.at(-1)}
function clientBattlePhases(stage){const groups=[];for(const [registerIndex,instruction] of clientSpawnInstructions(stage).entries()){if(instruction.m_setType===0||!groups.length)groups.push([]);groups.at(-1).push(...Array.from({length:instruction.min+Math.floor(Math.random()*(instruction.max-instruction.min+1))},()=>{const e=weightedChoice(instruction.candidates).enemy,rate=stage.m_enemyRate;return{dex:e.m_monsterNo,hp:Math.trunc(Math.fround((e.m_hpBasis+stage.m_stageLevel)*Math.fround(3.5+Math.fround(1.09)*rate))),attack:Math.trunc(Math.fround((e.m_attackBasis+stage.m_stageLevel)*Math.fround(.07+Math.fround(.0075)*rate))),isBoss:instruction.isBoss,clientEnemy:e,spawnInstruction:instruction,registerIndex}}));}return groups}

function recordMaxStats(g){if(!g.records||!g.stones)return;for(const m of g.monsters){const value=monsterStats(g,m);g.records.maxHp=Math.max(g.records.maxHp||0,value.hp);g.records.maxAtk=Math.max(g.records.maxAtk||0,value.atk)}g.records.maxPower=Math.max(g.records.maxPower||0,teamPower(g))}

// The layout owns Unity-world to simulation conversion. Call once after the
// original map tiles have been selected, before the battle starts ticking.
function configureNativeUnit(b,u){
 const species=sp(u.speciesId),ranged=u.clientEnemy?.m_normalSkillRangeType??u.skillRangeType??(species.range?1:0);
 const types=[species.client.m_type1,species.client.m_type2].filter(type=>Number.isInteger(type)&&type>=0&&type<18);
 const normal=clientNormalAttack({normalSkillId:u.normalSkillId,type:u.normalSkillId==null?(pick(types)??0):0,range:ranged?1:0});
 if(normal){u.normalSkillId=normal.clientId;u.normalAttack={...normal,type:clientTypeNames[normal.type]};u.range=normal.range/b.worldScale;}const setting=u.isEnemy?CLIENT.enemySetting:CLIENT.selfSetting;
 u.nativeMoveAcceleration=setting.m_navMeshAgent.m_acceleration*(u.clientEnemy?.m_characterSettingParameterPercent?.m_navMeshAgent.m_acceleration??1);
 u.nativeMoveSpeed=setting.m_navMeshAgent.m_speed*(u.clientEnemy?.m_characterSettingParameterPercent?.m_navMeshAgent.m_speed??1)/b.worldScale;
 const plan=b.worldLayout?.plan,anchor=u.isEnemy?plan?.rows?.[u.registerIndex]:plan?.player;
 if(anchor&&!u.nativePositionConfigured){
  const position=anchor.position.slice(),peers=b.units.filter(v=>v.isEnemy===u.isEnemy&&(!u.isEnemy||v.registerIndex===u.registerIndex)),index=peers.findIndex(v=>v.uid===u.uid);
  // Original marker and wave assignment are recovered. Individual placement
  // inside enemy spawnRadius remains provisional. Player offsets use source
  // FormationData and source Ready path-corner basis. Missing Web route uses
  // explicit world X/Z fallback; it is not a recovered original path.
  // Enemy circle sampling occurs only when its source spawn timer attempts.
  if(!u.isEnemy){const offsets=originalPlayerFormationOffsets(peers.map(v=>v.skillRangeType??(sp(v.speciesId).range?1:0))),offset=offsets?.[index];if(offset){const basis=b.nativeFormationBasis||{right:{x:1,y:0,z:0},forward:{x:0,y:0,z:1}};for(const [i,k]of ["x","y","z"].entries())position[i]+=basis.right[k]*offset.x+basis.forward[k]*offset.z;}}
  const point=b.worldLayout.worldToSimulation?b.worldLayout.worldToSimulation(position):{x:position[0]/b.worldScale+500,y:position[2]/b.worldScale+330,worldY:position[1]};
  u.x=point.x;u.y=point.y;u.worldY=point.worldY??position[1];u.nativeSpawnAnchor=anchor.position.slice();u.nativeSpawnSimulation={x:point.x,y:point.y,worldY:u.worldY};u.nativePositionConfigured=true;
 }
 return u;
}
export function configureBattleWorld(b,layout={}){b.worldLayout=layout;b.worldScale=layout.worldScale||.035;b.nativeSkillPrograms=true;b.nativeNavigation=layout.navigationScene||layout.tiles?createBattleNavigation(layout):null;const origin=layout.plan?.player?.position,target=layout.plan?.rows?.find(r=>r.pointType===0)?.position,corners=origin&&target?b.nativeNavigation?.findPath(origin,target):null;b.nativeFormationBasis=origin?originalFormationNavigationBasis({x:origin[0],y:origin[1],z:origin[2]},corners?.map(p=>({x:p[0],y:p[1],z:p[2]}))):null;for(const u of b.units)configureNativeUnit(b,u);if(!b.nativeSpawnQueueInitialized){queueNativeEnemySpawns(b);b.nativeSpawnQueueInitialized=!b.nativeSpawnPlacementUnavailable;}return b}


function queueNativeEnemySpawns(b){
 if(!Array.isArray(b.worldLayout?.plan?.rows)||typeof b.worldLayout?.spawnRaycast!=='function'){b.nativeSpawnPlacementUnavailable=true;return;}
 b.nativeSpawnPlacementUnavailable=false;
 const enemies=b.units.filter(u=>u.isEnemy&&!u.nativeSpawnQueued&&!u.nativeSpawnActivated);if(!enemies.length)return;
 b.nativePendingSpawns??=[];
 for(const u of enemies){let group=b.nativePendingSpawns.find(v=>v.registerIndex===u.registerIndex&&v.wave===b.wave);
 if(!group){group={registerIndex:u.registerIndex,wave:b.wave,units:[],timer:createOriginalSpawnTimer()};b.nativePendingSpawns.push(group);}u.nativeSpawnQueued=true;group.units.push(u);}
 const queued=new Set(enemies);b.units=b.units.filter(u=>!queued.has(u));
 // Original spawnobject encounter/eye activation is not yet reconstructed.
 b.nativeSpawnActivationApproximation=true;
}
function tickNativeEnemySpawns(b,dt){
 if(!b.worldLayout)return;
 for(const group of b.nativePendingSpawns||[]){if(!group.units.length||!tickOriginalSpawnTimer(group.timer,dt))continue;
 const u=group.units[0],anchor=b.worldLayout.plan?.rows?.[u.registerIndex];if(!anchor)continue;
 const raycast=b.worldLayout.spawnRaycast;
 if(typeof raycast!=='function'){b.nativeSpawnRaycastUnavailable=true;continue;}
 const p=anchor.position,hit=attemptOriginalEnemySpawnPosition({x:p[0],y:p[1],z:p[2]},
 {isFixPosition:!!u.spawnInstruction?.m_isFixPosition,spawnRadius:anchor.radius||0},
 {sampleUnitCircle:()=>approximateUnitDiskSample(b.nativeSpawnRandom||Math.random),raycast});
 if(!hit)continue;
 // Web adapter: reject a ray hit outside navigation before creating an actor.
 // Retry through the existing source spawn timer; never move an active enemy.
 if(b.nativeNavigation&&!b.nativeNavigation.sample([hit.x,hit.y,hit.z])){b.nativeSpawnNavigationRejectionApproximation=true;continue;}
 const point=b.worldLayout.worldToSimulation([hit.x,hit.y,hit.z]);u.x=point.x;u.y=point.y;u.worldY=hit.y;
 u.nativeSpawnSimulation={x:u.x,y:u.y,worldY:u.worldY};u.nativePositionConfigured=true;
 u.nativeSpawnRandomApproximation=!u.spawnInstruction?.m_isFixPosition;
 group.units.shift();u.nativeSpawnQueued=false;u.nativeSpawnActivated=true;b.units.push(u);
 }
}
