import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import SeatDots,{hemicyclePositions,partyName} from '../SeatDots';
import {defaultConfig} from './defaults';
import {aggregate,project} from './projection';
import {migrateConfig} from './migration';
import {eligiblePolls} from './pollPolicy';

describe('hemiciclo y nombres nacionales',()=>{
  it('recorre ángulos de izquierda a derecha y distribuye cada bloque entre filas',()=>{
    const points=hemicyclePositions();expect(points).toHaveLength(350);
    expect(new Set(points.slice(0,9).map(p=>p.row)).size).toBe(9);
    expect(points.every((p,i)=>!i||points[i-1].angle>=p.angle)).toBe(true);
    const markup=renderToStaticMarkup(<SeatDots allocation={{PSOE:120,PP:130,VOX:60,ERC:10,PNV:10,SUMAR:20}} hemicycle/>);
    const ids=[...markup.matchAll(/data-party="([^"]+)"/g)].map(m=>m[1]);
    expect(ids).toHaveLength(350);expect(ids[0]).toBe('SUMAR');expect(ids.at(-1)).toBe('VOX');
    expect(ids.indexOf('PSOE')).toBeLessThan(ids.indexOf('ERC'));
    expect(ids.indexOf('ERC')).toBeLessThan(ids.indexOf('PP'));
  });
  it('agrupa marcas territoriales del PSOE sin perder la papeleta original',()=>{
    const raw='PARTIDO DOS SOCIALISTAS DE GALICIA-PSOE - PSdeG-PSOE';
    expect(partyName(raw)).toBe('PSOE');
    expect(partyName('PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) - PSC')).toBe('PSOE');
    const markup=renderToStaticMarkup(<SeatDots allocation={{[raw]:2,PSOE:3}}/>);
    expect(markup).not.toContain('PSdeG');expect(markup).toContain('PSOE: 5 escaños');
  });
});
describe('encuestas y acuerdos cerrados',()=>{
  it('excluye el CIS incluso si se introduce activado manualmente',()=>{
    const c=defaultConfig();const expected=aggregate(c);
    c.polls.push({...c.polls[0],id:'cis-importado',institute:'CIS',shares:{PP:1,PSOE:90},enabled:true});
    expect(aggregate(c)).toEqual(expected);
  });
  it('no duplica el peso del mismo instituto y admite metadatos desconocidos explícitos',()=>{
    const c=defaultConfig();const newer={...c.polls[0],id:'gad3-nueva',published:'2026-10-16',start:null,end:null,sample:null,shares:{PP:33}};
    c.polls.push(newer);const selected=eligiblePolls(c.polls,c.asOf);
    expect(selected.filter(p=>p.institute==='GAD3')).toEqual([newer]);
  });
  it('migra los escenarios anteriores sin reactivar CIS ni perder trasvases propios',()=>{
    const c=defaultConfig();delete c.dataRevision;delete c.successors;
    c.polls=[{...c.polls[0],id:'cis-2026-10',institute:'CIS',enabled:true}];
    c.routes=[{id:'propia',province:'35',origin:'NC',destination:'PC_CC',percent:30,uncertainty:4}];
    const migrated=migrateConfig(c);expect(migrated.polls).toHaveLength(8);expect(migrated.routes).toContainEqual(c.routes[0]);
    expect(migrated.candidates.find(c=>c.id==='UPC')?.status).toBe('closed');
  });
  it('respeta las papeletas sucesoras y permite variar su retención sin duplicar electores',()=>{
    const c=defaultConfig();c.routes=[];const a=project(c).provinces.find(p=>p.code==='35')!;
    expect(a.votes.SUMAR).toBe(0);expect(a.votes.PODEMOS).toBe(0);expect(a.votes.NC).toBe(0);expect(a.votes.CC).toBe(0);
    expect(a.votes.UPC).toBe(a.sourceVotes.SUMAR+a.sourceVotes.PODEMOS+a.sourceVotes.NC);
    c.routes=[{id:'r',province:'35',origin:'NC',destination:'PC_CC',percent:30,uncertainty:0}];
    const b=project(c).provinces.find(p=>p.code==='35')!;
    expect(b.votes.UPC).toBeLessThan(a.votes.UPC);expect(b.votes.PC_CC).toBeGreaterThan(a.votes.PC_CC);
    expect(Object.values(b.votes).reduce((x,y)=>x+y,0)).toBe(Object.values(a.votes).reduce((x,y)=>x+y,0));
  });
});
