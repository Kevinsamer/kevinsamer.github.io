// APK ARM contract; RNG callbacks model Unity ranges, not Unity's PRNG state.
import {stonePropertyCounts,stoneProperties,stoneGroups,misc} from './client-rules.js';
const f=Math.fround, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const config=misc.m_battle.m_drop;
export function originalPropertyNumWeights(stageRank,rows=stonePropertyCounts,cfg=config.m_propertyNum){
 const rank=f(stageRank),median=f(cfg.m_medianStageRankThreshold),B=f(f(cfg.m_valueB_u)/f(cfg.m_valueB_d));
 return rows.map(row=>{
  let correction;
  if(rank<=median)correction=f(f(f(row.m_weightMedian-row.m_weightMin)/median)*rank);
  else {const curve=f(Math.pow(f(f(Math.pow(f(cfg.m_maxStageRankThreshold),B))/rank),B));
   correction=f(f(f(f(row.m_weightMax-row.m_weightMedian)/f(cfg.m_valueA))*f(rank-median))*curve);}
  return {count:row.m_num,weight:(rank<=median?row.m_weightMin:row.m_weightMedian)+Math.trunc(correction)};
 });
}
export function originalLotteryPropertyNum(stageRank,rangeInt,{forceFour=false,rows=stonePropertyCounts,cfg=config.m_propertyNum}={}){
 if(forceFour)return 4; // CreatePassive 0x762834 bypasses count RNG only.
 const weights=originalPropertyNumWeights(stageRank,rows,cfg),total=weights.reduce((n,r)=>n+r.weight,0),roll=rangeInt(0,total);
 let sum=0;for(const row of weights){sum+=row.weight;if(roll<sum)return row.count;}return 1;
}
export function originalPassiveValueBounds(property,stageRank,cfg=config.m_passiveProperty){
 const rank=clamp(Math.trunc(stageRank),1,Math.trunc(cfg.m_stageRankThreshold));
 const min=f(property.m_rankMin),delta=f(f(property.m_rankMax)-min);
 const max=rank<2?min:f(min+f(f(f(Math.pow(f(rank),f(cfg.m_calcMaxValueA)))/f(Math.pow(f(cfg.m_stageRankThreshold),f(cfg.m_calcMaxValueA))))*delta));
 const index=cfg.m_calcMinRatioStageLevels.findIndex(v=>rank>=v),ratio=index<0?1:f(cfg.m_calcMinRatios[index]);
 const scaled=f(max*ratio),lower=min<0?Math.min(scaled,min):Math.max(scaled,min);
 return {rank,min:Math.min(lower,max),max:Math.max(lower,max)};
}
export function originalLotteryPassiveValue(commandID,stageRank,rangeFloat,properties=stoneProperties,cfg=config.m_passiveProperty){
 const property=properties.find(p=>p.m_commandID===commandID);if(!property)return 0;
 const bounds=originalPassiveValueBounds(property,stageRank,cfg),sample=f(rangeFloat(bounds.min,bounds.max));
 const remainder=f(sample%f(property.m_increment));return clamp(f(sample-remainder),bounds.min,bounds.max);
}
export function originalPassiveValueRank(commandID,value,properties=stoneProperties,cfg=config.m_passiveProperty){
 const p=properties.find(p=>p.m_commandID===commandID);if(!p)return 1;
 const delta=f(f(value)-f(p.m_rankMin));let rank=1;
 if(Math.abs(delta)>1.401298464324817e-45){const span=f(f(p.m_rankMax)-f(p.m_rankMin));
  const basis=f(f(delta/span)*f(Math.pow(f(cfg.m_stageRankThreshold),f(cfg.m_calcMaxValueA))));
  rank=Math.trunc(f(Math.pow(basis,f(f(cfg.m_calcRankdValueA)/f(cfg.m_calcRankdValueB)))));}
 rank-=rank%cfg.m_rankIncrement;return clamp(rank,1,Math.trunc(cfg.m_stageRankThreshold));
}
export function originalPassiveRarity(commandIDs,properties=stoneProperties){return commandIDs.reduce((sum,id)=>sum+(properties.find(p=>p.m_commandID===id)?.m_rarity||0),0);}
export function originalLotteryPassiveCommands(stageRank,count,rangeInt,{tutorial=false,groups=stoneGroups,excluded=[]}={}){
 const available=groups.filter(g=>g.m_groupOpenRank<=stageRank&&!!g.m_isTutorial===!!tutorial);
 if(!available.length)throw new RangeError('No source passive group available');
 const groupIndex=rangeInt(0,available.length),group=available[groupIndex];
 const candidates=group.m_commandIDs.flatMap((id,i)=>id!==65535&&group.m_openRanks[i]<=stageRank&&!excluded.includes(id)?[{id,index:i}]:[]);
 // Source keeps duplicate command entries; distinct is never applied.
 const requested=count-1,extraCount=Math.min(requested,candidates.length);
 const sorted=candidates.map(c=>({...c,key:rangeInt(-2147483648,2147483647)})).sort((a,b)=>a.key-b.key||a.index-b.index);
 const extras=sorted.slice(0,tutorial?Math.min(count,candidates.length):extraCount).map(c=>c.id);
 let ids=tutorial?extras:[ [0,2][rangeInt(0,2)],...extras ];
 if(!ids.length)ids=[0]; // CreatePassive empty list fallback.
 return {commandIDs:ids,groupIndex,extraCount,requestedCount:count};
}
export function originalCreatePassiveStonePlan(stageRank,{rangeInt,rangeFloat,forceFour=false,tutorial=false,groups=stoneGroups,properties=stoneProperties}={}){
 if(typeof rangeInt!=='function'||typeof rangeFloat!=='function')throw new TypeError('Explicit source range callbacks required');
 const count=originalLotteryPropertyNum(stageRank,rangeInt,{forceFour}),chosen=originalLotteryPassiveCommands(stageRank,count,rangeInt,{tutorial,groups});
 const commands=chosen.commandIDs.map(commandID=>{const value=originalLotteryPassiveValue(commandID,stageRank,rangeFloat,properties);return {commandID,params:[value],rank:originalPassiveValueRank(commandID,value,properties)};});
 return {...chosen,count,commands,header:{potentialType:0,rank:Math.max(...commands.map(c=>c.rank)),stageRank,rarity:originalPassiveRarity(chosen.commandIDs,properties)}};
}
