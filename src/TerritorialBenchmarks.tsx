import {project,regionCodes} from './model/projection';
import type {Config} from './model/types';
const source='https://www.sigmados.com/sondeo-de-arranque-de-campana-estimacion-de-voto-para-las-elecciones-generales-29-n-por-comunidad-autonoma/';
const references=[{region:'01',name:'Andalucía',seats:[25,17,16]},{region:'08',name:'Cataluña',seats:[6,16,7]},{region:'13',name:'Madrid',seats:[16,9,9]},{region:'19',name:'Comunitat Valenciana',seats:[12,10,9]},{region:'11',name:'Galicia',seats:[15,6,0]},{region:'04',name:'Canarias',seats:[6,6,2]}];
export default function TerritorialBenchmarks({config}:{config:Config}){
  let forecast;try{forecast=project(config);}catch{return null;}
  return <details><summary>Contraste territorial publicado: Sigma Dos</summary><p><a href={source}>Desglose por comunidad del 13 de octubre</a>, campo 1–8 de octubre, 2.017 entrevistas. Cifras de escaños anteriores a los pactos; se comparan PP, PSOE y Vox. Este contraste no modifica los pesos: los escaños publicados no permiten reconstruir porcentajes provinciales únicos.</p><table><thead><tr><th>Comunidad</th>{['PP','PSOE','VOX'].map(k=><th key={k}>{k}: Sigma / modelo</th>)}</tr></thead><tbody>{references.map(r=><tr key={r.region}><td>{r.name}</td>{['PP','PSOE','VOX'].map((k,i)=><td key={k}>{r.seats[i]} / {forecast.provinces.filter(p=>regionCodes[p.code]===r.region).reduce((s,p)=>s+(p.allocation[k]??0),0)}</td>)}</tr>)}</tbody></table></details>;
}
