import {gameSaveTransaction} from './game-save-transaction.js';
import {questTicketResult} from './client-quest-contract.js';
export {recordLocalBackup} from './client-quest-contract.js';
import {spendTickets} from './offline-currency.js';
// Publicly documented international Quest decorations and quest rewards.
// Tables used for transcription: docs/shop-reference.json, docs/quest-reference.json.
import {CLIENT_META} from './client-meta-data.js';
import {CLIENT_QUESTS} from './client-quests.js';
import {saveGame,SPECIES,REGIONS,monsterStats,teamPower,activeBingos,INGREDIENTS,makeMoveStone} from './engine.js';
export const DECORATIONS=[
 ['flareon-cushion','火伊布坐垫',50,'红色食材掉落数量 ×1.5','ingredient:red:1.5','▰'],
 ['vaporeon-cushion','水伊布坐垫',50,'蓝色食材掉落数量 ×1.5','ingredient:blue:1.5','▰'],
 ['jolteon-cushion','雷伊布坐垫',50,'黄色食材掉落数量 ×1.5','ingredient:yellow:1.5','▰'],
 ['dodrio-tent','嘟嘟利帐篷',50,'灰色食材掉落数量 ×1.5','ingredient:gray:1.5','△'],
 ['squirtle-flag','杰尼龟旗帜',100,'回收方石获得的食材 ×1.5','recycle:1.5','⚑'],
 ['bulbasaur-flag','妙蛙种子旗帜',150,'升级特训获得的经验 ×1.5','trainingXp:1.5','⚑'],
 ['charmander-flag','小火龙旗帜',200,'招式特训成功率 ×1.5','trainingChance:1.5','⚑'],
 ['victreebel-golf-bag','大食花高尔夫球袋',200,'吸引双属性石槽伙伴的概率 ×1.5','multiSlot:1.5','▥'],
 ['charizard-torch','喷火龙火炬',300,'红色食材掉落数量 ×2','ingredient:red:2','♜'],
 ['blastoise-fountain','水箭龟喷泉',300,'蓝色食材掉落数量 ×2','ingredient:blue:2','♧'],
 ['venusaur-planter','妙蛙花花坛',300,'黄色食材掉落数量 ×2','ingredient:yellow:2','❀'],
 ['mechanical-tauros','肯泰罗机械牛',300,'灰色食材掉落数量 ×2','ingredient:gray:2','▧'],
 ['meowth-balloon','喵喵气球',400,'回收方石获得的食材 ×2','recycle:2','○'],
 ['pikachu-surfboard','皮卡丘冲浪板',400,'料理吸引多个伙伴的概率 ×1.5','multipleRecruit:1.5','▱'],
 ['fearow-weathervane','大嘴雀风向仪',500,'升级特训获得的经验 ×2','trainingXp:2','↗'],
 ['ditto-balloon','百变怪气球',700,'招式特训成功率 ×2','trainingChance:2','○'],
 ['kangaskhan-swing-chair','袋兽摇椅',800,'吸引双属性石槽伙伴的概率 ×2','multiSlot:2','▥'],
 ['mewtwo-arch','超梦拱门',700,'电池最大格数 +1','battery:1','Π'],
 ['prolific-statue','繁盛之像',null,'Lv.5 以下探险经验 ×1.5','xp:5:1.5','♜','1-B'],
 ['spring-showers-statue','春雨之像',null,'Lv.10 以下探险经验 ×1.5','xp:10:1.5','♜','2-B'],
 ['flourishing-statue','兴隆之像',null,'Lv.15 以下探险经验 ×1.5','xp:15:1.5','♜','3-B'],
 ['tranquility-statue','安宁之像',null,'Lv.20 以下探险经验 ×1.5','xp:20:1.5','♜','4-B'],
 ['gentle-breeze-statue','微风之像',null,'Lv.25 以下探险经验 ×1.5','xp:25:1.5','♜','5-B'],
 ['abundance-statue','丰饶之像',null,'Lv.30 以下探险经验 ×1.5','xp:30:1.5','♜','6-B'],
 ['purification-statue','净化之像',null,'Lv.35 以下探险经验 ×1.5','xp:35:1.5','♜','7-B'],
 ['burning-mane-statue','燃鬃之像',null,'Lv.40 以下探险经验 ×1.5','xp:40:1.5','♜','8-B'],
 ['longevity-statue','长寿之像',null,'Lv.50 以下探险经验 ×1.5','xp:50:1.5','♜','9-B'],
 ['reverent-statue','敬奉之像',null,'Lv.60 以下探险经验 ×1.5','xp:60:1.5','♜','10-B'],
 ['premier-ball-model','纪念球模型',null,'每日礼券额外 +10','daily:10','◉','shop10']
].map(([id,name,cost,desc,effect,icon,unlock])=>({id,name,cost,desc,effect,icon,unlock}));
const shopLegacy=['flareon-cushion','charizard-torch','vaporeon-cushion','blastoise-fountain','jolteon-cushion','venusaur-planter','dodrio-tent','mechanical-tauros','bulbasaur-flag','fearow-weathervane','charmander-flag','ditto-balloon','squirtle-flag','meowth-balloon','victreebel-golf-bag','kangaskhan-swing-chair','pikachu-surfboard','mewtwo-arch'];
const effectFromClient=d=>{const [a,b]=d.m_effectValue;return ({1:`expeditionXp:${a}`,2:`battery:${a}`,3:`multipleRecruit:${a}`,4:`ingredient:${['all','red','blue','yellow','gray'][b]}:${a}`,5:`trainingXp:${a}`,6:`trainingChance:${a}`,7:`recycle:${a}`,8:`multiSlot:${a}`,9:`xp:${b}:${a}`,10:`daily:${a}`})[d.m_effectID];};
for(const [i,shop] of CLIENT_META.shop.m_datas.entries()){const d=DECORATIONS.find(d=>d.id===shopLegacy[i]),raw=CLIENT_META.goods.m_datas.find(d=>d.m_id===shop.m_goodsID);Object.assign(d,{cost:shop.m_price,name:CLIENT_META.base_object[raw.m_mstxtID],effect:effectFromClient(raw),sourceId:raw.m_id,iconPath:raw.m_iconPath});}
for(const [i,treasure]of CLIENT_META.treasures.m_datas.entries()){const raw=CLIENT_META.goods.m_datas.find(d=>d.m_id===treasure.m_goodsID),d=DECORATIONS.find(d=>d.unlock&&d.unlock!=='shop10'&&d.effect.startsWith(`xp:`)&&!d.sourceId);if(d)Object.assign(d,{sourceId:raw.m_id,name:CLIENT_META.base_object[raw.m_mstxtID],effect:effectFromClient(raw),unlock:`areas:${treasure.m_dungeonClearNum}`,iconPath:raw.m_iconPath});}
const premier=DECORATIONS.find(d=>d.id==='premier-ball-model'),premierRaw=CLIENT_META.goods.m_datas.find(d=>d.m_id===403);Object.assign(premier,{sourceId:403,name:CLIENT_META.base_object[premierRaw.m_mstxtID],effect:effectFromClient(premierRaw)});
export function registerPackDecoration(raw){let d=DECORATIONS.find(d=>d.sourceId===raw.m_id);if(d)return d;d={id:`pack-goods-${raw.m_id}`,sourceId:raw.m_id,name:CLIENT_META.base_object[raw.m_mstxtID],cost:null,desc:'礼包装饰：持有效果自动生效',effect:effectFromClient(raw),icon:'◆',iconPath:raw.m_iconPath};if(!d.effect)throw Error('Unsupported pack decoration effect');DECORATIONS.push(d);return d;}
export function initMeta(g){g.questRewards??=[];g.decorations??=[];g.discovered??=[];g.records??={};g.placedDecorations??=[];for(const m of g.monsters)if(!g.discovered.includes(m.speciesId))g.discovered.push(m.speciesId);for(const d of DECORATIONS)if(d.unlock&&(d.unlock==='shop10'?g.decorations.filter(id=>DECORATIONS.find(d=>d.id===id)?.cost!=null).length>=10:d.unlock.startsWith('areas:')?g.cleared.filter(id=>id.endsWith('-B')&&!id.startsWith('12-')).length>=+d.unlock.split(':')[1]:g.cleared.includes(d.unlock))&&!g.decorations.includes(d.id))g.decorations.push(d.id);applyModifiers(g);return g;}
export function applyModifiers(g){const m={batteryCapacity:5,ingredientMultiplier:{red:1,blue:1,yellow:1,gray:1},xpMultiplierByLevel:[],expeditionXpMultiplier:1,trainingXpMultiplier:1,trainingChanceMultiplier:1,recycleMultiplier:1,multipleRecruitMultiplier:1,multiSlotMultiplier:1,dailyTicketsBonus:0};for(const id of g.decorations){const d=DECORATIONS.find(d=>d.id===id);if(!d)continue;const[k,a,b]=d.effect.split(':');if(k==='ingredient'){for(const color of a==='all'?Object.keys(m.ingredientMultiplier):[a])m.ingredientMultiplier[color]*=+b;}else if(k==='expeditionXp')m.expeditionXpMultiplier*=+a;else if(k==='xp')m.xpMultiplierByLevel.push({maxLevel:+a,multiplier:+b});else if(k==='battery')m.batteryCapacity+=+a;else if(k==='daily')m.dailyTicketsBonus+=+a;else m[{trainingXp:'trainingXpMultiplier',trainingChance:'trainingChanceMultiplier',recycle:'recycleMultiplier',multipleRecruit:'multipleRecruitMultiplier',multiSlot:'multiSlotMultiplier'}[k]]*=+a;}g.modifiers=m;return m;}
export function purchaseDecoration(g,...args){return gameSaveTransaction(g,saveGame,()=>purchaseDecorationCore(g,...args));}
function purchaseDecorationCore(g,id){const d=DECORATIONS.find(x=>x.id===id);if(!d||d.cost===null)return{ok:false,message:'该物品通过探险或成就获得'};if(g.decorations.includes(id))return{ok:false,message:'已经拥有'};if(!spendTickets(g,d.cost))return{ok:false,message:'礼券不足'};g.decorations.push(id);g.records.shopping=(g.records.shopping||0)+1;initMeta(g);return{ok:true,message:`购入${d.name}，效果已生效`};}
export function record(g,key,n=1){g.records??={};g.records[key]=(g.records[key]||0)+n;}
export const QUESTS=CLIENT_QUESTS.map(q=>q.sourceId===1022?{...q,unavailable:false,sourceUnavailable:true,adaptation:'local-export',description:'已创建本地存档备份（单机导出适配）。'}:q);
export function questOpened(g,q){const raw=CLIENT_META.achievements.m_datas.find(row=>row.m_id===q.sourceId);if(raw?.m_isVisible)return true;if(q.unlockSourceId){const dependencies=QUESTS.filter(row=>row.sourceId===q.unlockSourceId);return dependencies.length>0&&dependencies.every(row=>questProgress(g,row)>=row.goal);}return QUESTS.some(row=>row.sourceId===q.sourceId&&questClaimed(g,row))||QUESTS.some(row=>row.sourceId===q.sourceId&&questProgress(g,row)>=row.goal);}
export function questClaimed(g,q){return (g.questRewards||[]).includes(q.id)||q.aliases?.some(id=>(g.questRewards||[]).includes(id))||false;}
export function questProgress(g,q){const[k,a]=q.metric.split(':');if(['buddies','kills','typeTeams','moveStoneUsed','stageWins'].includes(k))return g.records[k]?.[a]||0;if(k==='distinctMoves')return new Set(g.records.movesUsed||[]).size;if(k==='recipes')return new Set(g.records.recipes||[]).size;if(k==='reachedLevel')return (g.records[`level${a}Reached`]?.length||0);if(k==='maxStat')return Math.max(g.records[a==='atk'?'maxAtk':'maxHp']||0,...g.monsters.map(m=>monsterStats(g,m)[a]));if(k==='purchasedDecorations')return g.decorations.filter(id=>DECORATIONS.find(d=>d.id===id)?.cost!=null).length;if(k==='placed')return g.placedDecorations.length;if(k==='equipped')return g.monsters.reduce((n,m)=>n+m.slots.filter(Boolean).length,0);if(k==='stones')return g.records.stonesObtained||g.stones.length;if(k==='dex')return new Set(g.discovered).size;if(k==='bingo')return Math.max(0,...g.monsters.map(activeBingos));if(k==='power')return Math.max(g.records.maxPower||0,teamPower(g));if(k==='region')return g.cleared.includes(`${a}-B`)?1:0;if(k==='species')return g.discovered.includes(a)?1:0;if(k==='pot')return g.records.pots?.includes(a)?1:0;return g.records[q.metric]||0;}
export function questRewardLabel(r){return r.ingredients?Object.entries(r.ingredients).map(([id,n])=>`${INGREDIENTS.find(i=>i.id===id)?.name||id} × ${n}`).join('、'):r.tickets?`礼券 × ${r.tickets}`:r.battery?'电池回复 5 格':r.pot?`${{bronze:'铜',silver:'银',gold:'金'}[r.pot]}料理锅`:r.moveStone?`${{wait:'快快石',scatter:'散散石',broad:'展展石',stay:'恒恒石',sharing:'团团石',whack:'连连石'}[r.moveStone]}`:'奖励';}
export function claimQuest(g,...args){return gameSaveTransaction(g,saveGame,()=>claimQuestCore(g,...args));}
function claimQuestCore(g,id){const q=QUESTS.find(x=>x.id===id||x.aliases?.includes(id));if(!q||q.unverified||q.unavailable||(q.adaptation==='local-export'&&!g.offline?.localBackup?.created)||!questOpened(g,q)||(g.questRewards.includes(q.id)||q.aliases?.some(alias=>g.questRewards.includes(alias)))||questProgress(g,q)<q.goal)return{ok:false,message:'任务尚未完成或已领取'};const r=q.reward,ticket=questTicketResult(g.tickets||0,r.tickets||0);if(r.tickets&&g.offline?.infiniteTickets!==true&&ticket.code!==0)return{ok:false,message:'礼券达到持有上限，请先使用后再领取',reason:'ticket-capacity',ticketResult:ticket.code};g.questRewards.push(q.id);if(r.ingredients)for(const[id,n]of Object.entries(r.ingredients)){g.inventory??={};g.inventory[id]=(g.inventory[id]||0)+n;}if(r.tickets&&g.offline?.infiniteTickets!==true)g.tickets=ticket.value;if(r.battery)g.battery.value=Math.min(g.modifiers.batteryCapacity,g.battery.value+r.battery);if(r.moveStone)g.moveStones.push({...makeMoveStone(r.moveStone),id:`quest-${id}`});if(r.pot){g.unlockedPots??=[];if(!g.unlockedPots.includes(r.pot))g.unlockedPots.push(r.pot);}return{ok:true,message:`领取：${questRewardLabel(r)}`};}
