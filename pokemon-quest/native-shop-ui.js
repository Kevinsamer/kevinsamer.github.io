import {misc} from './client-rules.js';
import {CLIENT_SHOP_UI_LAYOUT as L} from './client-shop-ui-layout.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const node=path=>L.nodes.find(n=>n.path===path),scale=L.scale;
const rect=(n,offset=[0,0])=>`left:${n.bounds[0]*scale+offset[0]}px;top:${n.bounds[1]*scale+offset[1]}px;width:${n.bounds[2]*scale}px;height:${n.bounds[3]*scale}px;`;
function art(path,offset=[0,0]){const n=node(path);if(!n)return '';return n.images.map(im=>`<span class="native-shop-art" style="${rect(n,offset)}${im.imageType===1?`border-style:solid;border-color:transparent;border-width:${im.slices.map(v=>v*scale+'px').join(' ')};border-image:url('${im.src}') ${im.slices.join(' ')} fill stretch;`:`background:url('${im.src}') center/100% 100% no-repeat;`}"></span>`).join('');}
const text=(path,value,extra='')=>{const n=node(path);return n?`<span class="native-shop-text" style="${rect(n)}font-size:${(n.texts[0]?.fontSize||30)*scale}px;${extra}">${esc(value)}</span>`:'';};
const hit=(path,attrs,label,disabled=false)=>`<button class="native-shop-hit" style="${rect(node(path))}" ${attrs} aria-label="${esc(label)}" ${disabled?'disabled':''}></button>`;
export function shopDailyRemaining(game,now=Date.now()){
 const last=game.lastTicketClaimAt??(game.lastTicketDay?Date.parse(game.lastTicketDay+'T00:00:00+08:00'):null);
 return last===null||!Number.isFinite(last)?0:Math.max(0,last+misc.m_fsGiftTicket.m_oneDayIntervalHour*3600000-now);
}
const countdown=ms=>{const n=Math.ceil(ms/1000);return[Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');};
export function updateShopDaily(game,root=document){
 const button=root.querySelector('.native-shop [data-action="daily"]');if(!button)return false;
 const remaining=shopDailyRemaining(game),counter=root.querySelector('#native-shop-daily-wait');
 if(remaining===0&&button.disabled)return true;
 if(counter&&counter.textContent!==countdown(remaining))counter.textContent=countdown(remaining);
 return false;
}
export function nativeShopUI({game,tab='service',decorations,tickets,sprite}){
 let h='<section class="native-shop" aria-label="友好商店">'+art('back_color')+art('product/product_base_waku');
 for(const p of ['title_group/back_black','title_group/title_window','title_group/title_window/icon_back','title_group/title_window/icon','title_group/title_window/waku','my_giftcard/card_base','my_giftcard/giftcard'])h+=art(p);
 h+=text('title_group/title_window/Text','友好商店')+text('my_giftcard/count',tickets);
 for(const [id,label]of [['service','服务'],['goods','装饰'],['case','盒子']])h+=art('product/'+id+(id===tab?'/window_anim':''))+text('product/'+id+'/Text',label)+hit('product/'+id,`data-shop-tab="${id}" aria-pressed="${id===tab}"`,label);
 if(tab==='service'){
  const base='product/service_product/product/ScrollRect/';
  for(const p of ['button_1','button_1/grad','button_1/Image','button_1/title/base','button_2','button_2/Image','button_2/back','title/base'])h+=art(base+p);
  const remaining=shopDailyRemaining(game);h+=text(base+'button_1/title/text','每日礼券');if(remaining>0){h+=art(base+'button_1/off')+text(base+'button_1/off/count_time/explain_text','下次领取');h+=text(base+'button_1/off/count_time/explain_count',countdown(remaining)).replace('class="native-shop-text"','class="native-shop-text" id="native-shop-daily-wait"');}else h+=text(base+'button_1/count_card/count',50+(game.modifiers?.dailyTicketsBonus||0));h+=hit(base+'button_1','data-action="daily"','领取每日礼券',remaining>0);
  h+=text(base+'title/text','全部探险礼包')+text(base+'explain_up',`已领取 ${game.offline?.packIds?.length||0} / 11 个礼包`)+text(base+'button_2/explain','无限点券＋全部礼包一键领取')+hit(base+'button_2','data-action="offline-all-packs"','无限点券＋全部礼包一键领取');
  h+=`<button class="native-shop-infinite-ingredients" data-action="offline-infinite-ingredients" ${game.offline?.infiniteIngredients?'disabled':''}>${game.offline?.infiniteIngredients?'无限材料已开启':'开启无限材料'}<br><small>全部料理材料 · 永久生效</small></button>`;
  h+='<button class="native-shop-battery" data-action="battery">补充电池<br><small>25 张礼券</small></button>';
 }else if(tab==='case'){
  const base='product/case_product/product/ScrollRect/';
  for(const [i,kind,label]of [[1,'monsters','伙伴盒子'],[2,'stones','P 力石盒子']]){
   const p=base+'button_'+i;
   for(const s of ['', '/base','/Image','/card/card_base','/card/giftcard'])h+=art(p+s);
   const count=kind==='monsters'?game.monsters.length:game.stones.length+game.moveStones.length;
   h+=text(p+'/title/text',label)+text(p+'/card/count',50)+hit(p,`data-expand-box="${kind}"`,`${label}扩大20格`,game.boxCapacity[kind]>=300);
   h+=`<p class="native-shop-box-note" style="left:${i===1?293.333:653.333}px">${count} / ${game.boxCapacity[kind]}<br>${game.boxCapacity[kind]>=300?'容量已达上限':'扩大 20 格'}</p>`;
  }
 }else{
  const base='product/goods_product/product/ScrollRect/product_status/button',offset=[-203*scale,-183*scale];
  h+='<div class="native-shop-goods" aria-label="装饰商品">'+decorations.map(d=>{const owned=game.decorations.includes(d.id),placed=game.placedDecorations.includes(d.id);let card='';for(const suffix of ['', '/base'])card+=art(base+suffix,offset);card+=`<div class="native-shop-good-art">${sprite(d.sprite||d.iconPath,'native-shop-good-image')||esc(d.icon)}</div><h3>${esc(d.name)}</h3>`;
   if(owned){for(const suffix of ['/off/shadow','/off/base','/off/base_corner'])card+=art(base+suffix,offset);}else for(const suffix of ['/card/card_base','/card/giftcard'])card+=art(base+suffix,offset);
   card+=`<button class="native-shop-good-preview" data-shop-good="${esc(d.id)}" aria-label="查看${esc(d.name)}详情"></button>`;
   card+=owned?`<button class="native-shop-good-purchase" data-place="${d.id}" aria-label="${placed?'收起':'摆放'}${esc(d.name)}">${placed?'收起':'摆放'} · 已拥有</button>`:`<button class="native-shop-good-purchase" data-buy="${d.id}" ${d.cost===null?'disabled':''}>${d.cost===null?(d.id.startsWith('pack-goods-')?'礼包领取':'探险获得'):d.cost.toLocaleString()}</button>`;
   return `<article class="native-shop-good" data-good="${esc(d.id)}">${card}</article>`;}).join('')+'</div>';

 }
 h+=art('button_exit/allround_button')+hit('button_exit/allround_button','data-view="camp"','返回大本营');return h+'</section>';
}

export function shopGoodEffect(d){const [kind,a,b]=String(d.effect||'').split(':');const label={trainingXp:'升级特训获得经验',trainingChance:'招式特训成功率',recycle:'回收方石获得食材',multiSlot:'多重槽伙伴出现概率',multipleRecruit:'料理吸引额外伙伴的概率',expeditionXp:'探险获得经验'}[kind];if(label)return `${label} ×${a}`;if(kind==='ingredient')return `${{all:'全部',red:'红色',blue:'蓝色',yellow:'黄色',gray:'灰色'}[a]||a}食材掉落数量 ×${b}`;if(kind==='xp')return `Lv.${a} 以下伙伴探险经验 ×${b}`;if(kind==='battery')return `电池上限 +${a}`;if(kind==='daily')return `每日礼券额外 +${a}`;return d.desc||'';}
export function shopGoodAcquisition(d){if(d.cost!==null)return `价格：${d.cost} 张礼券`;if(d.id.startsWith('pack-goods-'))return '通过探险礼包获得';if(d.unlock==='shop10')return '购买 10 件商店装饰后获得';if(d.unlock?.startsWith('areas:'))return `通关 ${d.unlock.split(':')[1]} 个普通区域后获得`;return d.unlock?`通关 ${d.unlock} 后获得`:'通过探险与任务获得';}
/** Detail content uses source goods catalog; modal chrome remains the shared Web dialog. */
export function nativeShopGoodDetail({game,decoration:d,sprite}){const owned=game.decorations.includes(d.id),placed=game.placedDecorations.includes(d.id);return `<section class="native-shop-good-detail" data-good-detail="${esc(d.id)}"><h2>${esc(d.name)}</h2><div class="native-shop-detail-image">${sprite(d.sprite||d.iconPath)||esc(d.icon)}</div><p>${esc(shopGoodEffect(d))}</p><p>${owned?'已拥有':esc(shopGoodAcquisition(d))}</p><p>持有装饰即可获得效果，摆放或收起不影响效果。</p><div class="dialog-actions">${owned?`<button data-place="${d.id}" data-shop-good-dialog="${d.id}">${placed?'收起':'摆放'}</button>`:d.cost!==null?`<button data-buy="${d.id}" data-shop-good-dialog="${d.id}">购买 · ${d.cost} 张礼券</button>`:''}<button data-action="close">返回</button></div></section>`;}
