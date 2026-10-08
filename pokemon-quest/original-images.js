import {UI_SPRITES} from './client-ui-assets.js';
const images=new Map();
export function originalImage(name){
 const resource=UI_SPRITES[name];if(!resource)return null;
 if(!images.has(name)){const image=new Image();image.src=resource.path;images.set(name,image)}
 const image=images.get(name);return image.complete&&image.naturalWidth?image:null;
}
export const INGREDIENT_SPRITES={'tiny-mushroom':'Item_Red_C','big-root':'Item_Red_UC','bluk-berry':'Item_Blue_C','icy-rock':'Item_Blue_UC','apricorn':'Item_Yellow_C','honey':'Item_Yellow_UC','fossil':'Item_Grey_C','balm-mushroom':'Item_Grey_UC','rainbow-matter':'Item_Rainbow_R','mystical-shell':'Item_Mystic_R'};
