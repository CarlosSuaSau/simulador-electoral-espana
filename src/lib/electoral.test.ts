import {describe,it,expect} from 'vitest';
import official from '../data/official-results-2023.json';
import {calculateDhondt,seatDistance} from './electoral';
import {Scenario,simulate} from './scenario';
describe('validación histórica',()=>{
 it('contiene 52 provincias y 350 escaños',()=>{expect(official.provinces).toHaveLength(52);expect(official.provinces.reduce((s,p)=>s+p.seats,0)).toBe(350);});
 for(const p of official.provinces)it(`reproduce todos los escaños oficiales: ${p.name}`,()=>{
  const r=calculateDhondt(p.votes,p.seats,3,p.blankVotes);
  expect(r.allocation).toEqual(p.seatsByCandidate);
  expect(r.unresolvedTies).toEqual([]);
  expect(Object.values(p.votes).reduce((a,b)=>a+b,p.blankVotes)).toBe(p.validVotes);
  expect(p.validVotes+p.nullVotes).toBe(p.turnout);
 });
});
describe('reglas y márgenes',()=>{
 it('incluye blancos en la barrera',()=>{expect(calculateDhondt({A:970,B:30},5,3,100).allocation.B).toBe(0);});
 it('desempata cocientes por mayor total de votos',()=>{expect(calculateDhondt({A:100,B:50},2).allocation).toEqual({A:2,B:0});});
 it('exige sorteo en igualdad de votos y alterna',()=>{expect(calculateDhondt({A:100,B:100},3).unresolvedTies).toContain('A');expect(calculateDhondt({A:100,B:100},3,3,0,['A','B']).allocation).toEqual({A:1,B:2});});
 it('rechaza votos negativos y fraccionarios',()=>{expect(()=>calculateDhondt({A:-1},1)).toThrow();expect(()=>calculateDhondt({A:1.5},1)).toThrow();});
 it('resuelve circunscripción uninominal sin barrera',()=>{expect(calculateDhondt({A:2,B:1},1,3,1000).allocation.A).toBe(1);});
 it('distingue adición, pérdida y transferencia, sin decidir sorteos',()=>{expect(seatDistance({A:100,B:80},1,0,'B','additional')).toBe(21);expect(seatDistance({A:100,B:80},1,0,'B','transfer','A')).toBe(11);expect(seatDistance({A:100,B:80},1,0,'A','loss')).toBe(21);});
});
describe('matriz de transferencias',()=>{
 const s:Scenario={version:1,name:'prueba',province:'35',transfers:[],candidates:['UPC'],mobilization:0,newcomers:0,destination:'UPC'};
 it('identidad conserva todos los resultados',()=>{const p=official.provinces.find(p=>p.code==='35')!;expect(simulate(p.votes,p.blankVotes,p.nullVotes,p.census-p.turnout,s).votes).toEqual({...p.votes,UPC:0});});
 it('conserva enteros con varios destinos y restos',()=>{const r=simulate({A:7,B:0},2,1,10,{...s,transfers:[{origin:'A',destination:'UPC',percent:33.3},{origin:'A',destination:'B',percent:33.3}]});expect(Object.values(r.votes).reduce((a,b)=>a+b,r.blank+r.invalid+r.abstention)).toBe(20);expect(Object.values(r.votes).every(Number.isInteger)).toBe(true);});
 it('rechaza duplicación de electorado',()=>expect(()=>simulate({A:10},0,0,0,{...s,transfers:[{origin:'A',destination:'UPC',percent:60},{origin:'A',destination:'UPC',percent:60}]})).toThrow());
 it('controla movilización y censo nuevo',()=>{expect(()=>simulate({A:1},0,0,2,{...s,mobilization:3})).toThrow();const r=simulate({A:1},0,0,2,{...s,mobilization:2,newcomers:3});expect(r.votes.UPC).toBe(5);expect(r.abstention).toBe(0);});
});
