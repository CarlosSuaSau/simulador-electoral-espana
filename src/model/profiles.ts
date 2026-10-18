import references from '../data/reference-elections.json';
import type {Config} from './types';
import regions from '../data/regions.json';

export const profileDefaults:Record<string,number>={'2023-07-23':100,'2019-11-10':0,'2019-04-28':0};
export const missingBallots:Record<string,string[]>={VOX:['38']};
export function repaired2023(historical:Record<string,Record<string,number>>,valid:Record<string,number>){
  const votes=structuredClone(historical);
  const totalValid=Object.values(valid).reduce((s,n)=>s+n,0);
  for(const [party,codes] of Object.entries(missingBallots)){
    const national=Object.values(historical).reduce((s,v)=>s+(v[party]??0),0)/totalValid;
    for(const code of codes){
      let quotient=0,weight=0;
      for(const [date,e] of Object.entries(references.elections)){
        const n=Object.values(e.votes).reduce((s,v)=>s+((v as Record<string,number>)[party]??0),0);
        const total=Object.values(e.valid).reduce((s,n)=>s+n,0);
        const w=date==='2019-11-10'?2:1;
        const local=(e.votes as Record<string,Record<string,number>>)[code]?.[party];
        if(local&&n){quotient+=w*local/(e.valid as Record<string,number>)[code]/(n/total);weight+=w;}
      }
      if(!weight)throw Error(`Falta referencia de candidatura ausente: ${party} en ${code}.`);
      const imputed=valid[code]*national*quotient/weight;
      const existing=Object.values(votes[code]).reduce((s,n)=>s+n,0);
      // The counterfactual restores the missing ballot without creating voters.
      for(const k of Object.keys(votes[code]))votes[code][k]*=(existing-imputed)/existing;
      votes[code][party]=imputed;
    }
  }
  return votes;
}
export function territorialProfiles(historical:Record<string,Record<string,number>>,valid:Record<string,number>,c:Config){
  const elections:Record<string,{votes:Record<string,Record<string,number>>;valid:Record<string,number>}>={
    '2023-07-23':{votes:repaired2023(historical,valid),valid},...references.elections,
  };
  const weights=c.profileWeights??profileDefaults;
  const result:Record<string,Record<string,number>>={};
  for(const code of Object.keys(historical))result[code]={};
  for(const key of new Set(Object.values(historical).flatMap(v=>Object.keys(v)))){
    let denominator=0;
    for(const [date,e] of Object.entries(elections)){
      const national=Object.values(e.votes).reduce((s,v)=>s+(v[key]??0),0);
      const weight=weights[date]??0;
      if(!national||!weight)continue;
      const electorate=Object.values(e.valid).reduce((s,n)=>s+n,0);
      denominator+=weight;
      for(const code of Object.keys(historical)){
        // Location quotient separates electoral geography from national popularity.
        const quotient=(e.votes[code]?.[key]??0)/e.valid[code]/(national/electorate);
        result[code][key]=(result[code][key]??0)+weight*quotient;
      }
    }
    for(const code of Object.keys(historical))result[code][key]=(result[code][key]??0)/Math.max(denominator,1)*valid[code];
  }
  // A national estimate for a newly expanded regional ballot cannot be forced
  // into the single province where its 2023 ballot existed.
  for(const code of Object.keys(historical))result[code].AA=(regions as Record<string,string>)[code]==='01'?(result[code].SUMAR??0):0;
  return result;
}
