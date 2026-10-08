// APK SkillObjectBase/Onetime effect lifecycle. Start/impact effects are detached
// one-shots; effectStartSecond/effectEndSecond scale controlled loop effects.
// ActionType.Loop (3) uses its own end animation before object scale-down.
const validID=id=>Number.isInteger(id)&&id>=0&&id!==65535;
const positive=n=>Number.isFinite(n)?Math.max(0,n):0;
const fraction=(age,duration)=>duration>0?Math.min(1,Math.max(0,age/duration)):1;

export function clientEffectCreationTimes(data){
 const count=Math.max(1,Math.trunc(data.effectNum??1));
 const interval=positive(data.delaySecond);
 return Array.from({length:count},(_,index)=>index*interval);
}

export function clientStartEffectEvent(data){
 return validID(data.effectID_Start)?{effectID:data.effectID_Start,kind:'start',at:0,controlled:false}:null;
}

// Source effectID_End is Damage.effectTypeHit, not a TTL-expiry animation.
export function clientImpactEffectEvent(data,at=0){
 return validID(data.effectID_End)?{effectID:data.effectID_End,kind:'impact',at,controlled:false}:null;
}

export function sampleClientEffectLifecycle(data,{
 age=0,life=Infinity,terminatedAt=null,loopActionType=0,
 loopFinishedAt=null,endDrainCompleteAt=null
}={}){
 const created=clientEffectCreationTimes(data),hasLoop=validID(data.effectID_Loop);
 const expires=Number.isFinite(life)&&life>=0?life:Infinity;
 const explicit=Number.isFinite(terminatedAt)?Math.max(0,terminatedAt):Infinity;
 const stopAt=Math.min(expires,explicit);
 // Native UpdateLife requests termination after life is exceeded, not at ==life.
 const ending=age>expires||age>=explicit;
 const drainAt=endDrainCompleteAt??(stopAt+created.length*positive(data.delaySecond));
 const fadeAt=loopActionType===3?
   (Number.isFinite(loopFinishedAt)?Math.max(drainAt,loopFinishedAt):Infinity):drainAt;
 const endSecond=positive(data.effectEndSecond);
 let phase='active';
 if(!hasLoop)phase=ending?'finished':'active';
 else if(ending){
  if(age<drainAt)phase='ending-copies';
  else if(age<fadeAt)phase='end-animation';
  else phase=age>=fadeAt+endSecond?'finished':'scale-down';
 }
 const objectScale=ending&&age>=fadeAt?1-fraction(age-fadeAt,endSecond):1;
 return {phase,stopAt:ending?stopAt:null,damageEnabled:!ending,
  objectScale,finished:phase==='finished',
  effects:hasLoop&&phase!=='finished'?created.filter(at=>at<=age).map((at,index)=>({
   effectID:data.effectID_Loop,index,at,controlled:true,
   localScale:loopActionType===3?1:fraction(age-at,positive(data.effectStartSecond)),
   endAnimationRequested:ending&&loopActionType===3&&age>=stopAt+at
  })):[],
  startEvent:clientStartEffectEvent(data)};
}
