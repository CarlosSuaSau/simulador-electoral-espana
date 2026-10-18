import {parliamentaryOrder,partyColor,partyName} from './SeatDots';
import type {Candidate} from './model/types';
export function sectorPath(start:number,end:number){
  const point=(radius:number,angle:number)=>[330+radius*Math.cos(angle),315-radius*Math.sin(angle)].join(',');
  return `M${point(290,start)} A290,290 0 0 1 ${point(290,end)} L${point(165,end)} A165,165 0 0 0 ${point(165,start)} Z`;
}
export function textColor(hex:string){const rgb=hex.replace('#','');const values=[0,2,4].map(i=>parseInt(rgb.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2]>.4?'#142b3e':'#ffffff';}
export default function ConfidenceHemicycle({consolidated,swing,candidates}:{consolidated:Record<string,number>;swing:number;candidates:Candidate[]}){
  const entries=Object.entries(consolidated).filter(([,n])=>n>0).sort(([a],[b])=>parliamentaryOrder(a)-parliamentaryOrder(b)||a.localeCompare(b));
  const index=entries.findIndex(([id])=>parliamentaryOrder(id)>=100);if(swing>0)entries.splice(index<0?entries.length:index,0,['@swing',swing]);
  const total=entries.reduce((s,[,n])=>s+n,0);let offset=0;
  return <div className="confidence-sectors"><svg className="confidence-hemicycle" viewBox="0 0 660 360" role="img" aria-label={`${total} escaños: ${total-swing} consolidados y ${swing} en juego`}>{entries.map(([party,n])=>{const start=Math.PI-offset/total*Math.PI;offset+=n;const end=Math.PI-offset/total*Math.PI;const middle=(start+end)/2;const color=party==='@swing'?'#a9afb7':partyColor(party,candidates);const name=party==='@swing'?'En juego':partyName(party,candidates);return <g key={party} data-party={party} data-seats={n}><path d={sectorPath(start,end)} fill={color} stroke="white" strokeWidth="2"><title>{name}: {n}{party==='@swing'?' en juego':' consolidados'}</title></path>{n>=5&&<text x={330+228*Math.cos(middle)} y={315-228*Math.sin(middle)} textAnchor="middle" dominantBaseline="middle" fill={textColor(color)} fontSize={n>=12?20:13} fontWeight="700">{n}</text>}</g>;})}<text x="330" y="281" textAnchor="middle" fill="#738493" fontSize="13">CONGRESO</text><text x="330" y="313" textAnchor="middle" fill="#16334b" fontSize="28" fontWeight="700">{total}</text></svg><div className="seat-legend sector-legend">{entries.map(([id,n])=><span key={id}><i style={{background:id==='@swing'?'#a9afb7':partyColor(id,candidates)}}/>{id==='@swing'?'En juego':partyName(id,candidates)} <strong>{n}</strong></span>)}</div></div>;
}
