import type {Poll} from './types';
export function excludedPoll(p:Poll){return /\bcis\b|centro de investigaciones sociol[oó]gicas/i.test(p.institute)||/\/cis(?:\/|\.)|cis\.es/i.test(p.originalSource)||/^cis[-_]/i.test(p.id);}
export function pollDate(p:Poll){return p.end??p.published;}
export function eligiblePolls(polls:Poll[],asOf:string){
  // One latest observation per institute prevents prolific pollsters from
  // dominating the aggregate. Manual weights operate between institutes.
  const latest=new Map<string,Poll>();
  for(const p of polls.filter(p=>!excludedPoll(p)&&p.enabled&&p.weight>0&&p.published<=asOf)){
    const key=p.institute.normalize('NFD').replace(/[\u0300-\u036f.\s]/g,'').toLowerCase();
    const previous=latest.get(key);
    if(!previous||pollDate(p)>pollDate(previous)||pollDate(p)===pollDate(previous)&&p.published>previous.published)latest.set(key,p);
  }
  return [...latest.values()];
}
