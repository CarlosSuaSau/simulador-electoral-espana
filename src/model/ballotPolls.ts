import type {Config,Poll,Projection} from './types';
import {eligiblePolls,pollDate} from './pollPolicy';
import {correctedShares} from './pollCorrection';

// A coalition observation is a final ballot, not an origin to transfer again.
export function ballotAverage(c:Config):Record<string,number>{
  const polls=eligiblePolls(c.polls,c.asOf);
  const keys=[...new Set(polls.flatMap(p=>Object.keys(p.ballotShares??{})))];
  return Object.fromEntries(keys.map(key=>{
    let sum=0,weight=0;
    for(const p of polls){
      if(!(key in (p.ballotShares??{})))continue;
      const w=p.weight*2**(-Math.max(0,(Date.parse(c.asOf)-Date.parse(pollDate(p)))/86400000)/c.halfLife);
      const total=Object.values(p.ballotShares??{}).reduce((s,n)=>s+n,0);
      const corrected=correctedShares({...p,shares:{...p.shares,SUMAR:total}},!!c.halfError2023);
      const factor=total?corrected.SUMAR/total:1;
      sum+=p.ballotShares![key]*factor*(p.denominator==='candidates'?1-c.blank/100:1)*w;weight+=w;
    }
    return [key,sum/weight];
  }));
}
export function observedBallots(p:Poll){return {...p.shares,...p.ballotShares};}

// Preserve each province's valid-vote total and structural zeros. Direct
// coalition observations replace their modelled national total. The remaining
// ballots keep their relative national totals, scaled to the residual budget.
export function fitBallotVotes(rows:Projection[],shares:Record<string,number>){
  if(!Object.keys(shares).length)return;
  const valid=rows.reduce((s,p)=>s+p.valid,0);
  rows=rows.filter(p=>Object.keys(shares).some(k=>(p.votes[k]??0)>0));
  const keys=[...new Set(rows.flatMap(p=>Object.keys(p.votes)))];
  const rowTotals=rows.map(p=>Object.values(p.votes).reduce((s,n)=>s+n,0));
  const budget=rowTotals.reduce((s,n)=>s+n,0);
  const columns=Object.fromEntries(keys.map(k=>[k,rows.reduce((s,p)=>s+(p.votes[k]??0),0)]));
  const fixed=Object.values(shares).reduce((s,n)=>s+n*valid/100,0);
  const rest=keys.filter(k=>!(k in shares)).reduce((s,k)=>s+columns[k],0);
  if(fixed>=budget||!rest)throw Error('Las estimaciones de coaliciones no caben en el total de voto.');
  const targets=Object.fromEntries(keys.map(k=>[k,k in shares?shares[k]*valid/100:columns[k]*(budget-fixed)/rest]));
  for(const key of Object.keys(shares))if(!columns[key]&&shares[key]>0)throw Error(`Sin soporte territorial para la candidatura ${key}.`);
  let error=Infinity;
  for(let step=0;step<800;step++){
    for(const key of keys){const sum=rows.reduce((s,p)=>s+(p.votes[key]??0),0);const scale=sum?targets[key]/sum:0;for(const p of rows)p.votes[key]=(p.votes[key]??0)*scale;}
    rows.forEach((p,i)=>{const sum=Object.values(p.votes).reduce((s,n)=>s+n,0);for(const key of keys)p.votes[key]*=rowTotals[i]/sum;});
    error=Math.max(...keys.map(k=>Math.abs(rows.reduce((s,p)=>s+p.votes[k],0)-targets[k])));
    if(error<.1)break;
  }
  if(error>1)throw Error('No converge el ajuste de las coaliciones a sus encuestas.');
  rows.forEach((p,i)=>{
    const floors=Object.fromEntries(keys.map(k=>[k,Math.floor(p.votes[k])]));
    const remainder=rowTotals[i]-Object.values(floors).reduce((s,n)=>s+n,0);
    keys.slice().sort((a,b)=>(p.votes[b]-floors[b])-(p.votes[a]-floors[a])||a.localeCompare(b)).slice(0,remainder).forEach(k=>floors[k]++);
    p.votes=floors;
  });
}
