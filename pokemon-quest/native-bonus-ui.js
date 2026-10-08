import {BONUS_LAYOUT} from './client-bonus-layout.js';
const base='Canvas_Common_UI/bonus_group/bonus_window',row=p=>BONUS_LAYOUT.find(r=>r.path===base+'/'+p);
const scale=2/3;
const pos=([x,y,w,h])=>`left:${x*scale}px;top:${y*scale}px;width:${w*scale}px;height:${h*scale}px;`;
function art(p,bounds){const r=row(p),b=bounds||r.visibleBounds;return r.images.map(im=>{let css=pos(b);if(im.imageType===1){const borders=im.slices.map(x=>x*scale);for(const [i,j,size] of [[0,2,b[3]*scale],[1,3,b[2]*scale]])if(borders[i]+borders[j]>size){const f=size/(borders[i]+borders[j]);borders[i]*=f;borders[j]*=f;}css+=`border-style:solid;border-color:transparent;border-width:${borders.join('px ')}px;border-image:url('${im.src}') ${im.slices.join(' ')} fill stretch;`;}else if(im.imageType===2)css+=`background-image:url('${im.src}');background-repeat:repeat;background-size:${im.size[0]*scale}px ${im.size[1]*scale}px;`;else css+=`background:url('${im.src}') center/100% 100% no-repeat;`;return `<span class="native-bonus-art" style="${css}"></span>`;}).join('');}
/** Native bonus_window: original tiles, slider fill, borders and stone icon.
 * The ten-expedition count drives Unity Slider's normalized [0,1] value. */
export function nativeExpeditionBonus(count=0){
 const value=Math.max(0,Math.min(10,Number(count)||0)),fill=row('level_slider/Fill Area').visibleBounds;
 let html=`<div class="native-expedition-bonus" role="meter" aria-label="探险奖励" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${value}">`;
 // Preserve serialized child rendering order. The tile image lies below the
 // Slider, so the filled yellow portion is continuous as in the Unity prefab.
 for(const p of ['window','window_background','window_background_gauge','level_slider/Background'])html+=art(p);
 if(value>0)html+=art('level_slider/Fill Area/Fill',[fill[0],fill[1],fill[2]*value/10,fill[3]]);
 html+=art('waku');
 html+=`<span class="native-bonus-text" style="${pos(row('Text').visibleBounds)}font-size:${row('Text').texts[0].fontSize*scale}px">探险奖励</span>`;
 for(const p of ['waku_soto','stone','stone_shadow','stone_waku'])if(p!=='stone_shadow'||value<10)html+=art(p);
 return html+'</div>';
}
