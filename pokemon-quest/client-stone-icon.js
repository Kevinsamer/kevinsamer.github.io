// Source GetIconName/GetStoneRarity: threshold equality enters the next tier.
const tier=(thresholds,value)=>{const i=thresholds.findIndex(v=>v>value);return i<0?thresholds.length:i;};
export function originalStoneRarityIndex(rawRarity){return tier([10,20,30,999],Math.max(1,Math.min(999,rawRarity)));}
export function originalPassiveStoneIcon(kind,rank,rawRarity){
 const rankPart=tier([5,15,30,50,70],Math.max(1,Math.min(100,rank)))+1;
 return `UI_Pstone_${kind==='hp'?'defense':'attack'}_${originalStoneRarityIndex(rawRarity)+1}_${rankPart}`;
}
export function originalStoneIconName(stone){
 const header=stone.source?.header??stone.clientHeader;
 const rawRarity=header?.rarity??({normal:0,bronze:10,silver:20,gold:30}[stone.rarity]??0);
 return originalPassiveStoneIcon(stone.kind,header?.rank??1,rawRarity);
}
