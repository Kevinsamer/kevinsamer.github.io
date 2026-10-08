import {misc} from './client-rules.js';
// Source Misc.GetResultFsGiftTicket: reject underflow/overflow, never truncate.
export function questTicketResult(balance,amount){const value=balance+amount,{m_min:min,m_max:max}=misc.m_fsGiftTicket;return {code:value<min?1:value>max?2:0,value,min,max};}
// Offline adaptation of the original external/mobile backup achievement.
// Invoke only after successful local export creation; does not pretend cloud upload.
export function recordLocalBackup(g,{created=true}={}){if(!created)return false;g.records??={};g.records.backupCreated=Math.max(1,g.records.backupCreated||0);g.offline??={};g.offline.localBackup={version:1,created:true,kind:'local-export'};return true;}
