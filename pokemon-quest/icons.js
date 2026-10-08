import {originalSprite} from './native-ui.js';
const shapes={
 gear:'<path d="M18 1h12v9l7 4 8-4 6 10-8 5v8l8 5-6 10-8-4-7 4v9H18v-9l-7-4-8 4-6-10 8-5v-8l-8-5 6-10 8 4 7-4z"/><rect x="16" y="18" width="16" height="16" fill="var(--icon-cut,#ffbd00)"/>',
 quest:'<rect x="3" y="15" width="42" height="31"/><rect x="-1" y="8" width="50" height="11"/><rect x="20" y="7" width="8" height="43" fill="var(--icon-cut,#ffbd00)"/><path d="M24 8H8V0h10l6 8 6-8h10v8z"/>',
 dex:'<path d="M7 6h37v10H16v27h28v6H4V17h3z"/><rect x="20" y="20" width="30" height="20"/><rect x="25" y="25" width="13" height="5" fill="var(--icon-cut,#ffbd00)"/>',
 team:'<path d="M5 4h13v9H5zM32 4h13v9H32zM18 24h13v9H18zM5 41h13v9H5zM32 41h13v9H32z"/><path d="M12 14v4h26v-4M25 19v5M12 40v-3h26v3M25 33v4" fill="none" stroke="white" stroke-width="4"/>',
 camp:'<path d="M3 36h8V20h8v16h6V11h4v5h18v20h8v8H3z"/><path d="M29 22h14v14H29z" fill="var(--icon-cut,#ffbd00)"/><rect x="9" y="5" width="5" height="12"/><rect x="1" y="12" width="18" height="5"/>',
 pot:'<path d="M5 17h42v26H5zM0 12h52v6H0zM11 45h30v5H11zM12 1h7v7h-7zM28 4h7v7h-7z"/><path d="M-2 24h8v12h-8M46 24h8v12h-8" fill="none" stroke="white" stroke-width="5"/>',
 decor:'<path d="M1 29l16-8 16 8-16 8zM18 16l16-8 16 8-16 8zM18 42l16-8 16 8-16 8z"/><path d="M1 31v10l16 8V39M50 18v10l-16 8V26"/>',
 back:'<path d="M2 23l19-18v11h26v28H22V34h15V26H21v13z"/>',
 auto:'<rect x="1" y="9" width="32" height="34" rx="4"/><path d="M38 10l15 17-15 17z"/><rect x="7" y="17" width="7" height="7" fill="var(--icon-cut,#ee709e)"/><rect x="21" y="17" width="7" height="7" fill="var(--icon-cut,#ee709e)"/>',
 scatter:'<path d="M24 0l8 11H16zM0 25l11-8v16zM50 25l-11-8v16zM12 28h8v15h-8zM30 28h8v15h-8zM21 16h8v15h-8z"/>',
 map:'<path d="M3 5h18v14H3zM32 6h18v14H32zM19 33h18v14H19z"/><path d="M13 20v5h29v-4M28 26v6" stroke="white" stroke-width="4" fill="none"/>',
 fight:'<path d="M5 12h11v15h4V7h10v20h4V12h10v29H5zM10 44h29v5H10z"/>',
 arrow:'<path d="M2 21h25V8l23 20-23 20V35H2z"/>',
 ticket:'<path d="M5 8h44v35H5z"/><path d="M25 7v37" stroke="var(--icon-cut,#299fdb)" stroke-width="5"/><rect x="11" y="16" width="8" height="19" fill="var(--icon-cut,#299fdb)"/>'
};
const fallbackIcon=(name,cls='')=>`<svg class="pixel-icon ${cls}" viewBox="-4 -3 61 59" aria-hidden="true" fill="currentColor">${shapes[name]||shapes.camp}</svg>`;
const foods={
 'tiny-mushroom':'<path fill="#cfa45f" d="M22 32h18v20H22z"/><path fill="#f45f65" d="M9 15h9V8h25v8h9v25H9z"/><path fill="#d44354" d="M14 17h10v8H14zM34 12h8v8h-8zM39 28h10v9H39zM23 30h8v8h-8z"/>',
 'bluk-berry':'<path fill="#61cb93" d="M25 7h22v17H25z"/><path fill="#4664d1" d="M9 20h25v28H9z"/><path fill="#3988e8" d="M28 16h25v31H28z"/><path fill="#66b7f3" d="M34 21h13v14H34z"/><path fill="#7887e9" d="M13 25h10v11H13z"/>',
 apricorn:'<path fill="#e39520" d="M15 17h31v28H15zM21 45h20v8H21z"/><path fill="#eacf68" d="M10 10h42v11H10z"/><path fill="#fff09c" d="M17 13h27v5H17zM17 24h23v12H17z"/>',
 fossil:'<path fill="#757972" d="M10 8h40l8 8v39H10z"/><path fill="#9a9d8f" d="M10 8h40v9H10z"/><path fill="#515950" d="M18 23h9v9h-9zM33 22h14v9H33zM19 38h9v9h-9zM37 35h10v12H37z"/>',
 'big-root':'<path fill="#ee6e52" d="M10 8h34l10 10v22l-9 7H17L8 32z"/><path fill="#bd432f" d="M16 19h7v27h-7zM31 15h7v33h-7zM44 25h7v19h-7z"/><path fill="#ff9577" d="M14 11h25v8H14z"/>',
 'icy-rock':'<path fill="#338aca" d="M16 5h22l16 20v24H12L5 28z"/><path fill="#6dc8e5" d="M16 5l9 16h28L38 5z"/><path fill="#8fdaed" d="M18 27h15v16H18z"/><path fill="#286fa4" d="M40 22h14v27H40z"/>',
 honey:'<path fill="#edbb31" d="M9 9h41v41H9z"/><path fill="#ffe568" d="M13 10h34v10H13zM15 23h8v20h-8zM37 24h10v10H37z"/><path fill="#c59426" d="M9 42h41v8H9z"/>',
 'balm-mushroom':'<path fill="#927c52" d="M23 31h15v23H23z"/><path fill="#697168" d="M12 18h8V8h24v12h9v23H12z"/><path fill="#4e574e" d="M12 29h41v10H12z"/><path fill="#85917e" d="M23 10h17v9H23z"/>',
 'rainbow-matter':'<rect x="6" y="6" width="47" height="47" fill="#8dd9d1"/><path fill="#f682a8" d="M6 6h17v16H6zM23 38h15v15H23z"/><path fill="#ffdd67" d="M23 6h30v16H23z"/><path fill="#77d18f" d="M38 22h15v16H38z"/><path fill="#a889de" d="M6 22h17v31H6z"/><path fill="#fff" d="M23 22h15v16H23zM8 10h9v4H8zM13 6h3v13h-3zM38 42h10v4H38zM42 38h3v14h-3z"/>',
 'mystical-shell':'<path fill="#8ab5d9" d="M30 4h17v10H30z"/><path fill="#ccb976" d="M20 14h26v10H20z"/><path fill="#718b8d" d="M12 24h34v9H12z"/><path fill="#a77085" d="M7 33h44v19H7z"/><path fill="#503957" d="M14 38h13v10H14zM34 39h8v9h-8z"/>'
};
const fallbackIngredient=id=>`<svg class="food-svg" viewBox="0 0 64 64" aria-hidden="true">${foods[id]||foods.fossil}</svg>`;

const originalIcons={gear:'BaseCamp_option_button',quest:'BaseCamp_record_button',dex:'BaseCamp_zukan_button',team:'BaseCamp_pokemon_button',camp:'BaseCamp_camp_button',pot:'BaseCamp_cooking_button',decor:'BaseCamp_goods_set_button',back:'button_allround_exit',auto:'button_battle_auto',scatter:'button_battle_runaway',map:'BaseCamp_worldmap_button',shop:'BaseCamp_shop_button'};
export const icon=(name,cls='')=>originalSprite(originalIcons[name],'pixel-icon '+cls)||fallbackIcon(name,cls);
const ingredientSprites={'tiny-mushroom':'Item_Red_C','big-root':'Item_Red_UC','bluk-berry':'Item_Blue_C','icy-rock':'Item_Blue_UC',apricorn:'Item_Yellow_C',honey:'Item_Yellow_UC',fossil:'Item_Grey_C','balm-mushroom':'Item_Grey_UC','rainbow-matter':'Item_Rainbow_R','mystical-shell':'Item_Mystic_R'};
export const ingredientIcon=id=>originalSprite(ingredientSprites[id],'food-svg')||fallbackIngredient(id);
