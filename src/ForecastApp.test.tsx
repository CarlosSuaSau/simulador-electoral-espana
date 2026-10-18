import {act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import App from './App';
import {provinces} from './model/projection';
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({features:[]})}));localStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();});
const click=async(text:string)=>act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent===text)!.click());
const toggleCorrection=async()=>act(async()=>(container.querySelector('[role="switch"]') as HTMLInputElement).click());
it('muestra encuestas antes del interruptor y guarda la selección',async()=>{
  await act(async()=>root.render(<App/>));
  const selection=container.querySelector('.poll-selection')!;
  expect(container.querySelectorAll('.poll-choice')).toHaveLength(8);
  expect(selection.compareDocumentPosition(container.querySelector('.correction-control')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(selection.textContent).toContain('31,4%');
  const checkbox=container.querySelector('input[aria-label="Incluir encuesta de GAD3"]') as HTMLInputElement;
  await act(async()=>checkbox.click());
  const stored=JSON.parse(localStorage.getItem('electoral-active-2026')!);
  expect(stored.polls.find((p:{institute:string})=>p.institute==='GAD3').enabled).toBe(false);
  expect(selection.textContent).toContain('7 seleccionadas');
},30000);
it('abre y cierra la información desde el pie sin exponer la antigua metodología',async()=>{
  await act(async()=>root.render(<App/>));
  expect(container.querySelector('dialog')).toBeNull();expect(container.textContent).not.toContain('snapshots/');
  await act(async()=>(container.querySelector('button[aria-label="Información, metodología y fuentes"]') as HTMLButtonElement).click());
  expect(container.querySelector('dialog[open]')?.textContent).toContain('Cómo leer este simulador');
  expect(container.querySelector('dialog')?.textContent).toContain('Los escenarios se guardan en este navegador');
  await act(async()=>(container.querySelector('button[aria-label="Cerrar información"]') as HTMLButtonElement).click());
  expect(container.querySelector('dialog')).toBeNull();
},30000);
it('mantiene el Monte Carlo nacional al alternar la corrección y muestra 350 plazas',async()=>{
  class FakeWorker {
    onmessage:((event:{data:unknown})=>void)|null=null;onerror=null;
    terminate(){}
    postMessage(message:{config:unknown;options:{iterations:number;seed:number}}){
      const n=message.options.iterations;
      const value={config:message.config,iterations:n,seed:message.options.seed,national:{PP:{350:n}},provincial:Object.fromEntries(provinces.map(p=>[p.code,{PP:{[p.seats]:n}}])),order:{},jointOrder:Object.fromEntries(provinces.map(p=>[p.code,{[JSON.stringify({PP:p.seats})]:Array(p.seats).fill('PP')}])),jointProvincial:Object.fromEntries(provinces.map(p=>[p.code,{[JSON.stringify({PP:p.seats})]:n}])),unresolvedDraws:0};
      Promise.resolve().then(()=>this.onmessage?.({data:{kind:'result',value}}));
    }
  }
  vi.stubGlobal('Worker',FakeWorker);
  await act(async()=>root.render(<App/>));await click('Monte Carlo nacional');await click('Simular las 52 provincias');
  expect(container.querySelectorAll('.confidence-hemicycle circle')).toHaveLength(0);
  expect([...container.querySelectorAll('.confidence-hemicycle [data-seats]')].reduce((s,p)=>s+Number(p.getAttribute('data-seats')),0)).toBe(350);
  expect(container.querySelector('.national-monte-carlo')?.textContent).toContain('1000 elecciones');
  await toggleCorrection();
  expect(container.querySelector('.national-monte-carlo')?.textContent).not.toContain('Cambió un dato');
  expect(container.querySelectorAll('.confidence-hemicycle circle')).toHaveLength(0);
  expect([...container.querySelectorAll('.confidence-hemicycle [data-seats]')].reduce((s,p)=>s+Number(p.getAttribute('data-seats')),0)).toBe(350);
},30000);
it('colorea ambos mapas y abre los cocientes al seleccionar una provincia',async()=>{
  vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({features:['35','38'].map(code=>({properties:{cod_prov:code},geometry:{type:'Polygon',coordinates:[[[-16,28],[-15.5,28],[-16,28.5],[-16,28]]]}}))})} as Response);
  await act(async()=>root.render(<App/>));
  const maps=container.querySelectorAll('.map-svg');expect(maps).toHaveLength(2);
  for(const map of maps)for(const path of map.querySelectorAll('path'))expect((path as SVGElement).style.fill).toMatch(/^#/);
  const tenerife=maps[1].querySelectorAll('path')[1];
  await act(async()=>tenerife.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(tenerife.getAttribute('aria-pressed')).toBe('true');
  expect(container.textContent).toContain('Próximo cociente');
  expect(container.querySelector('select')?.value).toBeDefined();
},30000);
it('abre el laboratorio con dos hemiciclos completos y permite guardar la matriz territorial',async()=>{
  await act(async()=>root.render(<App/>));
  expect(container.querySelectorAll('.hemicycle circle')).toHaveLength(700);
  expect(container.querySelector('[role=alert]')).toBeNull();
  await click('2. Coaliciones y trasvases');
  expect(container.querySelector('.coalition-information')?.hasAttribute('open')).toBe(false);
  expect(container.querySelectorAll('.transfer-origin').length).toBeGreaterThan(10);
  expect(container.textContent).toContain('40 %');
  await click('Guardar');const stored=JSON.parse(localStorage.getItem('electoral-saved-2026')!);
  expect(stored[0].version).toBe(2);expect(stored[0].routes.some((r:{origin:string;percent:number;destination:string})=>r.origin==='NC'&&r.percent===40&&r.destination==='PC_CC')).toBe(true);
  expect(stored[0].polls[0].sample).toBe(1077);
  expect(stored[0].polls.some((p:{institute:string})=>p.institute==='CIS')).toBe(false);
  expect(localStorage.getItem('electoral-scenarios-v1')).toBeNull();
},30000);
it('impide probabilidades sin aceptar supuestos y conserva el acceso al histórico',async()=>{
  await act(async()=>root.render(<App/>));await click('3. Probabilidades');await click('Calcular probabilidades');
  expect(container.textContent).toContain('Confirma los supuestos exploratorios');
  await click('Resultados de 2023');
  expect(container.textContent).toContain('Base oficial del 23 de julio de 2023');
},30000);

it('permite consultar el total nacional y alternar la corrección sin cambiar encuestas',async()=>{
  await act(async()=>root.render(<App/>));
  const selector=container.querySelector('select[aria-label="Provincia de la proyección"]') as HTMLSelectElement;
  await act(async()=>{selector.value='national';selector.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.textContent).toContain('España · resultado nacional');
  expect(container.textContent).not.toContain('Disputa de escaños: distancias exactas');
  const before=JSON.parse(localStorage.getItem('electoral-active-2026')!);
  await toggleCorrection();
  const after=JSON.parse(localStorage.getItem('electoral-active-2026')!);
  expect(after.halfError2023).toBe(true);expect(after.polls).toEqual(before.polls);
  await toggleCorrection();
  expect(JSON.parse(localStorage.getItem('electoral-active-2026')!).halfError2023).toBe(false);
  await act(async()=>{selector.value='38';selector.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.textContent).toContain('Disputa de escaños: distancias exactas');
},30000);
