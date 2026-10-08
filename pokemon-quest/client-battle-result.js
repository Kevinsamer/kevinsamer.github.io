import {misc} from './client-rules.js';

// ResultSequence indexes these arrays with the native zero-based wave index.
export function clientBattleExperience(baseExperience,waveIndex,{won=false,retreated=false,memberMultiplier=1}={}){
 const rules=misc.m_battle.m_result;
 const ratios=retreated?rules.m_waveExpRatiosBreak:rules.m_waveExpRatiosGameOver;
 const maximum=retreated?rules.m_expRatioMaxBreak:rules.m_expRatioMaxGameOver;
 const ratio=won?1:(ratios[waveIndex]??maximum);
 const stageExperience=Math.trunc(Math.fround(Math.fround(baseExperience)*Math.fround(ratio)));
 return Math.trunc(Math.fround(Math.fround(stageExperience)*Math.fround(memberMultiplier)));
}

export function clientRecoveryTicketCost(stageLevel){
 return 1+misc.m_battle.m_gameOver.m_TicketRank.filter(threshold=>threshold<stageLevel).length;
}
