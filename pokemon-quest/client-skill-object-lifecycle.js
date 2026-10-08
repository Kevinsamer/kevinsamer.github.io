// SkillObjectBase.Hit (ARM 0x78fcbc) applies the hit first, then returns
// commonDescription.isHitOff at 0x790468. Onetime's collision subscriber
// (0x7958a8) requests termination only when that return value is true.
// "HitOff" means switch this object off AFTER a hit, not suppress damage.
export function clientObjectTerminatesOnHit(object) {
  return object.command.name === 'CreateSkillObjectOnetime' &&
    !!object.data.isHitOff;
}

export function finishClientObjectDamageHit(object) {
  if (!clientObjectTerminatesOnHit(object)) return false;
  object.hitTerminated = true;
  return true;
}

export function clientObjectDamageHitEnabled(object) {
  return !object.hitTerminated;
}
