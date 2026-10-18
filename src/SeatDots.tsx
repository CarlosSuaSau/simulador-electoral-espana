import {colors,labels} from './model/defaults';
import {familyLabels,familyMapping} from './model/projection';
import type {Candidate} from './model/types';
export function partyName(id:string,candidates:Candidate[]=[]){const national=familyMapping[id]??id;return candidates.find(c=>c.id===national)?.name??labels[national]??familyLabels[national]??id;}
export function partyColor(id:string,candidates:Candidate[]=[]){return candidates.find(c=>c.id===id)?.color??colors[id]??colors[familyMapping[id]]??'#89949E';}
const left=['PODEMOS','SUMAR','FA','UPC','COMPROMIS','PSOE'];
const right=['PP','VOX','SALF'];
export function parliamentaryOrder(id:string){const k=familyMapping[id]??id;return left.includes(k)?left.indexOf(k):right.includes(k)?100+right.indexOf(k):50;}
export function hemicyclePositions(){return [20,24,29,33,38,43,48,54,61].flatMap((count,row)=>Array.from({length:count},(_,i)=>{const radius=105+row*22;const angle=Math.PI-i*Math.PI/(count-1);return {x:310+radius*Math.cos(angle),y:287-radius*Math.sin(angle),angle,row};})).sort((a,b)=>b.angle-a.angle||a.row-b.row);}
export default function SeatDots({allocation,candidates=[],hemicycle=false}:{allocation:Record<string,number>;candidates?:Candidate[];hemicycle?:boolean}){
  const normalized:Record<string,number>={};for(const [id,n] of Object.entries(allocation)){const k=familyMapping[id]??id;normalized[k]=(normalized[k]??0)+n;}
  const entries=Object.entries(normalized).filter(([,n])=>n>0).sort((a,b)=>parliamentaryOrder(a[0])-parliamentaryOrder(b[0])||a[0].localeCompare(b[0]));
  const seats=entries.flatMap(([id,n])=>Array.from({length:n},(_,i)=>({id,index:i+1})));
  // Nine semicircular rows hold exactly the 350 seats of the Congress.
  const positions=hemicyclePositions();
  return <div><div className={hemicycle?'hemicycle':'seat-dots'} role="img" aria-label={entries.map(([id,n])=>`${partyName(id,candidates)}: ${n} escaños`).join('; ')}>
    {hemicycle?<svg viewBox="0 0 620 310" aria-hidden="true">{positions.map((p,i)=>{const seat=seats[i];return seat?<circle key={i} data-party={seat.id} cx={p.x} cy={p.y} r="4.2" fill={partyColor(seat.id,candidates)}><title>{`${partyName(seat.id,candidates)} · ${seat.index}`}</title></circle>:null;})}</svg>:seats.map(s=><span className="seat-dot" key={`${s.id}-${s.index}`} style={{backgroundColor:partyColor(s.id,candidates)}} title={`${partyName(s.id,candidates)} · diputado ${s.index}`}/>)}
  </div><div className="seat-legend">{entries.map(([id,n])=><span key={id}><i style={{backgroundColor:partyColor(id,candidates)}}/>{partyName(id,candidates)} <strong>{n}</strong></span>)}</div></div>;
}
