/** Infrastructure only: the caller supplies and documents the joint model.
 * Shared random stream permits national, territorial and correlated draws.
 * No default electoral distribution or calibrated probabilities are assumed.
 */
import {calculateDhondt} from './electoral';
export function seededRandom(seed:number){let state=seed>>>0;return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export type ModelDraw = {code:string;votes:Record<string,number>;blank:number;seats:number;drawOrder?:string[]};
export function monteCarlo(config:{seed:number;iterations:number;assumptions:string;draw:(random:()=>number,iteration:number)=>ModelDraw[]}) {
 if(!Number.isInteger(config.seed)||!Number.isInteger(config.iterations)||config.iterations<1||config.iterations>100000||!config.assumptions.trim())throw Error('Indica semilla, iteraciones y supuestos explícitos.');
 const random=seededRandom(config.seed);const frequencies:Record<string,Record<string,Record<number,number>>>={};
 for(let i=0;i<config.iterations;i++)for(const p of config.draw(random,i)){
  const result=calculateDhondt(p.votes,p.seats,3,p.blank,p.drawOrder);
  if(result.unresolvedTies.length)throw Error('El modelo debe resolver y registrar el sorteo de los empates.');
  frequencies[p.code]??={};
  for(const [candidate,seats] of Object.entries(result.allocation)){frequencies[p.code][candidate]??={};const histogram=frequencies[p.code][candidate];histogram[seats]=(histogram[seats]??0)+1;}
 }
 return {kind:'exploratory' as const,seed:config.seed,iterations:config.iterations,assumptions:config.assumptions,frequencies};
}
