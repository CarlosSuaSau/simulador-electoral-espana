import {expect,it} from 'vitest';
import {defaultConfig} from './defaults';
import {historical,project,provinces} from './projection';
import {migrateConfig} from './migration';
it('recupera Vox en Tenerife con ambas generales sin alterar el archivo de 2023',()=>{
  expect(historical['38'].VOX??0).toBe(0);
  const c=defaultConfig();const blended=project(c);
  expect(blended.provinces.find(p=>p.code==='38')!.votes.VOX).toBeGreaterThan(0);
  c.profileWeights={'2023-07-23':100,'2019-04-28':0,'2019-11-10':0};
  expect(project(c).provinces.find(p=>p.code==='38')!.votes.VOX).toBeGreaterThan(0);
  expect(blended.fittingError).toBeLessThan(1);
});
it('usa una papeleta UPN–PP en Navarra y conserva todos los electores',()=>{
  const c=defaultConfig();c.polls=c.polls.map(p=>({...p,ballotShares:undefined}));const r=project(c).provinces.find(p=>p.code==='31')!;
  expect(Math.abs(r.votes.UPN_PP-.99*(r.sourceVotes.UPN+r.sourceVotes.PP))).toBeLessThan(2);
  expect(r.votes.PP).toBe(0);expect(r.votes.UPN).toBe(0);
  expect(Object.values(r.votes).reduce((s,n)=>s+n,r.blank+r.invalid+r.abstention)).toBe(provinces.find(p=>p.code==='31')!.census);
});
it('los experimentos canarios conservan electores y permiten pérdidas de retención',()=>{
  const r=project(defaultConfig()).provinces.find(p=>p.code==='35')!;
  expect(r.votes.PC_CC).toBeGreaterThan(r.sourceVotes.CC*.9);
  expect(r.votes.UPC).toBeLessThan(r.sourceVotes.NC+r.sourceVotes.SUMAR+r.sourceVotes.PODEMOS);
  expect(r.abstention).toBeGreaterThan(0);
  const c=defaultConfig();c.dataRevision=3;c.routes=[{id:'propia',province:'35',origin:'NC',destination:'PC_CC',percent:60,uncertainty:2}];
  const migrated=migrateConfig(c);
  expect(migrated.routes.filter(r=>r.province==='35'&&r.origin==='NC')).toEqual(c.routes);
});
it('las referencias provinciales cambian la geografía manteniendo el objetivo nacional',()=>{
  const c=defaultConfig();const base=project(c);
  c.territorialReferences=[{id:'ejemplo',province:'38',party:'VOX',share:30,nationalShare:15,weight:.5,kind:'general-poll',source:'https://example.org/ficha',date:'2026-10-10'}];
  const poll=project(c);expect(poll.provinces.find(p=>p.code==='38')!.votes.VOX).toBeGreaterThan(base.provinces.find(p=>p.code==='38')!.votes.VOX);
  expect(poll.nationalTargets).toEqual(base.nationalTargets);expect(poll.fittingError).toBeLessThan(1);
  c.territorialReferences[0].kind='regional-election';
  expect(project(c).provinces.find(p=>p.code==='38')!.votes.VOX).toBeLessThan(poll.provinces.find(p=>p.code==='38')!.votes.VOX);
  c.territorialReferences[0].share=-1;expect(()=>project(c)).toThrow(/Referencia territorial/);
});
