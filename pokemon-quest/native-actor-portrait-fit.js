// Pure portrait framing math, separate from WebGL for deterministic checks.
export function actorPortraitFrame(bounds,{padding=.12}={}){
 const width=Math.max(1e-6,bounds.max[0]-bounds.min[0]),height=Math.max(1e-6,bounds.max[1]-bounds.min[1]);
 const span=Math.max(width,height)/(1-2*padding),cx=(bounds.min[0]+bounds.max[0])/2,cy=(bounds.min[1]+bounds.max[1])/2;
 return{left:cx-span/2,right:cx+span/2,bottom:cy-span/2,top:cy+span/2,span,width,height};
}
export function actorPortraitDestination(x,y,size,framePixels,footPixels){
 const scale=size/framePixels;return{x:x-footPixels[0]*scale,y:y-footPixels[1]*scale,width:size,height:size};
}
