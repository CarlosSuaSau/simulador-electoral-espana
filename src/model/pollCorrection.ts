import catalog from '../data/poll-errors-2023.json';
import official from '../data/official-results-2023.json';
import registry from '../data/historical-families.json';
import type {Poll} from './types';
export {catalog as errorCatalog};
export const correctionKeys=['PP','PSOE','VOX','SUMAR'];
const total=official.provinces.reduce((s,p)=>s+p.validVotes,0);
export const actual2023:Record<string,number>=Object.fromEntries(correctionKeys.map(key=>[key,100*official.provinces.reduce((s,p)=>s+Object.entries(p.votes).reduce((sum,[name,n])=>sum+((registry.mapping as Record<string,string>)[name]===key?n:0),0),0)/total]));
export function referenceError(institute:string){return catalog.polls.find(p=>p.institute.toLowerCase()===institute.toLowerCase());}
export function correctedShares(p:Poll,enabled:boolean):Record<string,number>{
  const ref=referenceError(p.institute);if(!enabled||!ref)return {...p.shares};
  return adjustForError(p,Object.fromEntries(correctionKeys.map(k=>[k,actual2023[k]-(ref.shares as Record<string,number>)[k]])),0.5);
}
export function adjustForError(p:Poll,errors:Record<string,number>,strength:number):Record<string,number>{
  const shares={...p.shares};
  const keys=correctionKeys.filter(k=>k==='SUMAR'?('SUMAR' in shares||'PODEMOS' in shares):k in shares);
  if(!keys.length)return shares;
  const error=Object.fromEntries(keys.map(k=>[k,errors[k]??0]));
  // Center errors over the observed categories, so applying half of their
  // signed error does not silently consume the unreported-party residual.
  const center=keys.reduce((s,k)=>s+error[k],0)/keys.length;
  const budget=keys.reduce((s,k)=>s+(k==='SUMAR'?(shares.SUMAR??0)+(shares.PODEMOS??0):shares[k]),0);
  const corrected=Object.fromEntries(keys.map(k=>[k,Math.max(0,(k==='SUMAR'?(shares.SUMAR??0)+(shares.PODEMOS??0):shares[k])+strength*(error[k]-center))]));
  const sum=Object.values(corrected).reduce((s,n)=>s+n,0);
  for(const key of keys){
    const value=sum?corrected[key]*budget/sum:0;
    if(key==='SUMAR'){
      const combined=(shares.SUMAR??0)+(shares.PODEMOS??0);
      if('SUMAR' in shares)shares.SUMAR=value*(combined?(p.shares.SUMAR??0)/combined:1);
      if('PODEMOS' in shares)shares.PODEMOS=value*(combined?(p.shares.PODEMOS??0)/combined:0);
    }else shares[key]=value;
  }
  return shares;
}

export const meanError2023:Record<string,number>=Object.fromEntries(correctionKeys.map(k=>[k,actual2023[k]-catalog.polls.reduce((s,p)=>s+(p.shares as Record<string,number>)[k],0)/catalog.polls.length]));
