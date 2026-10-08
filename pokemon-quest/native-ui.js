import {UI_SPRITES} from './client-ui-assets.js';
export function originalSprite(name,cls='',extra=''){const s=UI_SPRITES[name];return s?`<img class="original-sprite ${cls}" src="${s.path}" alt="" aria-hidden="true" ${extra}>`:''}
let font=null,atlas=null;
const nativeFonts=new Map();
function loadNativeFont(name){return Promise.all([fetch(`assets/original/fonts/${name}.json`).then(r=>{if(!r.ok)throw Error('Font metadata unavailable: '+name);return r.json();}),new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`assets/original/fonts/${name}-coverage.png`;})]).then(([font,atlas])=>{nativeFonts.set(name,{font,atlas});return{font,atlas};});}
export const nativeFontReady=Promise.all([loadNativeFont('y7').then(pair=>{font=pair.font;atlas=pair.atlas;}),loadNativeFont('bogboo')]).then(()=>document.dispatchEvent(new Event('native-font-ready'))).catch(()=>{});
function labelCanvas(text,style,fontName){
 const selected=nativeFonts.get(fontName)||nativeFonts.get('y7');const font=selected.font,atlas=selected.atlas;
 const size=parseFloat(style.fontSize)||20,scale=size/font.face.m_PointSize;
 const lines=text.split('\n').map(line=>[...line].map(c=>({c,g:font.glyphs[c.codePointAt(0)]})));
 const advance=({g})=>g?g.m_Metrics.m_HorizontalAdvance*scale:size;
 const width=Math.ceil(Math.max(0,...lines.map(line=>line.reduce((n,g)=>n+advance(g),0))));
 const lineHeight=parseFloat(style.lineHeight)||size*1.18,height=Math.ceil(lineHeight*lines.length);
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,width*2);canvas.height=Math.max(1,height*2);canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');ctx.scale(2,2);
 lines.forEach((line,index)=>{let x=0;const baseline=font.face.m_AscentLine*scale+index*lineHeight;for(const {c,g} of line){if(g){const r=g.m_GlyphRect,m=g.m_Metrics;if(r.m_Width>0&&r.m_Height>0&&r.m_Y>=0)ctx.drawImage(atlas,r.m_X,font.height-r.m_Y-r.m_Height,r.m_Width,r.m_Height,x+m.m_HorizontalBearingX*scale,baseline-m.m_HorizontalBearingY*scale,m.m_Width*scale,m.m_Height*scale);x+=m.m_HorizontalAdvance*scale}else{ctx.font=`bold ${size}px sans-serif`;ctx.fillStyle='#fff';ctx.fillText(c,x,baseline);x+=size}}});
 ctx.globalCompositeOperation='source-in';ctx.fillStyle=style.color;ctx.fillRect(0,0,width,height);return canvas;
}
export function paintNativeLabels(root=document){if(!font||!atlas)return;const selectors='.sub-title,.page-label,.square-button,.expedition,.camp-team>.edit,.pane-actions button,.starter-title,.starter-confirm,.dialog h2,.quest-tabs button,.result-heading,.shop-tabs button,.native-cook-text,.native-hud-number,.native-bonus-text,.native-stage-select-text,.native-stage-description-text,.native-recruit-text,.native-result-text,.native-starter-confirm,.native-failure-text,.native-team-text,.native-detail-text';root.querySelectorAll(selectors).forEach(el=>{[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()).forEach(n=>{const text=n.textContent,span=document.createElement('span'),source=document.createElement('span');span.className='native-label';source.className='native-text-source';source.textContent=text;span.append(source,labelCanvas(text,getComputedStyle(el),el.dataset.nativeFont));n.replaceWith(span)})})}

