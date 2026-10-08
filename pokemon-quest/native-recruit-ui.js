import {RECRUIT_LAYOUT} from './client-recruit-layout.js';
const position=([x,y,w,h])=>`left:${x*2/3}px;top:${y*2/3}px;width:${w*2/3}px;height:${h*2/3}px;`;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function nativeRecruitUI({names,monsterCount,capacity,isNew=false}){
 const parts=RECRUIT_LAYOUT.filter(r=>r.src&&!r.path.includes('/Pstatus_Pcharm')&&(!r.path.includes('/new_get')||isNew)).map(r=>{let css=position(r.bounds);if(r.imageType===1)css+=`border-style:solid;border-color:transparent;border-width:${r.slices.map(x=>x*2/3).join('px ')}px;border-image:url('${r.src}') ${r.slices.join(' ')} fill stretch;`;else css+=`background:url('${r.src}') center/100% 100% no-repeat;`;return `<span class="native-recruit-art" style="${css}"></span>`;}).join('');
 const text=(s,b,size)=>`<span class="native-recruit-text" style="${position(b)}font-size:${size*2/3}px">${s}</span>`;
 return `<div class="native-recruit-result" aria-label="新的伙伴">${parts}${text(names.map(esc).join('、')+'已成为了你的伙伴！',[910,932,800,100],40)}${isNew?text('已被新添加进图鉴中。',[995,845,400,40],35):''}${text(monsterCount,[1812.5,361,85,60],60)}${text(capacity,[1825,415,60,40],40)}<button class="native-recruit-exit" data-action="close" aria-label="返回大本营" style="${position([1771,931,128,128])}"></button></div>`;
}
