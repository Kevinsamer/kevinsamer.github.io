// Normal Visit creator contract recovered from supplied international APK.
export function originalIsRareColor(id,candidate){return (((id&0xfff0)^(id>>>16)^(candidate&0xfff0)^(candidate>>>16))>>>0)<16;}
export function originalFloatToRareWord(value){return Math.min(4294967295,Math.max(0,Math.trunc(value)))>>>0;}
export function originalVisitRareColorPlan(random,count=27){
 const id=random.rangeInt(-2147483648,2147483647)>>>0,nature=random.rangeInt(0,25);
 let rareRandom=0x3fffffff,draws=0,shiny=false;
 for(let i=0;i<count;i++){rareRandom=originalFloatToRareWord(random.rangeFloat(0,4294967296));draws++;shiny=originalIsRareColor(id,rareRandom);if(shiny)break;}
 return {version:1,id,nature,rareRandom,rareLotteryCount:count,draws,shiny};
}
