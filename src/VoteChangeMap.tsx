import {useMemo,useState} from 'react';
import ProvinceMap from './ProvinceMap';
import {partyName} from './SeatDots';
import {historical,provinces} from './model/projection';
import type {Config,Forecast} from './model/types';
export function changeColor(delta:number){
  if(Math.abs(delta)<1e-10)return '#d1d5db';
  const intensity=Math.min(Math.abs(delta)/15,1);
  return `hsl(${delta>0?140:0} 65% ${92-intensity*59}%)`;
}
export function provincialChanges(forecast:Forecast,config:Config,party:string){
  return provinces.map(p=>{
    const current=forecast.provinces.find(r=>r.code===p.code)!;
    const candidate=config.candidates.find(c=>c.id===party);
    const origins=candidate?Object.entries(config.successors?.[p.code]??{}).filter(([,target])=>target===party).map(([origin])=>origin):[party];
    const previousVotes=origins.reduce((s,k)=>s+(historical[p.code][k]??0),0);
    const previous=100*previousVotes/p.validVotes;
    const projected=100*(current.votes[party]??0)/current.valid;
    return {code:p.code,name:p.name,previous,projected,delta:projected-previous,origins,successor:config.successors?.[p.code]?.[party]};
  });
}
const number=(n:number)=>n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const signed=(n:number)=>Math.abs(n)<1e-10?'0,00':Math.abs(n)<.005?(n>0?'+<0,01':'−<0,01'):(n>0?'+':'−')+number(Math.abs(n));
export default function VoteChangeMap({forecast,config}:{forecast:Forecast;config:Config}){
  const [party,setParty]=useState('PSOE');const [code,setCode]=useState('28');
  const parties=useMemo(()=>[...new Set([...forecast.provinces.flatMap(p=>Object.keys(p.votes).filter(k=>p.votes[k]>0)),...config.candidates.map(c=>c.id)])].sort((a,b)=>partyName(a,config.candidates).localeCompare(partyName(b,config.candidates),'es')),[forecast,config.candidates]);
  const selectedParty=parties.includes(party)?party:parties[0];
  const rows=useMemo(()=>provincialChanges(forecast,config,selectedParty),[forecast,config,selectedParty]);
  const selected=rows.find(p=>p.code===code)!;
  const name=(k:string)=>partyName(k,config.candidates);
  return <section className="panel vote-change-map"><p className="eyebrow">Proyección actual frente al resultado oficial de 2023</p><h2>Variación del voto por provincia</h2><p>La cifra indica puntos porcentuales sobre votos válidos, incluidos blancos. La intensidad aumenta con la magnitud del cambio y mantiene la misma escala para todos los partidos: se satura en ±15 puntos.</p><div className="toolbar"><label>Partido o candidatura<select aria-label="Partido del mapa de variación" value={selectedParty} onChange={e=>setParty(e.target.value)}>{parties.map(k=><option key={k} value={k}>{name(k)}</option>)}</select></label><label>Provincia del cambio<select value={code} onChange={e=>setCode(e.target.value)}>{provinces.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></label></div><div className="layout-grid"><div><ProvinceMap selected={code} onSelect={setCode} names={Object.fromEntries(rows.map(p=>[p.code,p.name]))} colors={Object.fromEntries(rows.map(p=>[p.code,changeColor(p.delta)]))} values={Object.fromEntries(rows.map(p=>[p.code,signed(p.delta)]))} titles={Object.fromEntries(rows.map(p=>[p.code,`${p.name}: ${signed(p.delta)} pp · 2023 ${number(p.previous)} % → proyección ${number(p.projected)} %`]))}/><div className="seat-legend">{[-15,-5,0,5,15].map(n=><span key={n}><i style={{background:changeColor(n)}}/>{n>0?'+':''}{n} pp</span>)}</div></div><div><h3>{selected.name} · {name(selectedParty)}</h3><div className="stats"><div><strong>{number(selected.previous)} %</strong><span>Referencia 2023</span></div><div><strong>{number(selected.projected)} %</strong><span>Proyección actual</span></div><div><strong>{signed(selected.delta)} pp</strong><span>Variación</span></div></div><p className="model-note">{config.candidates.some(c=>c.id===selectedParty)?selected.origins.length?`Referencia de la nueva papeleta: suma del voto de 2023 de ${selected.origins.map(name).join(' + ')} en esta provincia. Es una comparación de alianzas, no una tasa de fidelidad individual.`:'Esta candidatura no tiene una correspondencia histórica configurada en esta provincia; la referencia es cero.':`Se compara la misma familia electoral en ambos escenarios.`}</p>{selected.successor&&<p className="model-note">{name(selectedParty)} no tiene papeleta propia en esta provincia: concurre mediante {name(selected.successor)}. Selecciona esa coalición para comparar la alianza.</p>}{selectedParty==='VOX'&&code==='38'&&<p className="model-note">Vox no tuvo candidatura en Tenerife en 2023. Su subida desde cero refleja también esa ausencia; no mide por sí sola un cambio de preferencias. El mapa usa el resultado oficial, sin imputar aquí votos históricos.</p>}<p>{config.halfError2023?'La corrección de medio error de 2023 está activa.':'La corrección de medio error de 2023 está desactivada.'} El mapa sigue la proyección determinista y sus trasvases.</p><details><summary>Consultar las 52 variaciones</summary><div className="table-wrap"><table><thead><tr><th>Provincia</th><th>2023</th><th>Actual</th><th>Δ puntos</th></tr></thead><tbody>{rows.map(p=><tr key={p.code}><td><button className="link-button" onClick={()=>setCode(p.code)}>{p.name}</button></td><td>{number(p.previous)} %</td><td>{number(p.projected)} %</td><td>{signed(p.delta)}</td></tr>)}</tbody></table></div></details></div></div></section>;
}
