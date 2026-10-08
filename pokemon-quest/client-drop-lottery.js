import {misc} from './client-rules.js';
const f=Math.fround;
export function originalEnemyDropAttempts(enemyProbability,stageRank,threshold=misc.m_battle.m_drop.m_enemy.m_stageRankThreshold){
 const scaled=f(f(f(stageRank)/f(threshold))*f(enemyProbability.m_lotteryNumMax));
 return Math.trunc(Math.max(enemyProbability.m_lotteryNumMin,Math.min(enemyProbability.m_lotteryNumMax,scaled)));
}
/** DropItemDataSet.Initialize uses signed integer division BEFORE rank multiply. */
export function originalDropItemWeights(rows,stageRank,ratioForItem){
 return rows.map(row=>({itemNo:row.m_itemNo,weight:Math.trunc(f(f(row.m_weightMin+Math.imul(Math.trunc((row.m_weightMax-row.m_weightMin)/100),stageRank))*f(ratioForItem(row.m_itemNo))))}));
}
export function originalLotteryDropItem(weights,rangeInt){
 const total=weights.reduce((sum,row)=>sum+row.weight,0),roll=rangeInt(0,total);let cumulative=0;
 for(const row of weights){cumulative+=row.weight;if(roll<cumulative)return row.itemNo;}
 return 0;
}
/** Enemy.LotteryGroup returns Item without RNG when local stone cap is reached. */
export function originalLotteryDropGroup(p,enemyStoneCount,rangeInt){
 if(enemyStoneCount>=p.m_dropStoneMax)return 0;
 const roll=rangeInt(0,100);
 if(roll<p.m_groupProb_Item)return 0;
 if(roll<p.m_groupProb_Item+p.m_groupProb_Stone)return 1;
 return 0;
}
/** ExtentionIEnemy.LotteryDrops. Caller scopes RNG to enemy.dropSeedForEnemy.
 * Only returns Item/Stone group plan; source content generation uses separate seed.
 */
export function originalEnemyDropGroupPlan({probability,stageRank,stageStoneMax,stageStoneCount=0,isDropFix=false,fixDropGroup=0,isForceDropStone=false,isLastDrop=false,rangeFloat,rangeInt}){
 const count=originalEnemyDropAttempts(probability,stageRank),groups=[],trace=[];
 const effectiveStageCap=stageStoneMax-(isLastDrop?0:1);let enemyStones=0,currentStageCount=stageStoneCount,force=isForceDropStone;
 for(let attempt=0;attempt<count;attempt++){
  const roll=rangeFloat(0,99);trace.push({kind:'probability',attempt,roll});
  if(!force&&!(roll<probability.m_prob)){force=false;continue;}
  let group=0;
  if(isDropFix)group=fixDropGroup;
  else if(currentStageCount<effectiveStageCap){
   const wasForce=force;force=false;
   group=wasForce?1:originalLotteryDropGroup(probability,enemyStones,(min,max)=>{const value=rangeInt(min,max);trace.push({kind:'group',attempt,value});return value;});
  }
  if(group===1){enemyStones++;currentStageCount++;}
  groups.push(group);
 }
 return {groups,enemyStones,stageStoneCount:currentStageCount,attempts:count,effectiveStageCap,trace};
}
export const SOURCE_STAGE_DROP_RATIO_FIELDS=['m_redCommon','m_redUnCommon','m_blueCommon','m_blueUnCommon','m_yellowCommon','m_yellowUnCommon','m_greyCommon','m_greyUnCommon','m_rare','m_legend'];
export function originalStageDropItemRatio(row,itemNo){const field=SOURCE_STAGE_DROP_RATIO_FIELDS[itemNo-1];return field?row[field]:1;}
/** Source checks battle option1 AND EnemyDataTutorial runtime type. */
export function originalFixedDropDescription(enemyData,{battleOption1Enabled,isEnemyDataTutorial}){
 const isDropFix=!!battleOption1Enabled&&!!isEnemyDataTutorial;
 return {isDropFix,fixDropGroup:isDropFix?enemyData.m_fixDropGroup:0,fixDropItem:isDropFix?enemyData.m_fixDropItem:0};
}

/** Source StoneTypeSet/SkillPropertyGroupSet use integer Range and serialized order. */
export function originalLotteryDropRow(rows,rangeInt){
 const total=rows.reduce((n,row)=>n+row.weight,0),roll=rangeInt(0,total);let cumulative=0;
 for(const row of rows){cumulative+=row.weight;if(roll<cumulative)return row;}
 return rows.at(-1);
}
/** DropCoroutine aggregates ResultItem.num before the Goods float32 multiplier. */
export function originalDropItemQuantity(baseCount,multiplier){
 return Math.trunc(f(f(baseCount)*f(multiplier)));
}
