// Condition.ApplyCondition 0x85d734..78c: clamp bad chance BEFORE resistance.
export function originalLinkedConditionChance({ratio,activeRatio=1,category,resistance=0,buffMultiplier=1,debuffMultiplier=1,typeMultiplier=1}){
 const base=Math.fround(Math.fround(ratio)*Math.fround(activeRatio));
 const typed=Math.fround(base*Math.fround(Math.max(0,typeMultiplier)));
 if(category===0)return Math.fround(typed*Math.fround(buffMultiplier));
 if(category===1||category===2)return Math.fround(Math.max(0,Math.min(1,Math.fround(typed*Math.fround(debuffMultiplier))))-Math.fround(resistance));
 return typed;
}
