import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import NationalResults from './NationalResults';
import {defaultConfig} from './model/defaults';
import {provinces} from './model/projection';
import type {Probabilities} from './model/types';
it('agrupa la base, filtra partidos sin opciones y muestra las disputas en orden D’Hondt',async()=>{
  (globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({features:[{properties:{cod_prov:'28'},geometry:{type:'Polygon',coordinates:[[[-4,40],[-3,40],[-3,41],[-4,40]]]}}]})}));
  const config=defaultConfig();const result:Probabilities={config,iterations:1000,seed:1,national:{PP:{333:700,332:300},PSOE:{17:700,18:300},NEVER:{0:1000}},provincial:{},order:{},jointProvincial:{},jointOrder:{},unresolvedDraws:0};
  for(const p of provinces){const key=JSON.stringify({PP:p.seats});result.provincial[p.code]={PP:{[p.seats]:1000}};result.order[p.code]={PP:Object.fromEntries(Array.from({length:p.seats},(_,i)=>[i+1,1000]))};result.jointProvincial![p.code]={[key]:1000};result.jointOrder![p.code]={[key]:Array(p.seats).fill('PP')};}
  const key=JSON.stringify({PP:20,PSOE:17}),other=JSON.stringify({PP:19,PSOE:18});
  const order=Array.from({length:34},(_,i)=>i%2?'PSOE':'PP').concat(['PP','PP','PP']);
  result.provincial['28']={PP:{20:700,19:300},PSOE:{17:700,18:300}};
  result.jointProvincial!['28']={[key]:700,[other]:300};result.jointOrder!['28']={[key]:order,[other]:order.slice(0,36).concat('PSOE')};
  result.order['28']={PP:{},PSOE:{}};order.forEach((party,i)=>{result.order['28'][party][i+1]=1000;});result.order['28'].PP[37]=700;result.order['28'].PSOE[37]=300;
  const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
  try{
    await act(async()=>root.render(<NationalResults result={result} config={config}/>));
    expect(container.querySelectorAll('.confidence-cards>div')).toHaveLength(2);
    expect(container.querySelectorAll('.confidence-hemicycle circle')).toHaveLength(0);
    expect([...container.querySelectorAll('.confidence-hemicycle [data-seats]')].reduce((s,e)=>s+Number(e.getAttribute('data-seats')),0)).toBe(350);
    const selector=container.querySelector('select[aria-label="Partido del mapa de escaños en juego"]') as HTMLSelectElement;
    expect([...selector.options].map(o=>o.value).sort()).toEqual(['PP','PSOE']);
    const seats=container.querySelectorAll<HTMLButtonElement>('.ordered-seat');expect(seats).toHaveLength(37);
    expect(seats[0].textContent).toContain('PP');expect(seats[1].textContent).toContain('PSOE');expect(seats[36].textContent).toContain('En juego');
    expect(container.querySelector('.race-probabilities')?.textContent).toContain('70 %');expect(container.querySelector('.race-probabilities')?.textContent).toContain('30 %');
    await act(async()=>{selector.value='PSOE';selector.dispatchEvent(new Event('change',{bubbles:true}));});
    expect((container.querySelector('.map-svg path') as SVGElement).style.fill).toBe('#E20025');
    await act(async()=>seats[0].click());expect(container.querySelector('.race-probabilities')).toBeNull();
    await act(async()=>seats[36].click());expect(container.querySelectorAll('.race-probabilities>div')).toHaveLength(2);
  }finally{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();}
},30000);
