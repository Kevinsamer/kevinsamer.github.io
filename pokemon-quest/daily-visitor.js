import {originalTimeVisitorPlan,TIME_VISITOR_INTERVAL_MS} from './client-time-visitor-rules.js';
// Caller owns the initial clock and source tutorial unlock. This module never
// invents an initial arrival or consumes a pending visitor when storage is full.
export function updateDailyVisitor(game,{now=Date.now(),unlocked=false,clearLayerIndex=0,createMonster,random=Math.random}={}){
 const state=game.dailyVisitor;
 if(!unlocked)return {ok:false,reason:'locked'};
 if(state?.pending)return {ok:true,pending:state.pending,generated:false};
 if(!state||!Number.isFinite(state.clock))return {ok:false,reason:'clock-uninitialized'};
 const elapsed=now-state.clock;
 if(elapsed<TIME_VISITOR_INTERVAL_MS)return {ok:false,reason:'waiting',remaining:TIME_VISITOR_INTERVAL_MS-elapsed};
 if(typeof createMonster!=='function')return {ok:false,reason:'missing-factory'};
 const plan=originalTimeVisitorPlan({defeatedSpecies:game.records?.defeatedSpecies||{},clearLayerIndex,random});
 if(!plan)return {ok:false,reason:'empty-pool'};
 const monster=createMonster({...plan,level:Math.max(1,Math.min(100,plan.level))});
 if(!monster)return {ok:false,reason:'factory-failed'};
 // Source UpdateVisitTime advances complete elapsed intervals, preserving remainder.
 state.clock+=Math.floor(elapsed/TIME_VISITOR_INTERVAL_MS)*TIME_VISITOR_INTERVAL_MS;
 state.pending=monster;return {ok:true,pending:monster,generated:true};
}
export function claimDailyVisitor(game){
 const state=game.dailyVisitor;if(!state?.pending)return {ok:false,reason:'no-visitor'};
 if(game.monsters.length>=game.boxCapacity.monsters)return {ok:false,reason:'monster-storage-full',required:1};
 const monster=state.pending;game.monsters.push(monster);delete state.pending;
 return {ok:true,monster,recruited:monster,monsters:[monster]};
}
