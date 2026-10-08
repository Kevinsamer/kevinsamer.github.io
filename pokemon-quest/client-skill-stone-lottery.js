import {skillStoneGroups} from './client-rules.js';
import {originalLotteryDropRow} from './client-drop-lottery.js';
export const SOURCE_SKILL_STONE_KINDS=Object.freeze({1:'wait',2:'whack',3:'scatter',4:'broad',5:'stay',6:'sharing'});
/** CreateSkillLink visits every slot; sentinel skips rather than terminates. */
export function originalSkillStoneCommands(group){
 return group.m_commandIDs.flatMap((commandID,index)=>{
  if(commandID===65535)return [];
  if(!Number.isFinite(group.m_values[index]))throw new RangeError('Missing source skill-stone value');
  return [{commandID,params:[Math.fround(group.m_values[index]),-1],rank:1,isFirst:true}];
 });
}
export function originalLotterySkillStoneGroup(stageRank,rangeInt,groups=skillStoneGroups){
 const eligible=groups.filter(g=>g.m_openRank<=stageRank);
 if(!eligible.length)return null;
 return originalLotteryDropRow(eligible.map(group=>({weight:group.m_weight,group})),rangeInt).group;
}

/** Inner CreateSkillLink has no random draw and uses the group's open rank. */
export function originalCreateSkillStonePlan(group){
 return {groupID:group.m_id,graphicType:group.m_stoneGraphicType,
  header:{potentialType:1,rank:group.m_openRank,stageRank:group.m_openRank,graphicType:group.m_stoneGraphicType,groupIndex:0,rarity:1},
  commands:originalSkillStoneCommands(group)};
}
