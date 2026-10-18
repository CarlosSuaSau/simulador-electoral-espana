import SeatDots,{partyColor,partyName} from './SeatDots';
import {historical,provinces} from './model/projection';
import type {Candidate,Forecast} from './model/types';
const fmt=(n:number)=>n.toLocaleString('es-ES',{maximumFractionDigits:2});
export function nationalVotes(forecast:Forecast){const votes:Record<string,number>={};for(const p of forecast.provinces)for(const [k,n] of Object.entries(p.votes))votes[k]=(votes[k]??0)+n;return votes;}
export default function NationalProjection({forecast,reference,referenceSeats,candidates}:{forecast:Forecast;reference:Forecast|null;referenceSeats:Record<string,number>;candidates:Candidate[]}){
  const votes=nationalVotes(forecast);const valid=forecast.provinces.reduce((s,p)=>s+p.valid,0);
  const refVotes=reference?nationalVotes(reference):Object.values(historical).reduce((sum,v)=>{for(const [k,n] of Object.entries(v))sum[k]=(sum[k]??0)+n;return sum;},{} as Record<string,number>);
  const refValid=reference?reference.provinces.reduce((s,p)=>s+p.valid,0):provinces.reduce((s,p)=>s+p.validVotes,0);
  const keys=[...new Set([...Object.keys(votes),...Object.keys(refVotes)])].filter(k=>votes[k]||refVotes[k]).sort((a,b)=>(votes[b]??0)-(votes[a]??0));
  return <><p className="eyebrow">Suma de las 52 circunscripciones</p><h2>España · resultado nacional</h2><SeatDots allocation={forecast.allocation} candidates={candidates}/><p className="model-note">Los 350 escaños son la suma de los repartos provinciales. Los porcentajes corresponden a las papeletas después de los trasvases; el agregado de encuestas conserva sus categorías de origen.</p><p>{fmt(valid)} votos válidos · blancos: {fmt(forecast.provinces.reduce((s,p)=>s+p.blank,0))} · abstención: {fmt(forecast.provinces.reduce((s,p)=>s+p.abstention,0))}.</p><div className="table-wrap"><table><thead><tr><th>Candidatura</th><th>% válido</th><th>Δ puntos</th><th>Votos</th><th>Escaños referencia → actual</th></tr></thead><tbody>{keys.map(k=><tr key={k}><td><i className="color-dot" style={{background:partyColor(k,candidates)}}/>{partyName(k,candidates)}</td><td>{fmt(100*(votes[k]??0)/valid)} %</td><td>{fmt(100*(votes[k]??0)/valid-100*(refVotes[k]??0)/refValid)}</td><td>{fmt(votes[k]??0)}</td><td>{referenceSeats[k]??0} → <b>{forecast.allocation[k]??0}</b></td></tr>)}</tbody></table></div></>;
}
