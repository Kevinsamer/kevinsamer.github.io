// Single-player reload policy: return to camp. Entry was consumed at start;
// unsaved battle loot, experience and cooking progress are not committed.
export function markExpeditionStarted(g,stageId,now=Date.now()){g.activeExpedition={version:1,stageId,startedAt:now};}
export function markExpeditionSettled(g){delete g.activeExpedition;}
export function recoverInterruptedExpedition(g,now=Date.now()){if(!g.activeExpedition)return null;const interrupted={...g.activeExpedition,recoveredAt:now,policy:'return-to-camp-no-reward'};delete g.activeExpedition;g.lastInterruptedExpedition=interrupted;return interrupted;}
