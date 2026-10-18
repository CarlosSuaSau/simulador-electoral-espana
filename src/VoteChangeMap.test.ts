import {expect,it} from 'vitest';
import {changeColor,provincialChanges} from './VoteChangeMap';
import {defaultConfig} from './model/defaults';
import {historical,project,provinces} from './model/projection';
it('compara porcentajes válidos de las 52 provincias y conserva el cero oficial de Vox en Tenerife',()=>{
  const c=defaultConfig();const forecast=project(c);const rows=provincialChanges(forecast,c,'PSOE');
  expect(rows).toHaveLength(52);
  const p=provinces.find(p=>p.code==='35')!,r=rows.find(p=>p.code==='35')!;
  expect(r.previous).toBeCloseTo(100*historical['35'].PSOE/p.validVotes,10);
  expect(r.delta).toBeCloseTo(r.projected-r.previous,10);
  const vox=provincialChanges(forecast,c,'VOX').find(p=>p.code==='38')!;
  expect(vox.previous).toBe(0);expect(vox.delta).toBeGreaterThan(0);
  expect(changeColor(0)).toBe('#d1d5db');expect(changeColor(5)).not.toBe(changeColor(-5));
});
it('compara una coalición nueva con sus orígenes históricos sin imputar el trasvase actual al pasado',()=>{
  const c=defaultConfig(),forecast=project(c),p=provinces.find(p=>p.code==='35')!;
  const upc=provincialChanges(forecast,c,'UPC').find(p=>p.code==='35')!;
  expect(upc.previous).toBeCloseTo(100*((historical['35'].SUMAR??0)+(historical['35'].NC??0))/p.validVotes,10);
  const navarra=provincialChanges(forecast,c,'UPN_PP').find(p=>p.code==='31')!;
  expect(navarra.origins.sort()).toEqual(['PP','UPN']);
  expect(provincialChanges(forecast,c,'UPC').find(p=>p.code==='28')!.delta).toBe(0);
});
