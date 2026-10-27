import type {Config,Projection} from './model/types';
import {partyColor,partyName} from './SeatDots';
const specials:Record<string,string>={'@abstention':'Abstención','@blank':'Blanco','@null':'Nulo'};
export function transferDistribution(c:Config,code:string,origin:string){
  const residual=c.successors?.[code]?.[origin]??origin;
  const result:Record<string,number>={};
  for(const r of c.routes.filter(r=>r.province===code&&r.origin===origin))result[r.destination]=(result[r.destination]??0)+r.percent;
  result[residual]=(result[residual]??0)+100-Object.values(result).reduce((s,n)=>s+n,0);
  return result;
}
export function editTransfer(c:Config,code:string,origin:string,destination:string,percent:number):Config{
  percent=Math.max(0,Math.min(100,percent));
  const residual=c.successors?.[code]?.[origin]??origin;
  let routes=c.routes.filter(r=>r.province===code&&r.origin===origin&&r.destination!==residual).map(r=>({...r}));
  if(destination===residual){
    const sum=routes.reduce((s,r)=>s+r.percent,0);
    if(sum)routes.forEach(r=>r.percent*= (100-percent)/sum);
    else if(percent<100)routes.push({id:crypto.randomUUID(),province:code,origin,destination:'@abstention',percent:100-percent,uncertainty:0});
  }else{
    routes=routes.filter(r=>r.destination!==destination);
    const rest=routes.reduce((s,r)=>s+r.percent,0);
    if(rest>100-percent)routes.forEach(r=>r.percent*=(100-percent)/rest);
    if(percent)routes.push({id:crypto.randomUUID(),province:code,origin,destination,percent,uncertainty:c.routes.find(r=>r.province===code&&r.origin===origin&&r.destination===destination)?.uncertainty??0});
  }
  return {...c,routes:[...c.routes.filter(r=>r.province!==code||r.origin!==origin),...routes]};
}
export default function TransferMatrix({config,projection,onChange}:{config:Config;projection:Projection;onChange:(c:Config)=>void}){
  const code=projection.code;const name=(id:string)=>specials[id]??partyName(id,config.candidates);
  const origins=Object.keys(projection.sourceVotes).filter(k=>projection.sourceVotes[k]>0).sort((a,b)=>projection.sourceVotes[b]-projection.sourceVotes[a]);
  const destinations=[...origins.filter(k=>!config.successors?.[code]?.[k]),...config.candidates.filter(c=>c.territories.includes(code)).map(c=>c.id),...Object.keys(specials)];
  return <div className="transfer-matrix"><p>Todos los orígenes con voto estimado en esta provincia. Los partidos sin cambios parten de 100 % a sí mismos y 0 % a los demás. Abre un origen para editar todos sus destinos; cada fila conserva el 100 %.</p><p className="model-note">Supuestos iniciales: NC 60 % UPC y 40 % CC–Primero Canarias; CC 98 % a su alianza; PP y UPN 99 % a UPN–PP; restantes orígenes con alianza, 97 % a su sucesora. Las pérdidas restantes van a abstención. Son hipótesis de trabajo, editables, no trasvases observados.</p><p className="model-note">Las encuestas que ya desglosan una coalición fijan su estimación nacional. Estos ajustes exploran el reparto territorial; el voto observado de la coalición no se trasvasa de nuevo. Los movimientos desde el voto de 2023 ya están reflejados en las encuestas.</p>{origins.map(origin=>{
    const distribution=transferDistribution(config,code,origin);
    return <details key={origin} className="transfer-origin"><summary><b>{name(origin)}</b><span>{Object.entries(distribution).filter(([,n])=>n>0.001).map(([k,n])=>`${name(k)} ${n.toLocaleString('es-ES',{maximumFractionDigits:1})} %`).join(' · ')}</span></summary><div className="transfer-strip" aria-hidden="true">{Object.entries(distribution).filter(([,n])=>n>0).map(([k,n])=><span key={k} style={{width:n+'%',background:partyColor(k,config.candidates)}}/>)}</div><div className="poll-shares">{[...new Set(destinations.concat(Object.keys(distribution)))].map(destination=><label key={destination}>{name(destination)} (%)<input type="number" min="0" max="100" step="1" aria-label={`${name(origin)} hacia ${name(destination)}`} value={Math.round((distribution[destination]??0)*100)/100} onChange={e=>onChange(editTransfer(config,code,origin,destination,Number(e.target.value)))}/></label>)}</div><details><summary>Incertidumbre de los destinos alternativos</summary><div className="poll-shares">{config.routes.filter(r=>r.province===code&&r.origin===origin&&r.percent>0).map(r=><label key={r.id}>{name(r.destination)} · escala (pp)<input type="number" min="0" max="30" value={r.uncertainty} onChange={e=>onChange({...config,routes:config.routes.map(t=>t.id===r.id?{...t,uncertainty:Math.max(0,Math.min(30,Number(e.target.value)))}:t)})}/></label>)}</div></details></details>;
  })}</div>;
}
