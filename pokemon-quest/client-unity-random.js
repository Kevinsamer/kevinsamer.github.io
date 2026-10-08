// Static ARM/Thumb recovery from supplied Unity 2020.3.48f1 libunity.so.
const f=Math.fround,FLOAT_SCALE=f(1.1920930376163597e-7);
export function originalUnitySeedState(seed){const state=[seed>>>0];for(let i=1;i<4;i++)state.push((Math.imul(1812433253,state[i-1])+1)>>>0);return state;}
export function createOriginalUnityRandom(seed=0){
 let state=originalUnitySeedState(seed);
 const next=()=>{let t=(state[0]^(state[0]<<11))>>>0;t=(t^(t>>>8))>>>0;const n=(t^state[3]^(state[3]>>>19))>>>0;state=[state[1],state[2],state[3],n];return n;};
 const api={get state(){return [...state];},set state(value){if(value.length!==4)throw new RangeError('Unity State needs four words');state=value.map(x=>x>>>0);},
  initState(value){state=originalUnitySeedState(value);},nextUint:next,
  rangeInt(min,max){min|=0;max|=0;if(min===max)return min;const n=next();return min<max?(min+n%((max-min)>>>0))|0:(min-n%((min-max)>>>0))|0;},
  rangeFloat(min,max){min=f(min);max=f(max);const u=f((next()&0x7fffff)*FLOAT_SCALE);return f(f(f(1-u)*max)+f(u*min));},
  withSeed(value,callback){const previous=api.state;api.initState(value);try{return callback(api);}finally{api.state=previous;}}
 };return api;
}
export function createOriginalDropSeedData(random){return {dropSeeds:Array.from({length:128},()=>random.rangeInt(-2147483648,2147483647)),counter:0};}
export function allocateOriginalEnemyDropSeeds(data){const take=()=>data.dropSeeds[data.counter++%data.dropSeeds.length];return {dropSeedForEnemy:take(),dropSeedForDropManager:take()};}

// SerializeFirst writes the eight scene seeds before the 128 drop seeds.
export function createOriginalBattleSeedData(random){const initSeeds=Array.from({length:8},()=>random.rangeInt(-2147483648,2147483647));return {initSeeds,...createOriginalDropSeedData(random)};}
