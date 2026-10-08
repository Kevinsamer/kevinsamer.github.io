import {pokemon,visit} from './client-rules.js';
// Confirmed Visit.LotteryCore type 4 rules. Scheduling/unlock are separate.
export const TIME_VISITOR_INTERVAL_MS=visit.m_HourInterval*3600000;
export const TIME_VISITOR_STOCK_MAX=visit.m_timeVisitNumStockMax;
export const TIME_VISITOR_RARE_COUNT=visit.m_TimeRareLotteryCount;
export function originalTimeVisitorWeights(defeatedSpecies={}){
 return pokemon.filter(p=>p.m_monsterNo>=1&&p.m_monsterNo<=151).map(p=>({dex:p.m_monsterNo,weight:defeatedSpecies[p.m_monsterNo]?p.m_visitWeight:p.m_visitWeightDefault}));
}
export function originalTimeVisitorLevelRange(clearLayerIndex){
 const index=Math.min(visit.m_levelRange.length-1,Math.max(0,Math.trunc(clearLayerIndex)||0));return {...visit.m_levelRange[index]};
}
export function originalTimeVisitorPlan({defeatedSpecies={},clearLayerIndex=0,random=Math.random}={}){
 const rows=originalTimeVisitorWeights(defeatedSpecies),sum=rows.reduce((n,p)=>n+p.weight,0);if(sum<=0)return null;
 let bucket=Math.floor(random()*sum),dex=0;for(const row of rows){bucket-=row.weight;if(bucket<0){dex=row.dex;break;}}
 if(!dex)return null;const range=originalTimeVisitorLevelRange(clearLayerIndex);
 return {dex,level:range.min+Math.floor(random()*(range.max-range.min+1)),rareLotteryCount:TIME_VISITOR_RARE_COUNT,source:'time-visit'};
}

// StageLayerData.m_datas target work groups; zero padding omitted.
export const TIME_VISITOR_CLEAR_GROUPS=[[1],[2,3],[4,5,6],[7,8,9,10],[11],[12]];
export function originalTimeVisitorClearLayerIndex(isWorldClear){
 const index=TIME_VISITOR_CLEAR_GROUPS.findIndex(group=>!group.every(isWorldClear));
 return index<0?TIME_VISITOR_CLEAR_GROUPS.length-1:index;
}
