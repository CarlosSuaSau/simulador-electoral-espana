import {defaultConfig} from './defaults';
import {excludedPoll} from './pollPolicy';
import type {Config} from './types';
export function migrateConfig(value:unknown):Config {
  const c=structuredClone(value) as Config;
  if(!c||c.version!==2||!Array.isArray(c.polls)||!Array.isArray(c.candidates)||!Array.isArray(c.routes))throw Error('Escenario incompatible.');
  c.polls=c.polls.filter(p=>!excludedPoll(p));
  if((c.dataRevision??0)<3){
    const base=defaultConfig();
    const custom=c.polls.filter(p=>!base.polls.some(b=>b.id===p.id)||p.verification==='user');
    c.polls=[...base.polls.filter(p=>!custom.some(b=>b.id===p.id)),...custom];
    c.candidates=[...base.candidates,...c.candidates.filter(a=>!base.candidates.some(b=>b.id===a.id))];
    c.successors=base.successors;c.dataRevision=3;
    c.routes=c.routes.map(t=>({...t,destination:c.successors?.[t.province]?.[t.destination]??t.destination}));
  }
  if((c.dataRevision??0)<4){
    const base=defaultConfig();
    c.profileWeights??=base.profileWeights;
    for(const candidate of base.candidates)if(!c.candidates.some(a=>a.id===candidate.id))c.candidates.push(candidate);
    c.successors={...c.successors,'31':{...c.successors?.['31'],PP:'UPN_PP',UPN:'UPN_PP'}};
    c.routes=c.routes.map(t=>({...t,destination:c.successors?.[t.province]?.[t.destination]??t.destination}));
    c.dataRevision=4;
    c.routes.push(...base.routes.filter(t=>!c.routes.some(r=>r.province===t.province&&r.origin===t.origin)));
  }
  if((c.dataRevision??0)<5){
    // Replace only the previous shipped weights; preserve deliberate edits.
    const old=c.profileWeights;
    if(!old||(old['2023-07-23']===70&&old['2019-11-10']===20&&old['2019-04-28']===10))c.profileWeights=defaultConfig().profileWeights;
    c.dataRevision=5;
  }
  if((c.dataRevision??0)<6){
    const base=defaultConfig();
    const oldExample=c.routes.filter(r=>r.id.startsWith('experiment-'));
    // Replace only the untouched previous example, never edited voter flows.
    const untouched=oldExample.length===10&&oldExample.every(r=>r.percent===(r.origin==='NC'&&r.destination==='PC_CC'?25:5)&&r.uncertainty===(r.destination==='PC_CC'?10:3));
    if(untouched)c.routes=c.routes.filter(r=>!r.id.startsWith('experiment-'));
    c.routes.push(...base.routes.filter(t=>!c.routes.some(r=>r.province===t.province&&r.origin===t.origin)));
    c.dataRevision=6;
  }
  return c;
}
