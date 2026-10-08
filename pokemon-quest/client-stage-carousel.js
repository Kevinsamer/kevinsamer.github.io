// SquareUIController ARM; page and card indices use opposite signs.
export const CLIENT_STAGE_MOVE_SECOND=0.20000000298023224;
export function clientInitialStagePage({dungeonID,flag,stageCount,requestedStageIndex=0}){const allOpen=dungeonID===11||flag===100,openStageCount=allOpen?stageCount:flag;return {allOpen,openStageCount,clearFlag:allOpen?100:flag,page:(openStageCount>=requestedStageIndex?-requestedStageIndex:1-openStageCount)+0};}
export function clientStageSlot(page,stageIndex,slotCount=11){const right=Math.trunc(slotCount/2),left=right+1,k=page+stageIndex;return k>=0?Math.min(k,right):Math.max(k+slotCount,left);}
export function clientStagePageSteps(from,to){const result=[],direction=Math.sign(to-from);for(let page=from;page!==to;){page+=direction;result.push(page);}return result;}

