import {COOK_LAYOUT,COOK_MESSAGES} from './client-cooking-layout.js';
import {originalSprite} from './native-ui.js';
const pos=([x,y,w,h])=>`left:${x*2/3}px;top:${y*2/3}px;width:${w*2/3}px;height:${h*2/3}px;`;
const rows=p=>COOK_LAYOUT.filter(r=>r.path==='Canvas_cook/'+p);
function image(r){if(!r)return '';const [red,g,b,a]=r.color;let css=pos(r.bounds);if(r.src&&r.imageType===1){const widths=r.slices.map(x=>x*2/3);css+=`border-style:solid;border-color:transparent;border-width:${widths.join('px ')}px;border-image:url('${r.src}') ${r.slices.join(' ')} fill stretch;`}else css+=r.src?`background:url('${r.src}') center/100% 100% no-repeat;`:`background:rgba(${red},${g},${b},${a/255});`;return `<span class="native-cook-art" style="${css}"></span>`}
const art=p=>rows(p).map(image).join('');
const text=(value,b,size=25)=>`<span class="native-cook-text" style="${pos(b)}font-size:${size*2/3}px">${value}</span>`;
const button=(attrs,b,label,body='')=>`<button class="native-cook-control" ${attrs} aria-label="${label}" style="${pos(b)}">${body}</button>`;
export function nativeCookingUI({pot,ingredients,food,inventory,infiniteIngredients=false,recipe,recipePage,description,cooking,foodIcon}){
 const letter={normal:'A',bronze:'B',silver:'C',gold:'D'}[pot.id]||'A';
 const potBase=`pot_model/base/base${letter}/Image`,lid=`pot_model/futa/futa${letter}/futa_model/Image`;
 let html=`<section class="native-cooking-screen" aria-label="料理">`;
 // Source pot illustrations contain the complete body and lid; the serialized
 // rectangular construction underneath is the fallback used by Unity.
 html+=art(potBase)+rows(lid).filter(r=>r.src?.includes('BC_cauldron_futa')).map(image).join('');
 const shapes=['recipe/base/shadow3','recipe/base/shadow2','recipe/base/shadow1','recipe/base/book1','recipe/base/book2','recipe/base/window','recipe/base/window/recipe/line','recipe/base/window/recipe/counter/window','zairyou_window/general_window/window_black','zairyou_window/general_window/window_waku','zairyou_window/general_window/window_waku2','zairyou_window/general_window/setumei_window/general_window/window','zairyou_window/general_window/setumei_window/general_window/window/line'];
 html+=shapes.map(art).join('');
 html+=text('所需材料数量',[280,224,300,30],29.9)+text(pot.cost,[393,274.5,130,65],70);
 html+=art(`pot_model/futa/futa${letter}/futa_model/waku`)+rows(lid).filter(r=>r.src?.includes('drop_icon')).map(image).join('');
 const slots=rows(`pot_model/base/base${letter}/blank/blank`).sort((a,b)=>a.bounds[1]-b.bounds[1]||a.bounds[0]-b.bounds[0]);
 slots.forEach((r,i)=>{html+=image(r)+button(`data-food-target="${i}" data-remove-food="${i}" ${cooking?'disabled':''}`,r.bounds,`第 ${i+1} 格食材`,foodIcon(food[i]));});
 html+=art('pot_model/ok_button/button')+button(`data-action="${cooking?.ready?'claim-cook':cooking?'shortcut-cook':'cook'}" ${!cooking&&food.length!==5?'disabled':''}`,[290,913,280,130],cooking?(cooking.ready?'领取料理':'使用点券提前完成烹饪'):'开始烹饪',text(cooking?(cooking.ready?'料理完成':'提前完成'):'开始烹饪',[20,17,240,80],50));
 html+=art('pot_model/pot_change_button/pot_change')+art('pot_model/pot_change_button/pot_change/change_icon')+button(`data-action="change-pot" ${cooking?'disabled':''}`,[60,845,130,130],'更换料理锅');
 html+=text(recipePage+1,[887,109.5,70,70],50)+text(recipe.name,[985,122,760,50],40)+text('材料',[1090,197,180,40],30)+text(COOK_MESSAGES.cook_recipe_desc[recipe.index]||recipe.description||description,[1090,244.5,330,105],25)+text('宝可梦',[1435,197,320,40],30)+text(COOK_MESSAGES.cook_recipe_poke[recipe.index]||'', [1435,244.5,320,105],25);
 for(const [key,delta,b] of [['R',1,[1730,127,150,90]],['L',-1,[1730,247,150,90]]]){html+=art(`recipe/base/button${key}/button${key}_model`)+art(`recipe/base/button${key}/button${key}_model/button${key}_model`)+art(`recipe/base/button${key}/button${key}_model/arrow`)+button(`data-recipe="${delta}"`,b,delta>0?'下一份料理':'上一份料理');}
 html+=text('料理心得',[1040,394,500,40],35);
 ingredients.forEach((f,i)=>{const x=888+(i%5)*166,y=528+Math.floor(i/5)*180;const backgrounds=rows('zairyou_window/general_window/zairyou_model_group/zairyou_button/zairyou_button');const r=backgrounds.find(r=>Math.abs(r.bounds[0]-x)<2&&Math.abs(r.bounds[1]-y)<2);html+=image(r)+button(`draggable="true" data-drag-food="${f.id}" data-food="${f.id}" ${cooking?'disabled':''}`,[x,y,140,160],f.name,foodIcon(f.id)+`<span class="native-cook-count">${infiniteIngredients?'∞':inventory[f.id]||0}</span>`);});
 html+=art('zairyou_window/general_window/window_counter/auto_button/button')+art('zairyou_window/general_window/window_counter/auto_button/button/Image')+text('自动',[1730,615.5,130,25],24.95)+button(`data-action="autofill" ${cooking?'disabled':''}`,[1720,515,150,150],'自动设置食材');
 html+=art('button_exit/allround_button')+button('data-view="camp"',[1771,931,128,128],'返回大本营');
 return html+'</section>';
}
