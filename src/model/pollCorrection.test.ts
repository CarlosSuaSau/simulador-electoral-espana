import {expect,it} from 'vitest';
import {defaultConfig} from './defaults';
import {actual2023,correctedShares,errorCatalog} from './pollCorrection';
import {aggregate,project,provinces} from './projection';
import {repaired2023,territorialProfiles} from './profiles';
import {historical} from './projection';
import {migrateConfig} from './migration';
it('calcula el error con el resultado definitivo y conserva las categorías publicadas',()=>{
  expect(actual2023.PSOE).toBeCloseTo(31.682155,5);expect(actual2023.PP).toBeCloseTo(33.055769,5);
  expect(errorCatalog.polls).toHaveLength(8);
  const c=defaultConfig();
  for(const poll of c.polls){
    const original=structuredClone(poll);const result=correctedShares(poll,true);
    expect(Object.keys(result)).toEqual(Object.keys(poll.shares));
    expect(Object.values(result).reduce((a,b)=>a+b,0)).toBeCloseTo(Object.values(poll.shares).reduce((a,b)=>a+b,0),10);
    expect(Object.values(result).every(n=>n>=0)).toBe(true);expect(poll).toEqual(original);
  }
});
it('aplica exactamente la mitad de los errores relativos entre partidos sin duplicar Sumar',()=>{
  const p=defaultConfig().polls[0];const r=errorCatalog.polls.find(r=>r.institute===p.institute)!;
  const corrected=correctedShares(p,true);
  const expected=.5*((actual2023.PSOE-r.shares.PSOE)-(actual2023.PP-r.shares.PP));
  expect((corrected.PSOE-corrected.PP)-(p.shares.PSOE-p.shares.PP)).toBeCloseTo(expected,10);
  const split={...p,shares:{PP:30,PSOE:27,VOX:18,SUMAR:6,PODEMOS:3}};
  const result=correctedShares(split,true);expect(result.SUMAR/result.PODEMOS).toBeCloseTo(2,10);
  expect(correctedShares({...p,institute:'Sin referencia'},true)).toEqual(p.shares);
});
it('la corrección cambia la proyección y se desactiva sin alterar las encuestas',()=>{
  const c=defaultConfig(),initial=structuredClone(c.polls);const base=aggregate(c);
  c.halfError2023=true;expect(aggregate(c).shares.PSOE).toBeGreaterThan(base.shares.PSOE);
  const r=project(c);expect(Object.values(r.allocation).reduce((s,n)=>s+n,0)).toBe(350);
  expect(r.fittingError).toBeLessThan(1);expect(c.polls).toEqual(initial);
  c.halfError2023=false;expect(aggregate(c)).toEqual(base);
});
it('repara solo la ausencia documentada y no modifica el histórico oficial',()=>{
  const before=structuredClone(historical);const valid=Object.fromEntries(provinces.map(p=>[p.code,p.validVotes]));
  const repaired=repaired2023(historical,valid);
  expect(repaired['38'].VOX).toBeGreaterThan(0);
  expect(Object.values(repaired['38']).reduce((s,n)=>s+n,0)).toBeCloseTo(Object.values(historical['38']).reduce((s,n)=>s+n,0),5);
  for(const p of provinces)if(p.code!=='38')expect(repaired[p.code]).toEqual(historical[p.code]);
  expect(historical).toEqual(before);
  const profiles=territorialProfiles(historical,valid,defaultConfig());
  expect(Object.keys(profiles).filter(code=>profiles[code].AA>0)).toHaveLength(8);
  expect(profiles['28'].AA).toBe(0);
});
it('migra los pesos iniciales defectuosos preservando los ensayos editados',()=>{
  const c=defaultConfig();c.dataRevision=4;c.profileWeights={'2023-07-23':70,'2019-11-10':20,'2019-04-28':10};
  expect(migrateConfig(c).profileWeights).toEqual(defaultConfig().profileWeights);
  c.profileWeights={'2023-07-23':90,'2019-11-10':10,'2019-04-28':0};
  expect(migrateConfig(c).profileWeights).toEqual(c.profileWeights);
});
