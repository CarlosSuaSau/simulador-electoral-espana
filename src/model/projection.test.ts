import {describe,it,expect} from 'vitest';
import {defaultConfig} from './defaults';
import {aggregate,historical,project,probabilitySimulation,provinces,validateConfig} from './projection';

describe('proyección nacional de encuestas',()=>{
  it('ajusta los porcentajes nacionales y conserva electores en las 52 provincias',()=>{
    const c=defaultConfig();const result=project(c);
    expect(result.provinces).toHaveLength(52);
    expect(Object.values(result.allocation).reduce((a,b)=>a+b,0)).toBe(350);
    expect(result.fittingError).toBeLessThan(1);
    for(const key of Object.keys(result.nationalTargets))expect(Math.abs(result.nationalActual[key]-result.nationalTargets[key])).toBeLessThan(53);
    for(const p of result.provinces){
      const census=provinces.find(x=>x.code===p.code)!.census;
      expect(Object.values(p.votes).reduce((a,b)=>a+b,p.blank+p.invalid+p.abstention)).toBe(census);
      expect(Object.values(p.allocation).reduce((a,b)=>a+b,0)).toBe(p.seats);
      if(!['35','38'].includes(p.code))expect(p.votes.UPC??0).toBe(0);
      expect(Object.values(p.votes).every(Number.isInteger)).toBe(true);
    }
  });
  it('usa el soporte territorial y no presenta otros como papeleta',()=>{
    const r=project(defaultConfig());
    expect(r.provinces.find(p=>p.code==='28')!.votes.NC).toBe(0);
    expect(r.provinces.find(p=>p.code==='28')!.votes.CC).toBe(0);
    expect(r.provinces.every(p=>!('OTHER' in p.votes))).toBe(true);
  });
  it('separa las nuevas estimaciones Sumar/Podemos sin duplicar el voto histórico',()=>{
    const c=defaultConfig();c.routes=[];const a=project(c);const before=a.provinces.find(p=>p.code==='35')!;
    c.routes=[{id:'nc',province:'35',origin:'NC',destination:'UPC',percent:65,uncertainty:0},{id:'sumar',province:'35',origin:'SUMAR',destination:'UPC',percent:80,uncertainty:0},{id:'podemos',province:'35',origin:'PODEMOS',destination:'UPC',percent:100,uncertainty:0}];
    const after=project(c).provinces.find(p=>p.code==='35')!;
    expect(after.votes.UPC).toBeGreaterThan(0);
    expect(after.votes.PODEMOS).toBe(0);
    expect(Object.values(after.votes).reduce((a,b)=>a+b,0)).toBe(Object.values(before.votes).reduce((a,b)=>a+b,0));
    expect(after.sourceVotes).toEqual(before.sourceVotes);
    expect(historical['35'].PODEMOS).toBeUndefined();
  });
  it('rechaza sobreasignaciones, territorios inválidos y encuestas sin geografía explícita',()=>{
    const c=defaultConfig();c.routes=[{id:'1',province:'35',origin:'SUMAR',destination:'UPC',percent:70,uncertainty:0},{id:'2',province:'35',origin:'SUMAR',destination:'DRAGO',percent:40,uncertainty:0}];expect(()=>project(c)).toThrow(/100/);
    c.routes=[{id:'3',province:'28',origin:'SUMAR',destination:'UPC',percent:40,uncertainty:0}];expect(()=>project(c)).toThrow(/territorio/);
    c.routes=[];c.polls[0].shares.NEW=1;expect(()=>project(c)).toThrow(/perfil territorial/);
  });
  it('respeta fechas y no interpreta categorías ausentes como cero',()=>{
    const c=defaultConfig();c.polls=c.polls.slice(0,1);const p=structuredClone(c.polls[0]);p.id='otra';p.institute='Otro instituto';p.shares={PP:32};c.polls.push(p);
    expect(aggregate(c).shares.PP).toBeCloseTo(31.7);
    expect(aggregate(c).shares.PSOE).toBeCloseTo(26.4);
    c.asOf='2026-01-01';expect(()=>aggregate(c)).toThrow(/Activa/);
  });
  it('no confunde porcentajes sobre candidaturas con votos válidos',()=>{
    const c=defaultConfig();c.polls=c.polls.slice(0,1);c.polls[0].denominator='candidates';expect(aggregate(c).shares.PP).toBeCloseTo(31.4*(1-c.blank/100));
  });
  it('valida importaciones versionadas',()=>{
    expect(validateConfig(JSON.parse(JSON.stringify(defaultConfig())))).toEqual(defaultConfig());
    expect(()=>validateConfig({version:1})).toThrow();
  });
  it('no publica un Congreso incompleto cuando se elimina todo el voto de una provincia',()=>{
    const c=defaultConfig();c.routes=Object.keys(historical['35']).concat(['PODEMOS','SALF']).map((origin,i)=>({id:String(i),province:'35',origin,destination:'@abstention',percent:100,uncertainty:0}));
    expect(()=>project(c)).toThrow(/ninguna candidatura elegible/);
  });
});
describe('probabilidades condicionadas',()=>{
  it('exige aceptación explícita',()=>expect(()=>probabilitySimulation(defaultConfig())).toThrow(/Confirma/));
  it('reproduce el modelo con semilla y conserva las frecuencias por provincia y puesto',()=>{
    const c=defaultConfig();c.uncertainty={seed:42,iterations:50,national:1,regional:.3,provincial:.3,bloc:.2,turnout:.5,accepted:true};
    c.routes=[{id:'s',province:'35',origin:'SUMAR',destination:'UPC',percent:70,uncertainty:5}];
    const a=probabilitySimulation(c);const b=probabilitySimulation(c);expect(a).toEqual(b);
    for(const p of provinces){
      for(const hist of Object.values(a.provincial[p.code]))expect(Object.values(hist).reduce((x,y)=>x+y,0)).toBe(50);
      for(let seat=1;seat<=p.seats;seat++)expect(Object.values(a.order[p.code]).reduce((sum,hist)=>sum+(hist[seat]??0),0)).toBe(50);
    }
    for(const hist of Object.values(a.national))expect(Object.values(hist).reduce((x,y)=>x+y,0)).toBe(50);
  },60000);
  it('con error cero todas las elecciones son iguales',()=>{
    const c=defaultConfig();c.uncertainty={seed:1,iterations:50,national:0,regional:0,provincial:0,bloc:0,turnout:0,accepted:true};const r=probabilitySimulation(c);
    for(const hist of Object.values(r.provincial['35'])){expect(Object.keys(hist)).toHaveLength(1);expect(Object.values(hist)).toEqual([50]);}
  },60000);
});
