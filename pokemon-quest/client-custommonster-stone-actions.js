// Source contracts independent of Web engine state representation.
export const SOURCE_AUTO_SET_TYPE={"HP": 0, "Attack": 1, "Multi": 2, "Length": 3};
export const SOURCE_RECYCLE_PARAMETER={"recycleData":[{"item":1,"weight":100},{"item":3,"weight":100},{"item":5,"weight":100},{"item":7,"weight":100},{"item":2,"weight":10},{"item":4,"weight":10},{"item":6,"weight":10},{"item":8,"weight":10}],"recycleCountData":[{"calcType":1,"minCountWeight":3,"maxCountWeight":30},{"calcType":2,"minCountWeight":4,"maxCountWeight":40},{"calcType":3,"minCountWeight":5,"maxCountWeight":50},{"calcType":3,"minCountWeight":6,"maxCountWeight":60},{"calcType":5,"minCountWeight":15,"maxCountWeight":20}],"rank":100};
export function originalRecycleConfirmationRequired({recycleMode,selectedCount}){return !!recycleMode&&selectedCount>=1;}
/** Source GetCalcCount: first matching row, signed integer quotient then MLA. */
export function originalRecycleCalcCount(calcType,value,parameter=SOURCE_RECYCLE_PARAMETER){
 const row=parameter.recycleCountData.find(r=>r.calcType===calcType);
 return row?Math.trunc((row.maxCountWeight-row.minCountWeight)/parameter.rank)*(value|0)+row.minCountWeight:0;
}
/** Source LotteryMaterial: one candidate Bernoulli trial, not weighted pool choice.
 * randomPercent mirrors Unity Random.Range(0f,100f), including equality acceptance.
 */
export function originalRecycleLotteryAttempt(item,weight,allWeight,randomPercent){
 const threshold=Math.fround(Math.fround(Math.fround(weight)/Math.fround(allWeight))*100);
 return randomPercent>threshold?0:item;
}
/** OnRecycle reads source header rarity (sum of property rarity), not icon tier. */
export function originalRecycleCountForHeader({potentialType=0,rarity=0,stageRank=0},parameter=SOURCE_RECYCLE_PARAMETER){
 const calcType=potentialType===1?5:potentialType===0&&rarity>=0&&rarity<4?rarity+1:2;
 return originalRecycleCalcCount(calcType,stageRank,parameter);
}
/** CalculateMaterial traverses the weight dictionary repeatedly, accepting one
 * Bernoulli trial per item, stopping before a trial once total reaches count.
 * Decorations multiply each completed item count, then truncate separately.
 * maxAttempts is a Web watchdog: failure throws before a caller commits storage.
 */
export function originalRecycleMaterials({count,parameter=SOURCE_RECYCLE_PARAMETER,multiplier=1,random=Math.random,maxAttempts=100000}={}){
 const weights=new Map();let allWeight=0;
 for(const row of parameter.recycleData){if(weights.has(row.item))throw new Error('Duplicate recycle item');weights.set(row.item,row.weight);allWeight=Math.fround(allWeight+Math.fround(row.weight));}
 const materials=new Map();let total=0,attempts=0;
 while(total<count){
  if(!weights.size||!(allWeight>0))throw new Error('No recycle material candidates');
  for(const[item,weight]of weights){
   if(total>=count)break;
   if(++attempts>maxAttempts)throw new Error('Recycle lottery exceeded Web watchdog');
   const won=originalRecycleLotteryAttempt(item,weight,allWeight,Math.fround(random()*100));
   if(won){materials.set(won,(materials.get(won)||0)+1);total++;}
  }
 }
 return Object.fromEntries([...materials].map(([id,n])=>[id,Math.trunc(Math.fround(Math.fround(multiplier)*n))]));
}
export function originalSlotRemovePlan(storageIndex){return {
 storageIndex,unregisterAttachCharacterStorageIndex:true,connectMapStorageIndex:-1,
 removeStorageData:false,saveBeforeVisualReturn:true};}
export const SOURCE_STONE_ACTION_FLOW={
 inventoryClick:'tooltip',slotReturn:'unregister attachment; update connect map to -1; save; return visual to storage',
 invalidDrop:'reset default slot position',
 recycle:['require recycle mode and nonempty selection','confirmation dialog','calculate original materials','add item counts','remove selected potential storage data','save/refresh','material reward dialog'],
 autoEquip:['disable UI interactions','SetCalculateBestStone(autoSetType)','PlaySetBestStone','restore UI interactions'],
 autoEquipRankingRecovered:false
};
