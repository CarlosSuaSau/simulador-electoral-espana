import {act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import App from './HistoricalApp';
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({features:[]})}));localStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();});
it('carga el histórico canario, añade un trasvase y guarda escenario',async()=>{
 await act(async()=>root.render(<App/>));
 expect(container.textContent).toContain('Las Palmas');
 const button=(text:string)=>[...container.querySelectorAll('button')].find(b=>b.textContent===text)!;
 await act(async()=>button('+ Añadir trasvase').click());
 expect(container.querySelectorAll('.transfer-row')).toHaveLength(1);
 await act(async()=>button('Guardar escenario').click());
 expect(JSON.parse(localStorage.getItem('electoral-scenarios-v1')!)).toHaveLength(1);
 expect(container.textContent).toContain('Escenario guardado');
});
it('muestra provincias no modelizadas sin editor',async()=>{
 await act(async()=>root.render(<App/>));
 const select=container.querySelector('select')!;
 await act(async()=>{select.value='28';select.dispatchEvent(new Event('change',{bubbles:true}));});
 expect(container.textContent).toContain('Madrid');expect(container.textContent).toContain('Resultado oficial histórico');expect(container.querySelector('.editor')).toBeNull();

});

