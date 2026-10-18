import {useMemo} from 'react';
import {aggregate,project} from './model/projection';
import {eligiblePolls,pollDate} from './model/pollPolicy';
import type {Config} from './model/types';
const keys=['PP','PSOE','VOX','SUMAR','PODEMOS','SALF'];
const fmt=(n:number)=>n.toLocaleString('es-ES',{maximumFractionDigits:2});
export default function PollDiagnostics({config,compact=false}:{config:Config;compact?:boolean}){
  const polls=eligiblePolls(config.polls,config.asOf);
  const diagnostic=useMemo(()=>{
    if(compact)return {base:null,rows:[],error:''};
    try{const base=project(config);return {base,rows:eligiblePolls(config.polls,config.asOf).map(p=>{try{const next={...config,polls:config.polls.map(x=>x.institute===p.institute?{...x,enabled:false}:x)};return {poll:p,result:project(next),error:''};}catch(e){return {poll:p,result:null,error:(e as Error).message};}}),error:''};}catch(e){return {base:null,rows:[],error:(e as Error).message};}
  },[config,compact]);
  let aggregated:Record<string,number>={};try{aggregated=aggregate(config).shares;}catch{/* Display the main validation error. */}
  return <section><h3>Comparar datos publicados</h3><p>Se muestra la publicación más reciente de cada instituto. Un guión indica que no se publica un dato para ese partido.</p><div className="table-wrap"><table><thead><tr><th>Instituto</th><th>Fin campo / publicación</th>{keys.map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{polls.map(p=><tr key={p.id}><td><a href={p.source}>{p.institute}</a></td><td>{pollDate(p)}{p.end?'':' (publicación)'}</td>{keys.map(k=><td key={k}>{k in p.shares?fmt(p.shares[k])+' %':'—'}</td>)}</tr>)}<tr><td><b>Agregado del modelo</b></td><td>{config.asOf}</td>{keys.map(k=><td key={k}>{k in aggregated?fmt(aggregated[k])+' %':'—'}</td>)}</tr></tbody></table></div>
  {!compact&&<details><summary>¿Cuánto depende el reparto de cada encuestadora?</summary><p>Se recalcula quitando un instituto cada vez y manteniendo los demás parámetros. Las diferencias son sensibilidad del modelo, no medidas de acierto de la encuestadora.</p>{diagnostic.error&&<p role="alert">{diagnostic.error}</p>}<div className="table-wrap"><table><thead><tr><th>Instituto retirado</th><th>Δ PP</th><th>Δ PSOE</th><th>Δ Vox</th><th>Δ Frente Amplio</th></tr></thead><tbody>{diagnostic.rows.map(({poll,result,error})=><tr key={poll.id}><td>{poll.institute}</td>{result?['PP','PSOE','VOX','FA'].map(k=><td key={k}>{(result.allocation[k]??0)-(diagnostic.base?.allocation[k]??0)}</td>):<td colSpan={4}>{error}</td>}</tr>)}</tbody></table></div></details>}</section>;
}
