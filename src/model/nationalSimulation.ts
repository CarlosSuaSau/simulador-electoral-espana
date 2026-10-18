import {aggregate,pollAverage,probabilitySimulation} from './projection';
import {actual2023,adjustForError,correctionKeys,referenceError,errorCatalog} from './pollCorrection';
import {eligiblePolls} from './pollPolicy';
import type {Config,Probabilities} from './types';
export type NationalOptions={iterations:number;seed:number};
export const nationalDefaults:NationalOptions={iterations:1000,seed:20261018};
export function sampledAggregate(config:Config,budget:number){
  const average=pollAverage(config).shares;const total=Object.values(average).reduce((s,n)=>s+n,0);
  return Object.fromEntries(Object.entries(average).map(([k,n])=>[k,n*budget/total]));
}
export function nationalInput(config:Config,options:NationalOptions):Config{
  const c=structuredClone(config);c.halfError2023=false;
  c.uncertainty={...c.uncertainty,iterations:options.iterations,seed:options.seed,accepted:true,national:Math.max(1.5,c.uncertainty.national),regional:Math.max(1,c.uncertainty.regional),provincial:Math.max(1,c.uncertainty.provincial),bloc:Math.max(1,c.uncertainty.bloc),turnout:Math.max(1,c.uncertainty.turnout)};
  return c;
}
export function nationalSimulation(config:Config,options:NationalOptions,onProgress?:(n:number)=>void):Probabilities{
  const c=nationalInput(config,options);const polls=eligiblePolls(c.polls,c.asOf);const baseline=aggregate(c);const weights=baseline.weights;
  const measuredBudget=Object.values(baseline.shares).reduce((s,n)=>s+n,0);
  const references=polls.flatMap((p,i)=>{const ref=referenceError(p.institute);return ref?[{ref,weight:weights[i].weight}]:[];});
  // Unknown institutes still face the historical ensemble, never zero error.
  const pool=references.length?references:errorCatalog.polls.map(ref=>({ref,weight:1}));
  const sum=pool.reduce((s,r)=>s+r.weight,0);
  return probabilitySimulation(c,onProgress,(base,random)=>{
    let draw=random()*sum;const chosen=pool.find(r=>(draw-=r.weight)<=0)??pool[pool.length-1];
    const errors=Object.fromEntries(correctionKeys.map(k=>[k,actual2023[k]-(chosen.ref.shares as Record<string,number>)[k]]));
    // One shared national vector per election, covering opposite error, no
    // repeat, half repeat and up to 1.5 times 2023. Mean strength = 0.5.
    const strength=-0.5+2*random();
    const draws=base.polls.map(p=>({...p,weight:p.weight*-Math.log(Math.max(random(),1e-12)),shares:adjustForError(p,errors,strength)}));
    const scale=Math.min(1,100/Math.max(...draws.map(p=>p.weight),1));
    // Bayesian bootstrap of institutes also propagates current disagreement,
    // including parties such as Junts without a comparable 2023 error vector.
    const sampled={...base,polls:draws.map(p=>({...p,weight:p.weight*scale}))};
    // Reconcile partially reported categories on the same simplex. Otherwise
    // independent item means can exceed 100% when bootstrap weights change.
    // Keep the original measured budget and unreported residual unchanged.
    const shares=sampledAggregate(sampled,measuredBudget);
    return {...base,polls:[{...polls[0],id:'national-sampled-aggregate',institute:'Agregado simulado',verification:'user',denominator:'valid',shares,weight:1,start:null,end:null,published:base.asOf,enabled:true}]};
  });
}
export function atLeast(hist:Record<number,number>,seat:number,iterations:number){return Object.entries(hist).reduce((s,[n,count])=>s+(Number(n)>=seat?count:0),0)/iterations;}
export function wilsonLower(successes:number,total:number){if(!total)return 0;const z=1.96,p=successes/total;return (p+z*z/(2*total)-z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total)))/(1+z*z/total);}
export type SeatConfidence='solid'|'likely'|'swing';
export function classifySeat(probability:number,iterations:number):SeatConfidence{const lower=wilsonLower(Math.round(probability*iterations),iterations);return lower>=.99?'solid':lower>=.9?'likely':'swing';}
export function provinceConfidence(result:Probabilities,code:string){
  const joint=result.jointProvincial?.[code];if(!joint||!Object.keys(joint).length)throw Error('Falta la distribución conjunta provincial.');
  const modal=Object.entries(joint).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
  const allocation=JSON.parse(modal[0]) as Record<string,number>;
  const seats=Object.entries(allocation).flatMap(([party,n])=>Array.from({length:n},(_,i)=>{const probability=atLeast(result.provincial[code]?.[party]??{},i+1,result.iterations);return {party,seat:i+1,probability,confidence:classifySeat(probability,result.iterations)};}));
  return {code,seats,solid:seats.filter(s=>s.confidence==='solid').length,likely:seats.filter(s=>s.confidence==='likely').length,swing:seats.filter(s=>s.confidence==='swing').length};
}
export function provinceRaces(result:Probabilities,code:string){
  const confidence=provinceConfidence(result,code);
  const joint=result.jointProvincial![code];
  const modal=Object.entries(joint).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
  const order=result.jointOrder?.[code]?.[modal];
  if(!order)throw Error('Repite la simulación para consultar el orden de adjudicación.');
  const own:Record<string,number>={};
  const consolidated:Record<string,number>={};
  const seats=order.map((party,index)=>{
    const seat=own[party]=(own[party]??0)+1;
    const probability=atLeast(result.provincial[code]?.[party]??{},seat,result.iterations);
    const stable=classifySeat(probability,result.iterations)!=='swing';
    if(stable)consolidated[party]=(consolidated[party]??0)+1;
    const contenders=Object.entries(result.order[code]??{}).map(([party,h])=>({party,probability:(h[index+1]??0)/result.iterations})).filter(p=>p.probability>0).sort((a,b)=>b.probability-a.probability||a.party.localeCompare(b.party));
    return {rank:index+1,party,seat,probability,stable,contenders};
  });
  const swing=seats.filter(s=>!s.stable).length;
  const opportunities=Object.fromEntries(Object.entries(result.provincial[code]??{}).map(([party,h])=>[party,Math.min(swing,Math.max(0,Math.max(...Object.keys(h).filter(n=>h[Number(n)]>0).map(Number),0)-(consolidated[party]??0)))]));
  return {code,seats,consolidated,stable:confidence.solid+confidence.likely,swing,opportunities};
}
