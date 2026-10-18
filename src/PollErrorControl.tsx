import type {Config} from './model/types';
export default function PollErrorControl({config,onChange}:{config:Config;onChange:(c:Config)=>void}){
  return <section className="panel correction-control"><div><p className="eyebrow">Escenario alternativo</p><h2>Compensar la mitad del error de 2023</h2><p>Explora qué cambiaría si las encuestas repitieran parte del error de las últimas generales.</p></div><label className="switch-label"><span>{config.halfError2023?'Activado':'Desactivado'}</span><input type="checkbox" role="switch" aria-label="Compensar la mitad del error de 2023" checked={!!config.halfError2023} onChange={e=>onChange({...config,halfError2023:e.target.checked})}/><span className="switch-track" aria-hidden="true"/></label></section>;
}
