import {originalBingoEffects,originalEncodeBingoIndices} from './client-bingo-selection.js';
const commandsByText=new Map();
for(let dex=1;dex<=151;dex++)for(let index=0;index<3;index++)for(const effect of originalBingoEffects(dex,originalEncodeBingoIndices([index,index,index])))if([31,48,49].includes(effect.commandID))commandsByText.set(effect.text,effect);
// Parameter commands31/48/49 add target conditionProbPercent[type], not resistBadCondition.
export function originalTargetConditionMultiplier(unit,type){
 let adjustment=0;
 for(const text of unit.bingos||[]){const e=commandsByText.get(text);if(!e)continue;const applies=e.commandID===31?e.params[1]===type:e.commandID===48?[2,4,6,8].includes(type):type>=9&&type<=15;if(applies)adjustment=Math.fround(adjustment+Math.fround(e.params[0]));}
 const stone=type>=9&&type<=15?unit.stoneBonus?.statusResistance:[2,4,6,8].includes(type)?unit.stoneBonus?.effectResistance:0;
 adjustment=Math.fround(adjustment-Math.fround((stone||0)/100));
 return Math.max(0,Math.fround(1+adjustment));
}
