// Infinite currency is a persisted mode, never a non-finite JSON balance.
export const ticketLabel=g=>g.offline?.infiniteTickets===true?'∞':String(g.tickets??0);
export function canSpendTickets(g,cost){return Number.isFinite(cost)&&cost>=0&&(g.offline?.infiniteTickets===true||(Number.isFinite(g.tickets)&&g.tickets>=cost));}
export function spendTickets(g,cost){if(!canSpendTickets(g,cost))return false;if(g.offline?.infiniteTickets!==true)g.tickets-=cost;return true;}
