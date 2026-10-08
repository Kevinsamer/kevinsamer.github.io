export function migrateSourceStoneResistance(stone){
 const commands=stone.source?.version===1&&stone.source.commands;
 if(!Array.isArray(commands)||!commands.some(c=>[48,49].includes(c.commandID)))return false;
 const values={};for(const c of commands)if([48,49].includes(c.commandID)){if(!Number.isFinite(c.params?.[0]))return false;const key=c.commandID===48?'effectResistance':'statusResistance';values[key]=(values[key]||0)+Math.round(-c.params[0]*10000)/100;}
 stone.bonus??={};delete stone.bonus.effectResistance;delete stone.bonus.statusResistance;Object.assign(stone.bonus,values);return true;
}
