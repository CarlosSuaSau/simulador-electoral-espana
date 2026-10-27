import {it,expect} from 'vitest';
import {defaultConfig} from './defaults';
import {project,validateConfig,provinces} from './projection';
import {ballotAverage} from './ballotPolls';
import {migrateConfig} from './migration';
import {eligiblePolls} from './pollPolicy';
it('sustituye cinco institutos, mantiene ocho observaciones y migra sin perder preferencias ni trasvases',()=>{
 const c=defaultConfig();expect(c.asOf).toBe('2026-10-27');expect(eligiblePolls(c.polls,c.asOf)).toHaveLength(8);
 expect(c.polls.find(p=>p.institute==='Sigma Dos')?.published).toBe('2026-10-26');
 c.dataRevision=6;c.asOf='2026-10-17';c.polls[1].enabled=false;c.polls[1].weight=2;
 c.routes=[{id:'personal',province:'35',origin:'NC',destination:'PC_CC',percent:45,uncertainty:4}];
 const migrated=validateConfig(migrateConfig(c));expect(migrated.asOf).toBe('2026-10-27');expect(migrated.polls[1].enabled).toBe(false);expect(migrated.polls[1].weight).toBe(2);expect(migrated.routes).toEqual(c.routes);
});
it('usa el dato de las coaliciones una sola vez, respeta su territorio y conserva electores y 350 escaños',()=>{
 const c=defaultConfig();const forecast=project(c),targets=ballotAverage(c);
 const valid=forecast.provinces.reduce((s,p)=>s+p.valid,0);
 for(const [key,value] of Object.entries(targets))expect(100*forecast.provinces.reduce((s,p)=>s+(p.votes[key]??0),0)/valid).toBeCloseTo(value,3);
 expect(Object.values(forecast.allocation).reduce((s,n)=>s+n,0)).toBe(350);
 for(const p of forecast.provinces){expect(Object.values(p.votes).reduce((s,n)=>s+n,p.blank+p.invalid+p.abstention)).toBe(provinces.find(q=>q.code===p.code)!.census);if(!['3','12','46'].includes(p.code))expect(p.votes.COMPROMIS??0).toBe(0);}
 const prior=project({...c,polls:c.polls.map(p=>({...p,ballotShares:undefined}))});
 for(const code of ['35','38'])expect(forecast.provinces.find(p=>p.code===code)!.votes).toEqual(prior.provinces.find(p=>p.code===code)!.votes);
});
it('admite encuestas mixtas, ausencia de desglose y activar solo una encuesta ya con coaliciones',()=>{
 const c=defaultConfig();c.polls=c.polls.filter(p=>p.institute==='Sigma Dos');const f=project(c);const valid=f.provinces.reduce((s,p)=>s+p.valid,0);
 expect(f.provinces.reduce((s,p)=>s+(p.votes.FA??0),0)/valid*100).toBeCloseTo(7.4,3);
 expect(f.provinces.reduce((s,p)=>s+(p.votes.COMPROMIS??0),0)/valid*100).toBeCloseTo(.8,3);
 expect(c.polls[0].shares.SUMAR).toBeUndefined();
});
