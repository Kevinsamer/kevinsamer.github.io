// Enum order recovered from APK LeanTweenType (type 3756).
// Closed-form polynomial/trigonometric curves; punch/shake require original
// AnimationCurve tangent recovery and intentionally keep a linear fallback.
const half=(t,f)=>t<.5?f(t*2)/2:1-f((1-t)*2)/2;
const bounce=t=>{if(t<4/11)return 121*t*t/16;if(t<8/11)return 121*(t-6/11)**2/16+.75;if(t<10/11)return 121*(t-9/11)**2/16+.9375;return 121*(t-21/22)**2/16+.984375;};
export function clientEase(id,time){const t=Math.max(0,Math.min(1,time));
 switch(id){
 case 0:case 1:return t;
 case 2:return 1-(1-t)**2;case 3:return t*t;case 4:return half(t,x=>x*x);
 case 5:return t**3;case 6:return 1-(1-t)**3;case 7:return half(t,x=>x**3);
 case 8:return t**4;case 9:return 1-(1-t)**4;case 10:return half(t,x=>x**4);
 case 11:return t**5;case 12:return 1-(1-t)**5;case 13:return half(t,x=>x**5);
 case 14:return 1-Math.cos(t*Math.PI/2);case 15:return Math.sin(t*Math.PI/2);case 16:return (1-Math.cos(t*Math.PI))/2;
 // LeanTween exponential curves deliberately do not clamp their endpoints.
 case 17:return 2**(10*(t-1));case 18:return 1-2**(-10*t);case 19:return t<.5?2**(20*t-10)/2:1-2**(-20*t+10)/2;
 case 20:return 1-Math.sqrt(1-t*t);case 21:return Math.sqrt(1-(t-1)**2);case 22:return half(t,x=>1-Math.sqrt(1-x*x));
 case 23:return 1-bounce(1-t);case 24:return bounce(t);case 25:return t<.5?(1-bounce(1-2*t))/2:(1+bounce(2*t-1))/2;
 case 26:return t*t*(2.70158*t-1.70158);case 27:return 1+(t-1)**2*(2.70158*(t-1)+1.70158);
 case 28:{const s=1.70158*1.525,x=t*2;return x<1?x*x*((s+1)*x-s)/2:((x-2)**2*((s+1)*(x-2)+s)+2)/2;}
 default:return t;
 }
}
