import raw from '../data/official-results-2023.json';
import registry from '../data/historical-families.json';
import regions from '../data/regions.json';
import {calculateDhondt} from '../lib/electoral';
import {seededRandom} from '../lib/monteCarlo';
import type {Config,Forecast,Poll,Province,Projection,Probabilities} from './types';
import {eligiblePolls,pollDate} from './pollPolicy';
import {territorialProfiles} from './profiles';
import {correctedShares} from './pollCorrection';

export const provinces = raw.provinces as unknown as Province[];
export const familyMapping:Record<string,string> = registry.mapping;
export const familyLabels:Record<string,string> = registry.labels;
export const regionCodes:Record<string,string> = regions;
export const historical: Record<string,Record<string,number>> = Object.fromEntries(provinces.map(p=>{
  const votes:Record<string,number>={};
  for(const [name,n] of Object.entries(p.votes)) votes[familyMapping[name]]=(votes[familyMapping[name]]??0)+n;
  return [p.code,votes];
}));
const finite=(n:number,min=0,max=100)=>Number.isFinite(n)&&n>=min&&n<=max;
const dateValid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s));
const safeKey=(s:string)=>typeof s==='string'&&/^[A-Za-z0-9_-]+$/.test(s)&&!['__proto__','constructor','prototype','OTHER'].includes(s);
export function validatePoll(p:Poll){
  if(!p||!safeKey(p.id)||!p.institute?.trim()||!p.publisher?.trim()||!/^https?:\/\//.test(p.source)||(p.start!==null&&!dateValid(p.start))||(p.end!==null&&!dateValid(p.end))||!dateValid(p.published)||(p.start&&p.end&&p.start>p.end)||(p.end&&p.end>p.published)||(p.sample!==null&&(!Number.isInteger(p.sample)||p.sample<1))||!finite(p.weight,0,100)||!['valid','candidates'].includes(p.denominator)||!p.shares||Object.keys(p.shares).length===0||Object.entries(p.shares).some(([k,v])=>!safeKey(k)||!finite(v))||Object.values(p.shares).reduce((a,b)=>a+b,0)>100.001)throw Error('Encuesta inválida: revisa fechas, muestra, fuente, identificadores y porcentajes.');
}
export function validateConfig(value:unknown):Config {
  const c=value as Config;
  if(!c||c.version!==2||typeof c.name!=='string'||!dateValid(c.asOf)||!Array.isArray(c.polls)||!Array.isArray(c.candidates)||!Array.isArray(c.routes)||!c.proxies||!c.territorial||!c.uncertainty)throw Error('Configuración 2026 incompatible (se requiere versión 2).');
  c.polls.forEach(validatePoll);
  if(new Set(c.polls.map(p=>p.id)).size!==c.polls.length)throw Error('Hay encuestas con identificador duplicado.');
  if(!finite(c.turnout,1,100)||!finite(c.blank,0,20)||!finite(c.invalid,0,20)||!finite(c.halfLife,1,3650))throw Error('Revisa participación, blancos, nulos y semivida.');
  const ids=new Set(Object.keys(familyLabels).concat(['PODEMOS','SALF']));
  for(const a of c.candidates){if(!safeKey(a.id)||ids.has(a.id)||!a.name?.trim()||!/^#[0-9a-f]{6}$/i.test(a.color)||!Array.isArray(a.organizations)||!a.organizations.every(x=>typeof x==='string')||!Array.isArray(a.territories)||a.territories.some(code=>!provinces.some(p=>p.code===code))||!dateValid(a.date)||!a.source?.trim()||!['hypothetical','announced','closed','registered','official'].includes(a.status))throw Error('Candidatura inválida o identificador repetido.');ids.add(a.id);}
  const sources=new Set(Object.keys(familyLabels).concat(['PODEMOS','SALF']));
  for(const [code,mapping] of Object.entries(c.successors??{}))for(const [origin,destination] of Object.entries(mapping)){
    if(!provinces.some(p=>p.code===code)||!sources.has(origin)||!ids.has(destination)||c.candidates.some(a=>a.id===destination&&!a.territories.includes(code)))throw Error('Papeleta sucesora incompatible con su territorio.');
  }
  for(const [k,v] of Object.entries(c.proxies))if(!sources.has(k)||!sources.has(v)||k===v)throw Error('Perfil territorial proxy inválido.');
  const sums:Record<string,number>={};
  for(const t of c.routes){
    if(!provinces.some(p=>p.code===t.province)||!sources.has(t.origin)||(!ids.has(t.destination)&&!['@blank','@null','@abstention'].includes(t.destination))||!finite(t.percent)||!finite(t.uncertainty,0,30)||t.origin===t.destination)throw Error('Trasvase territorial inválido.');
    const target=c.candidates.find(a=>a.id===t.destination);
    if(c.successors?.[t.province]?.[t.destination]&&c.successors[t.province][t.destination]!==t.destination)throw Error('El destino no tiene papeleta propia en esta provincia. Selecciona su coalición sucesora.');
    if(target&&!target.territories.includes(t.province))throw Error('La candidatura no concurre en el territorio del trasvase.');
    const key=t.province+':'+t.origin;sums[key]=(sums[key]??0)+t.percent;
  }
  if(Object.values(sums).some(n=>n>100+1e-8))throw Error('Los destinos de un origen superan el 100 %.');
  for(const [code,adjustments] of Object.entries(c.territorial))if(!provinces.some(p=>p.code===code)||Object.entries(adjustments).some(([key,n])=>!sources.has(key)||!finite(n,0.01,100)))throw Error('Multiplicador territorial inválido.');
  const u=c.uncertainty;
  if(c.halfError2023!==undefined&&typeof c.halfError2023!=='boolean')throw Error('Corrección de encuestas inválida.');
  for(const r of c.territorialReferences??[])if(!safeKey(r.id)||!provinces.some(p=>p.code===r.province)||!sources.has(r.party)||!finite(r.share,0.01,100)||!finite(r.nationalShare,0.01,100)||!finite(r.weight,0,1)||!['general-poll','regional-election'].includes(r.kind)||!/^https?:\/\//.test(r.source)||!dateValid(r.date)||r.date>c.asOf)throw Error('Referencia territorial inválida: revisa provincia, partido, porcentajes, fecha, peso y fuente.');
  if(c.profileWeights&&(Object.values(c.profileWeights).some(n=>!finite(n,0,100))||!Object.values(c.profileWeights).some(n=>n>0)))throw Error('Pesos históricos inválidos.');
  if(!Number.isInteger(u.seed)||!Number.isInteger(u.iterations)||u.iterations<50||u.iterations>5000||![u.national,u.regional,u.provincial,u.bloc,u.turnout].every(n=>finite(n,0,10)))throw Error('Parámetros de incertidumbre fuera de rango.');
  return c;
}
export function pollAverage(c:Config){
  const polls=eligiblePolls(c.polls,c.asOf).map(p=>({...p,shares:correctedShares(p,!!c.halfError2023)}));
  if(!polls.length)throw Error('Activa al menos una encuesta publicada antes de la fecha de corte.');
  const keys=[...new Set(polls.flatMap(p=>Object.keys(p.shares)))];
  // Missing items remain missing: each estimate only averages polls reporting that item.
  const weights=polls.map(p=>({id:p.id,weight:p.weight*2**(-Math.max(0,(Date.parse(c.asOf)-Date.parse(pollDate(p)))/86400000)/c.halfLife)}));
  const shares:Record<string,number>={};
  for(const key of keys){let sum=0,weight=0;polls.forEach((p,i)=>{if(key in p.shares){const factor=p.denominator==='candidates'?1-c.blank/100:1;sum+=p.shares[key]*factor*weights[i].weight;weight+=weights[i].weight;}});shares[key]=sum/weight;}
  return {shares,weights};
}
export function aggregate(c:Config){
  const result=pollAverage(c);
  if(Object.values(result.shares).reduce((a,b)=>a+b,0)+c.blank>100+1e-6)throw Error('La combinación de encuestas supera el 100 % incluyendo blancos. Revisa categorías, denominadores o selección.');
  return result;
}
export function roundConserving(values:Record<string,number>,total:number){
  const entries=Object.entries(values);const rounded=Object.fromEntries(entries.map(([k,v])=>[k,Math.floor(v)]));
  const missing=total-Object.values(rounded).reduce((a,b)=>a+b,0);
  const order=entries.map(([k,v])=>({k,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f||a.k.localeCompare(b.k));
  if(missing<0||missing>order.length)throw Error('No se pueden conservar los votos en el redondeo.');
  for(let i=0;i<missing;i++)rounded[order[i].k]++;
  return rounded;
}
type Noise={random:()=>number; normal:()=>number};
function applyRoutes(p:Province,source:Record<string,number>,blank:number,invalid:number,abstention:number,c:Config,noise?:Noise){
  const totals:Record<string,number>={...Object.fromEntries(Object.keys(source).map(k=>[k,0])),'@blank':blank,'@null':invalid,'@abstention':abstention};
  c.candidates.filter(a=>a.territories.includes(p.code)).forEach(a=>{totals[a.id]=0;});
  for(const [origin,count] of Object.entries(source)){
    const routes=c.routes.filter(t=>t.province===p.code&&t.origin===origin);
    const explicit=routes.map(t=>({destination:t.destination,share:t.percent}));
    const remain=100-explicit.reduce((a,b)=>a+b.share,0);
    const shares=[...explicit,{destination:c.successors?.[p.code]?.[origin]??origin,share:Math.max(0,remain)}];
    // Logistic perturbation preserves the simplex; exact zero routes stay zero.
    if(noise)shares.forEach((r,i)=>{const sd=routes[i]?.uncertainty??0;r.share=r.share>0?r.share*Math.exp(noise.normal()*sd/Math.max(r.share,1)):0;});
    const denominator=shares.reduce((a,b)=>a+b.share,0);
    const weights:Record<string,number>={};shares.forEach(t=>{weights[t.destination]=(weights[t.destination]??0)+count*t.share/denominator;});
    const rounded=roundConserving(weights,count);for(const [k,n] of Object.entries(rounded))totals[k]=(totals[k]??0)+n;
  }
  return totals;
}
export function project(c:Config,noise?:Noise):Forecast {
  validateConfig(c);
  const poll=aggregate(c);const measured=poll.shares;
  const groupKeys=[...new Set(provinces.flatMap(p=>Object.keys(historical[p.code])).concat(Object.keys(measured)))];
  const nationalHistorical:Record<string,number>={};
  for(const p of provinces)for(const [k,n] of Object.entries(historical[p.code]))nationalHistorical[k]=(nationalHistorical[k]??0)+n;
  for(const key of Object.keys(measured))if(!nationalHistorical[key]&&!c.proxies[key])throw Error(`Falta un perfil territorial para ${key}. Configura un proxy explícito.`);
  const sourceVotes:Record<string,number>[]=[];
  const regionalNoise:Record<string,Record<string,number>>={};
  const nationalNoise:Record<string,number>={};
  const bloc=noise?noise.normal()*c.uncertainty.bloc:0;
  for(const key of groupKeys)nationalNoise[key]=noise?noise.normal()*c.uncertainty.national:0;
  const rowTotals=provinces.map(p=>{
    const turnout=Math.max(0.01,Math.min(100,c.turnout+(noise?noise.normal()*c.uncertainty.turnout:0)));
    const participating=Math.round(p.census*turnout/100);const invalid=Math.round(participating*c.invalid/100);
    return {participating,invalid,valid:participating-invalid};
  });
  const totalValid=rowTotals.reduce((a,r)=>a+r.valid,0);
  const blankTotal=totalValid*c.blank/100;
  const targets:Record<string,number>={};
  const unmeasured=groupKeys.filter(k=>!(k in measured));
  const unmeasuredBase=unmeasured.reduce((a,k)=>a+(nationalHistorical[k]??0),0);
  const residual=100-c.blank-Object.values(measured).reduce((a,b)=>a+b,0);
  for(const key of groupKeys){
    const share=key in measured?measured[key]:residual*(nationalHistorical[key]??0)/unmeasuredBase;
    const blocSign=['PP','VOX','SALF'].includes(key)?1:['PSOE','SUMAR','PODEMOS'].includes(key)?-1:0;
    // Unreported parties have no measured national error: keep their residual
    // shares fixed rather than invent independent national polls for tiny lists.
    targets[key]=Math.max(0,share)*(key in measured?Math.exp((nationalNoise[key]+bloc*blocSign)*Math.sqrt(share/25)/Math.max(share,1)):1);
  }
  const measuredSum=Object.keys(measured).reduce((a,key)=>a+targets[key],0);
  const measuredBudget=100-c.blank-residual;
  for(const key of groupKeys)targets[key]=(key in measured?targets[key]/measuredSum*measuredBudget:targets[key])*totalValid/100;
  const profiles=territorialProfiles(historical,Object.fromEntries(provinces.map(p=>[p.code,p.validVotes])),c);
  const matrix=provinces.map(p=>{
    const region=regionCodes[p.code];regionalNoise[region]??={};
    return groupKeys.map(key=>{
      const profile=c.proxies[key]??key;
      let base=key==='AA'&&region!=='01'?0:profiles[p.code][profile]??0;
      for(const r of c.territorialReferences??[]){
        if(r.province!==p.code||r.party!==key)continue;
        // Regional elections have a deliberately reduced, explicit influence.
        const weight=r.weight*(r.kind==='regional-election'?0.2:1);
        const reference=r.share/r.nationalShare*p.validVotes;
        base=base>0?Math.exp((1-weight)*Math.log(base)+weight*Math.log(reference)):reference*weight;
      }
      regionalNoise[region][key]??=noise?noise.normal()*c.uncertainty.regional:0;
      const historicShare=base/p.validVotes*100;
      const adjustment=(regionalNoise[region][key]+(noise?noise.normal()*c.uncertainty.provincial:0))/Math.max(historicShare,1);
      return base*(c.territorial[p.code]?.[key]??1)*Math.exp(adjustment);
    });
  });
  let error=Infinity;
  for(let iteration=0;iteration<400;iteration++){
    groupKeys.forEach((key,j)=>{
      const column=matrix.reduce((a,row)=>a+row[j],0);
      if(column===0&&targets[key]>0.001)throw Error(`No hay soporte provincial para ${key}.`);
      const scale=column?targets[key]/column:0;matrix.forEach(row=>{row[j]*=scale;});
    });
    matrix.forEach((row,i)=>{const sum=row.reduce((a,b)=>a+b,0);const target=rowTotals[i].valid*(1-c.blank/100);if(!sum&&target)throw Error('Provincia sin soporte de candidaturas.');const scale=target/sum;row.forEach((_,j)=>{row[j]*=scale;});});
    error=Math.max(...groupKeys.map((key,j)=>Math.abs(matrix.reduce((a,row)=>a+row[j],0)-targets[key])));
    if(error<0.05)break;
  }
  if(error>1){const worst=groupKeys.map((key,j)=>({key,error:Math.abs(matrix.reduce((a,row)=>a+row[j],0)-targets[key])})).sort((a,b)=>b.error-a.error)[0];throw Error(`El ajuste provincial no converge (${worst.key}: ${Math.round(worst.error)} votos). Revisa porcentajes, soporte territorial y multiplicadores.`);}
  const nationalActual:Record<string,number>={};const allocation:Record<string,number>={};
  const results:Projection[]=provinces.map((p,i)=>{
    const blank=Math.round(rowTotals[i].valid*c.blank/100);
    const source=roundConserving(Object.fromEntries(groupKeys.map((key,j)=>[key,matrix[i][j]])),rowTotals[i].valid-blank);
    sourceVotes.push(source);for(const [k,n] of Object.entries(source))nationalActual[k]=(nationalActual[k]??0)+n;
    const totals=applyRoutes(p,source,blank,rowTotals[i].invalid,p.census-rowTotals[i].participating,c,noise);
    const votes=Object.fromEntries(Object.entries(totals).filter(([k])=>!k.startsWith('@')));
    const drawOrder=noise?Object.keys(votes).map(k=>({k,r:noise.random()})).sort((a,b)=>a.r-b.r).map(x=>x.k):[];
    const result=calculateDhondt(votes,p.seats,3,totals['@blank'],drawOrder);
    if(Object.values(result.allocation).reduce((sum,n)=>sum+n,0)!==p.seats)throw Error(`No se pueden adjudicar todos los escaños en ${p.name}: ninguna candidatura elegible. Revisa abstención y blancos.`);
    for(const [k,n] of Object.entries(result.allocation))allocation[k]=(allocation[k]??0)+n;
    return {code:p.code,seats:p.seats,votes,sourceVotes:source,blank:totals['@blank'],invalid:totals['@null'],abstention:totals['@abstention'],valid:Object.values(votes).reduce((a,b)=>a+b,totals['@blank']),allocation:result.allocation,last:result.lastSeatCandidate,next:result.contenders[0]??null,tie:result.unresolvedTies.length>0,awarded:result.quotientTable.slice(0,p.seats).map(q=>q.candidate)};
  });
  return {provinces:results,allocation,nationalTargets:targets,nationalActual,fittingError:error,pollWeights:poll.weights};
}
export function probabilitySimulation(c:Config,onProgress?:(n:number)=>void,sampleConfig?:(c:Config,random:()=>number,normal:()=>number)=>Config):Probabilities {
  if(!c.uncertainty.accepted)throw Error('Confirma los supuestos exploratorios antes de simular.');
  validateConfig(c);const random=seededRandom(c.uncertainty.seed);
  const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-12)))*Math.cos(2*Math.PI*random());
  const output:Probabilities={seed:c.uncertainty.seed,iterations:c.uncertainty.iterations,config:structuredClone(c),national:{},provincial:{},order:{},unresolvedDraws:0};
  const add=(hist:Record<number,number>,n:number)=>{hist[n]=(hist[n]??0)+1;};
  if(sampleConfig){output.jointProvincial={};output.jointOrder={};}
  for(let i=0;i<c.uncertainty.iterations;i++){
    const forecast=project(sampleConfig?sampleConfig(c,random,normal):c,{random,normal});
    for(const [k,n] of Object.entries(forecast.allocation)){output.national[k]??={};add(output.national[k],n);}
    for(const p of forecast.provinces){
      if(p.tie)output.unresolvedDraws++;
      if(output.jointProvincial){const key=JSON.stringify(Object.fromEntries(Object.entries(p.allocation).filter(([,n])=>n>0).sort(([a],[b])=>a.localeCompare(b))));const hist=output.jointProvincial[p.code]??={};hist[key]=(hist[key]??0)+1;if(output.jointOrder){const orders=output.jointOrder[p.code]??={};orders[key]??=[...p.awarded];}}
      output.provincial[p.code]??={};output.order[p.code]??={};
      for(const [k,n] of Object.entries(p.allocation)){output.provincial[p.code][k]??={};add(output.provincial[p.code][k],n);}
      p.awarded.forEach((k,j)=>{output.order[p.code][k]??={};add(output.order[p.code][k],j+1);});
    }
    if(i%10===0)onProgress?.(i+1);
  }
  return output;
}
