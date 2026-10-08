import {CLIENT_STONE_STORAGE_DIALOG as L} from './client-stone-storage-dialog-layout.js';
export function storageCapacityDialog(game,kind,required=0,context='cooking'){
 const stones=kind==='stones',count=stones?game.stones.length+game.moveStones.length:game.monsters.length,capacity=game.boxCapacity[kind];
 if(stones)return nativeStoneStorageDialog(count,capacity,required);
 const name='伙伴盒子';
 return `<h2>${name}空间不足</h2><p>当前 ${count} / ${capacity}。${required?`本次领取需要 ${required} 个空位。`:""}${stones?'回收方石后可以继续探险。':context==='visitor'?'通过特训整理伙伴后可以邀请来访伙伴，未领取的伙伴会保留。':'通过特训整理伙伴后可以领取料理，已完成的料理会保留。'}</p><p>扩容增加 20 格，需要 50 张礼券${capacity>=300?'；容量已达上限，请先整理':''}。</p><div class="dialog-actions"><button data-action="storage-organize" data-storage-kind="${kind}">${stones?'回收方石':'整理伙伴'}</button><button data-action="storage-expand" data-storage-kind="${kind}" ${capacity>=300?'disabled':''}>查看扩容</button><button data-action="close">返回</button></div>`;
}

const scale=2/3;
const node=suffix=>L.nodes.find(n=>n.path.endsWith('/'+suffix));
const rect=n=>`left:${n.bounds[0]*scale}px;top:${n.bounds[1]*scale}px;width:${n.bounds[2]*scale}px;height:${n.bounds[3]*scale}px;`;
function art(n){return n.images.map(im=>{const b=im.border,edges=[b.w,b.z,b.y,b.x];return `<span class="native-storage-art" style="${rect(n)}border-width:${edges.map(v=>v*scale+'px').join(' ')};border-image:url('assets/original/ui-tinted/failure_${im.sprite}_255_255_255_255.png') ${edges.join(' ')} fill stretch"></span>`;}).join('');}
function nativeStoneStorageDialog(count,capacity,required){
 const explain=node('explain_text'),left=node('buttonL'),right=node('buttonR');
 return `<section class="native-storage-window" role="dialog" aria-label="P 力石盒子空间不足" data-window-type="${L.type}">${art(node('general_waku'))}<p class="native-storage-explanation" style="${rect(explain)}font-size:${explain.text.m_fontSize*scale}px">${L.messages.worldmap[1]}</p>${art(left)}${art(right)}<button class="native-storage-button" style="${rect(left)}" data-action="storage-organize" data-storage-kind="stones">${L.messages.worldmap[2]}</button><button class="native-storage-button" style="${rect(right)}" data-action="storage-expand" data-storage-kind="stones" ${capacity>=300?'disabled':''}>${L.messages.worldmap[3]}</button><p class="native-storage-status">当前 ${count} / ${capacity}。${required?`本次领取需要 ${required} 个空位。`:''}<br>${capacity>=300?'容量已达上限，请先回收方石。':'扩容增加 20 格，需要 50 张礼券。'}</p><button class="native-storage-close" data-action="close">返回</button></section>`;
}
