// CharacterComponent.ApplyDamage 0x82a89c: enum1 LifeSteal,2 Recoil.
// floorf(single-precision calculated damage * ratio); not capped victim HP loss.
export function originalObjectDamageEffectAmount(damage,data){if(damage<1||![1,2].includes(data?.damageEffectType))return 0;return Math.max(0,Math.floor(Math.fround(Math.fround(damage)*Math.fround(data.damageEffectRatio||0))));}
export function applyObjectDamageEffect(owner,damage,data){if(!owner||owner.hp<=0)return {amount:0,delta:0};const amount=originalObjectDamageEffectAmount(damage,data),before=owner.hp;if(data?.damageEffectType===1)owner.hp=Math.min(owner.maxHp,owner.hp+amount);else if(data?.damageEffectType===2)owner.hp=Math.max(0,owner.hp-amount);return{amount,delta:owner.hp-before};}
