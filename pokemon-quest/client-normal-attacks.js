import {skillResources} from './client-rules.js';
import {CLIENT_SKILL_PROGRAMS} from './client-skill-programs.js';

// SkillUtility.GetNormalSkill(type, range), ARM 0x79b3a0, indexes a
// [18,2] table. Explicit saved m_normalSkill IDs take precedence.
export function clientNormalSkillID(type, range) {
  if (!Number.isInteger(type) || type < 0 || type >= 18) return null;
  if (range !== 0 && range !== 1) return null;
  return type * 2 + range;
}

export function clientNormalAttack({normalSkillId, m_normalSkill, m_normalSkillID,
  type, range} = {}) {
  const explicit = normalSkillId ?? m_normalSkill ?? m_normalSkillID;
  const id = explicit ?? clientNormalSkillID(type, range);
  if (!Number.isInteger(id) || id < 0 || id >= 36) return null;
  const client = skillResources[id];
  const program = CLIENT_SKILL_PROGRAMS['Skill_' + client.m_skillPath];
  if (!program || program.id !== id) return null;
  return {id: 'normal-' + id, clientId: id, client, program,
    type: program.header.type, cooldown: client.m_chargeSecond,
    range: program.header.distance, isNormalAttack: true};
}

// CharacterSkill.<CreateSkillSequence>b__0 (0x8c9648) sets the normal
// charge counter in the completion callback, then emits onSkillFinished.
// Apply source PotentialCalculator modifiers before supplying chargeSecond.
export function finishClientNormalAttack(unit, skill, chargeSecond = skill.cooldown) {
  unit.cooldown = Math.max(0, chargeSecond);
}
