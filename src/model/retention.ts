import type {Route} from './types';
import {closedSuccessors} from './coalitions';
// Experiment controls, not estimated voter transitions.
export function canaryExperiment(leakage:number,abstention:number):Route[]{
  return ['35','38'].flatMap(province=>[
    {id:`experiment-nc-cross-${province}`,province,origin:'NC',destination:'PC_CC',percent:leakage,uncertainty:10},
    ...['NC','CC','SUMAR','PODEMOS'].map(origin=>({id:`experiment-loss-${province}-${origin}`,province,origin,destination:'@abstention',percent:abstention,uncertainty:3})),
  ]);
}
export function defaultTransfers():Route[]{
  const routes:Route[]=[];
  for(const [province,mapping] of Object.entries(closedSuccessors()))for(const origin of Object.keys(mapping)){
    if(origin==='NC'&&['35','38'].includes(province))routes.push({id:`base-${province}-NC-cross`,province,origin,destination:'PC_CC',percent:40,uncertainty:10});
    else if(origin==='CC'&&['35','38'].includes(province))routes.push({id:`base-${province}-CC-loss`,province,origin,destination:'@abstention',percent:2,uncertainty:2});
    else routes.push({id:`base-${province}-${origin}-loss`,province,origin,destination:'@abstention',percent:origin==='PP'||origin==='UPN'?1:3,uncertainty:origin==='PP'||origin==='UPN'?1:3});
  }
  return routes;
}
