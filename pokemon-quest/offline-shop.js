import {gameSaveTransaction} from './game-save-transaction.js';
import {OFFLINE_PACKS,PACK_GOODS,PACK_POKEMON} from './client-offline-packs.js';
import {SOURCE_SKILL_STONE_KINDS} from './client-skill-stone-lottery.js';
import * as E from './engine.js';import * as M from './meta.js';
for(const raw of PACK_GOODS)M.registerPackDecoration(raw);
export function claimAllOfflinePacks(g){
 const next=E.hydrateGame(JSON.parse(JSON.stringify(g)));M.initMeta(next);next.offline??={};next.offline.infiniteTickets=true;next.offline.packIds??=[];next.offline.rewardKeys??=[];let granted=0;
 const once=(key,fn)=>{if(next.offline.rewardKeys.includes(key))return;fn();next.offline.rewardKeys.push(key);granted++;};
 try{for(const pack of OFFLINE_PACKS){
  for(const product of pack.productIDs.filter(id=>id!==0)){
   if(pack.productType===0){const raw=PACK_GOODS.find(d=>d.m_id===product);if(!raw)throw Error(`Missing pack goods ${product}`);const d=M.registerPackDecoration(raw);if(!next.decorations.includes(d.id))next.decorations.push(d.id);}
   else if(pack.productType===1)once(`${pack.id}:skill:${product}`,()=>{const kind=SOURCE_SKILL_STONE_KINDS[product];if(!kind)throw Error('Unknown pack skill stone');next.moveStones.push({...E.makeMoveStone(kind),offlinePackId:pack.id});});
   else throw Error('Unsupported pack product');
  }
  for(const index of pack.pokeIndices.filter(i=>i>=0))once(`${pack.id}:pokemon:${index}`,()=>{const m=E.makeFixedMonster(PACK_POKEMON[index]);m.offlinePackId=pack.id;next.monsters.push(m);if(!next.discovered.includes(m.speciesId))next.discovered.push(m.speciesId);for(const type of E.SPECIES.find(s=>s.id===m.speciesId).types)next.records.buddies[type]=(next.records.buddies[type]||0)+1;});
  once(`${pack.id}:tickets`,()=>{next.tickets+=pack.productType===2?0:pack.bonusTicket;});if(!next.offline.packIds.includes(pack.id))next.offline.packIds.push(pack.id);
 }
 next.offline.cookingStations=1+OFFLINE_PACKS.filter(p=>next.offline.packIds.includes(p.id)).reduce((n,p)=>n+p.cookNum,0);M.initMeta(next);
 }catch(error){return {ok:false,message:`礼包未领取：${error.message}`};}
 // Source rewards may overflow storage; keep all items and block subsequent starts normally.
 const previous={...g};Object.assign(g,next);if(!E.saveGame(g)){for(const key of Object.keys(g))delete g[key];Object.assign(g,previous);return {ok:false,message:'存档写入失败，礼包未领取，请释放浏览器存储空间'};}
 return {ok:true,message:granted?'全部礼包已领取，无限点券已开启':'已拥有全部礼包，无限点券保持开启',granted,packCount:next.offline.packIds.length};
}

export function enableInfiniteIngredients(g){return gameSaveTransaction(g,E.saveGame,()=>{g.offline??={};g.offline.infiniteIngredients=true;return {ok:true,message:'无限材料已开启，所有料理材料均可无限使用'};});}
