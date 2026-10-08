import {CLIENT_META as C} from './client-meta-data.js';
import {LEGACY_QUESTS} from './client-quest-aliases.js';
const types=['一般','火','水','电','草','冰','格斗','毒','地面','飞行','超能力','虫','岩石','幽灵','龙','钢','妖精'];
const ingredients=[null,'tiny-mushroom','big-root','bluk-berry','icy-rock','apricorn','honey','fossil','balm-mushroom','rainbow-matter','mystical-shell'];
const stones=[null,'wait','broad','scatter','stay','sharing','whack'];
const regions=[null,1,2,3,6,4,5,10,7,9,8,11];
function metric(id){
 if(id>=1001&&id<=1011)return `region:${regions[id-1000]}`;
 if(id>=1012)return ['successful','equipped','dailyClaims','cooked','stones','dex','placed','levelTraining','moveTraining','shopping','backupCreated'][id-1012];
 if(id<=17)return `buddies:${types[id-1]}`;
 if(id>=64&&id<=80)return `kills:${types[id-64]}`;
 if(id>=81&&id<=97)return `typeTeams:${types[id-81]}`;
 if(id>=98&&id<=106)return `stageWins:12-${id===106?'B':id-97}`;
 const special={18:'levelUps',19:'reachedLevel:50',20:'reachedLevel:100',21:'maxStat:atk',22:'maxStat:hp',25:'distinctMoves',27:'evolutions',28:'allTeamEvolved',31:'species:articuno',32:'species:zapdos',33:'species:moltres',34:'species:mewtwo',35:'species:mew',36:'shinyBuddies',37:'successful',38:'dailyClaims',39:'cooked',40:'stones',41:'dex',42:'levelTraining',43:'moveTraining',44:'recipes',45:'power',46:'placed',47:'moveStoneUsed:scatter',48:'moveStoneUsed:broad',49:'moveStoneUsed:whack',50:'moveStoneUsed:wait',51:'moveStoneUsed:stay',52:'moveStoneUsed:sharing',53:'bingo',54:'bingo',55:'bingo',56:'pot:bronze',57:'pot:silver',58:'pot:gold',59:'mixed12',60:'mixed21',61:'closeTeams',62:'rangedTeams',63:'recycled',107:'dex'};
 return special[id];
}
function reward(row){
 const n=row.m_rewardNum;
 if(row.m_rewardType===1)return {tickets:n};
 if(row.m_rewardType===2)return {moveStone:stones[row.m_rewardID]};
 if(row.m_rewardType===3)return {ingredients:{[ingredients[row.m_rewardID]]:n}};
 if(row.m_rewardType===4)return {battery:n};
 if(row.m_rewardType===5)return {pot:({1003:'bronze',1004:'silver',1011:'gold'})[row.m_id]};
 throw new Error(`Unknown client reward type ${row.m_rewardType}`);
}
function description(text,n){return text.replace(/\x10[\x02\x03][\s\S]{2},?/g,String(n));}
export const CLIENT_QUESTS=C.achievements.m_datas.filter(r=>r.m_isUse).flatMap(row=>row.m_levelNums.filter(n=>n>0).map((n,tier)=>{
 const sourceId=row.m_id, main=sourceId>=1000;
 const goal=sourceId===46?18:sourceId>=53&&sourceId<=55?sourceId-52:n;
 const m=metric(sourceId);if(!m)throw new Error(`Unknown achievement ${sourceId}`);
 const aliases=LEGACY_QUESTS.filter(q=>q.metric===m&&q.goal===goal&&((main&&sourceId<=1011)?q.id.startsWith('region'):main?!q.id.startsWith('region'):true)).map(q=>q.id);
 // Unknown prototype thresholds are mapped to the first actual tier in that family.
 if(tier===0)for(const q of LEGACY_QUESTS)if(q.metric===m&&q.goal===null&&!aliases.includes(q.id))aliases.push(q.id);
 const id=aliases[0]||`client:${sourceId}:${tier}`;
 return {id,aliases,sourceId,tier,sourceGoal:n,goal,metric:m,name:(main?C.count_key_title:C.count_title)[main?sourceId-1000:sourceId],description:description((main?C.count_key_desc:C.count_desc)[main?sourceId-1000:sourceId],n),reward:reward(row),category:main?'main':'challenge',unlockSourceId:row.m_unlockID,sortWeight:row.m_sortWeight,unavailable:sourceId===1022,platform:sourceId===1022?'mobile':undefined};
}));
// Claims for retired guessed thresholds stay in the save and suppress their nearest
// replacement tier, preventing a source correction from duplicating paid rewards.
for(const old of LEGACY_QUESTS){if(CLIENT_QUESTS.some(q=>q.id===old.id||q.aliases.includes(old.id)))continue;const candidates=CLIENT_QUESTS.filter(q=>q.metric===old.metric);if(!candidates.length)continue;const q=candidates.sort((a,b)=>Math.abs(a.goal-(old.goal||1))-Math.abs(b.goal-(old.goal||1)))[0];q.aliases.push(old.id);}
CLIENT_QUESTS.find(q=>q.sourceId===46).aliases.push('thrivingCamp');
