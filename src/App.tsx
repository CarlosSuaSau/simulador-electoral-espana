import SiteInformation from './SiteInformation';
import {useState} from 'react';
import ForecastApp from './ForecastApp';
import HistoricalApp from './HistoricalApp';
export default function App(){
  const [historical,setHistorical]=useState(false);
  return <div className="app-shell"><header className="topbar"><div><p className="eyebrow">Simulador electoral independiente</p><h1>España, escaño a escaño</h1><p>Explora las encuestas, el mapa provincial y los escaños en juego</p></div><span className="status-pill">52 circunscripciones · Congreso</span></header><nav aria-label="Área de trabajo"><button aria-pressed={!historical} onClick={()=>setHistorical(false)}>Elecciones 2026</button><button aria-pressed={historical} onClick={()=>setHistorical(true)}>Resultados de 2023</button></nav>{historical?<HistoricalApp/>:<ForecastApp/>}<footer>{historical&&<SiteInformation/>}Independiente y apartidista · Proyecciones orientativas, no resultados oficiales.</footer></div>;
}
