import {useEffect,useRef,useState} from 'react';
import NationalResults from './NationalResults';
import {nationalDefaults,nationalInput} from './model/nationalSimulation';
import type {Config,Probabilities} from './model/types';
export default function NationalMonteCarlo({config}:{config:Config}){
  const [options,setOptions]=useState(nationalDefaults);const [result,setResult]=useState<Probabilities|null>(null);const [progress,setProgress]=useState<number|null>(null);const [error,setError]=useState('');
  const worker=useRef<Worker|null>(null);const [resultKey,setResultKey]=useState('');
  const fingerprint=JSON.stringify(nationalInput(config,options));
  useEffect(()=>{worker.current?.terminate();worker.current=null;setProgress(null);},[fingerprint]);
  useEffect(()=>()=>worker.current?.terminate(),[]);
  const stale=result&&resultKey!==fingerprint;
  const run=()=>{try{
    const input=nationalInput(config,options);if(options.iterations<50||options.iterations>5000)throw Error('Elige entre 50 y 5000 iteraciones.');
    worker.current?.terminate();const w=new Worker(new URL('./model/national.worker.ts',import.meta.url),{type:'module'});worker.current=w;setProgress(0);setError('');
    w.onmessage=e=>{if(e.data.kind==='progress')setProgress(e.data.value);else{if(e.data.kind==='result'){setResult(e.data.value);setResultKey(JSON.stringify(input));}else setError(e.data.value);setProgress(null);w.terminate();worker.current=null;}};
    w.onerror=()=>{setError('No se pudo ejecutar la simulación nacional.');setProgress(null);w.terminate();worker.current=null;};
    w.postMessage({config:input,options});
  }catch(e){setError((e as Error).message);}};
  return <section className="panel national-monte-carlo"><p className="eyebrow">Monte Carlo nacional · 52 circunscripciones simultáneas</p><h2>Mapa de escaños en juego</h2><p>Simula elecciones completas y descubre dónde está la disputa. Este análisis contempla posibles errores de las encuestas y funciona independientemente del interruptor de corrección.</p><div className="toolbar"><details><summary>Opciones de simulación</summary><label>Número de simulaciones<input aria-label="Iteraciones nacionales" type="number" min="50" max="5000" step="50" value={options.iterations} onChange={e=>setOptions({...options,iterations:Number(e.target.value)})}/></label><label>Semilla nacional<input type="number" value={options.seed} onChange={e=>setOptions({...options,seed:Number(e.target.value)})}/></label></details><button className="primary" onClick={run} disabled={progress!==null}>Simular las 52 provincias</button>{progress!==null&&<><span role="status">{progress} / {options.iterations}</span><button onClick={()=>{worker.current?.terminate();worker.current=null;setProgress(null);}}>Cancelar simulación nacional</button></>}</div>{error&&<p role="alert">{error}</p>}{stale&&<p className="notice">Cambió un dato o supuesto relevante. Repite la simulación nacional; el interruptor de corrección de 2023 no la invalida.</p>}{result&&!stale&&<NationalResults result={result} config={config}/>}</section>;
}
