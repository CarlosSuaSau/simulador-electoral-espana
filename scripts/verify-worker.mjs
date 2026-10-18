import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Worker} from 'node:worker_threads';
const name=fs.readdirSync('dist/assets').find(n=>n.startsWith('simulation.worker-'));
if(!name)throw Error('Compila primero con npm.cmd run build.');
const target=pathToFileURL(path.resolve('dist/assets',name)).href;
const config=JSON.parse(fs.readFileSync('data/scenarios/base-2026.json','utf8'));
config.uncertainty.accepted=true;
// Exercise the production browser-worker bundle with a minimal messaging
// adapter. This verifies calculation and packaging, not browser layout.
const wrapper=`import {parentPort} from 'node:worker_threads';globalThis.self=globalThis;self.postMessage=m=>parentPort.postMessage(m);await import(${JSON.stringify(target)});parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({kind:'ready'});`;
const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(wrapper)));
const start=Date.now();
await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{worker.terminate();reject(Error('Tiempo agotado.'));},60000);
  worker.on('message',m=>{
    if(m.kind==='ready')worker.postMessage(config);
    if(m.kind==='error'){clearTimeout(timeout);worker.terminate();reject(Error(m.value));}
    if(m.kind==='result'){
      clearTimeout(timeout);
      const r=m.value;
      const total=Object.values(r.national).reduce((sum,h)=>sum+Object.entries(h).reduce((s,[seats,n])=>s+Number(seats)*n,0),0);
      worker.terminate();
      if(total!==350*r.iterations){reject(Error('Total nacional incorrecto.'));return;}
      if(r.config.polls.some(p=>/\bCIS\b/i.test(p.institute))){reject(Error('CIS inesperado en el escenario.'));return;}
      const report={iterations:r.iterations,seed:r.seed,totalSeats:total,institutes:r.config.polls.map(p=>p.institute),seconds:(Date.now()-start)/1000};
      fs.writeFileSync('data/research/worker-verification.json',JSON.stringify(report,null,2));
      console.log(JSON.stringify(report));resolve();
    }
  });
  worker.on('error',error=>{clearTimeout(timeout);reject(error);});
});
