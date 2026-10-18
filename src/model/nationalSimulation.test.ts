import {expect,it} from 'vitest';
import {defaultConfig} from './defaults';
import {nationalInput,nationalSimulation,provinceConfidence,classifySeat,wilsonLower,sampledAggregate,provinceRaces} from './nationalSimulation';
import {provinces} from './projection';
import {transferDistribution,editTransfer} from '../TransferMatrix';
import {migrateConfig} from './migration';
import {canaryExperiment} from './retention';
it('inicia NC en 60/40, Navarra en 99/1 y partidos sin cambio en 100/0',()=>{
  const c=defaultConfig();
  expect(transferDistribution(c,'35','NC')).toEqual({PC_CC:40,UPC:60});
  expect(transferDistribution(c,'31','UPN')).toEqual({'@abstention':1,UPN_PP:99});
  expect(transferDistribution(c,'31','PP')).toEqual({'@abstention':1,UPN_PP:99});
  expect(transferDistribution(c,'28','PSOE')).toEqual({PSOE:100});
  const edited=editTransfer(c,'28','PSOE','PP',20);
  expect(transferDistribution(edited,'28','PSOE')).toEqual({PP:20,PSOE:80});
  const retained=editTransfer(edited,'28','PSOE','PSOE',90);
  expect(transferDistribution(retained,'28','PSOE')).toEqual({PP:10,PSOE:90});
  expect(transferDistribution(c,'28','PSOE')).toEqual({PSOE:100});
});
it('migra el ejemplo anterior, preservando rutas modificadas',()=>{
  const c=defaultConfig();c.dataRevision=5;c.routes=canaryExperiment(25,5);
  expect(transferDistribution(migrateConfig(c),'35','NC')).toEqual({PC_CC:40,UPC:60});
  c.routes[0].percent=45;
  expect(migrateConfig(c).routes).toContainEqual(c.routes[0]);
});
it('no confunde 100 % de una muestra pequeña con consolidación al 99 %',()=>{
  expect(classifySeat(1,50)).toBe('likely');expect(wilsonLower(50,50)).toBeLessThan(.99);
  expect(classifySeat(1,1000)).toBe('solid');expect(classifySeat(.95,1000)).toBe('likely');expect(classifySeat(.6,1000)).toBe('swing');
});
it('normaliza categorías parcialmente observadas sin consumir el residuo ni superar el 100 %',()=>{
  const c=defaultConfig();const p=c.polls[0];c.polls=[{...p,id:'a',institute:'a',weight:95,shares:{PP:70,PSOE:10}},{...p,id:'b',institute:'b',weight:5,shares:{PP:10,PSOE:25,VOX:30,SUMAR:10}}];
  const shares=sampledAggregate(c,97.5);expect(Object.values(shares).reduce((s,n)=>s+n,0)).toBeCloseTo(97.5,10);
  expect(Object.values(shares).every(n=>n>=0&&n<=100)).toBe(true);expect(shares.VOX).toBeGreaterThan(0);
});
it('ignora el botón de corrección, conserva 350 plazas y simula todas las provincias con error histórico',()=>{
  const c=defaultConfig(),options={seed:20261018,iterations:50};
  const a=nationalSimulation(c,options);c.halfError2023=true;const b=nationalSimulation(c,options);
  expect(a).toEqual(b);expect(a.config.halfError2023).toBe(false);
  expect(Object.values(a.national).reduce((s,h)=>s+Object.entries(h).reduce((n,[k,count])=>n+Number(k)*count,0),0)).toBe(350*50);
  const rows=provinces.map(p=>provinceConfidence(a,p.code));
  expect(rows.reduce((s,p)=>s+p.solid+p.likely+p.swing,0)).toBe(350);
  expect(rows.some(p=>p.swing>1)).toBe(true);
  for(const p of provinces){const races=provinceRaces(a,p.code);expect(races.stable+races.swing).toBe(p.seats);expect(Object.values(races.consolidated).reduce((s,n)=>s+n,0)).toBe(races.stable);expect(Object.values(races.opportunities).every(n=>n>=0&&n<=races.swing)).toBe(true);races.seats.forEach((s,i)=>{expect(s.rank).toBe(i+1);expect(s.contenders.reduce((sum,c)=>sum+c.probability,0)).toBeCloseTo(1,10);});}

  for(const p of provinces){expect(provinceConfidence(a,p.code).seats).toHaveLength(p.seats);expect(Object.values(a.jointProvincial![p.code]).reduce((s,n)=>s+n,0)).toBe(50);}
  c.uncertainty.national=0;expect(nationalInput(c,options).uncertainty.national).toBe(1.5);
},60000);
