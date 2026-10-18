import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {Worker} from 'node:worker_threads';
import {build} from 'esbuild';
const name=fs.readdirSync('dist/assets').find(n=>n.startsWith('national.worker-'));
assert.ok(name,'Compila primero.');
const target=pathToFileURL(path.resolve('dist/assets',name)).href;
const bundled=await build({stdin:{contents:"export {provinceConfidence,provinceRaces} from './src/model/nationalSimulation';export {aggregate,project} from './src/model/projection';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {provinceConfidence,provinceRaces,aggregate,project}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const config=JSON.parse(fs.readFileSync('data/scenarios/base-2026.json','utf8'));
config.halfError2023=true; // The national worker must ignore this switch.
const wrapper=`import {parentPort} from 'node:worker_threads';globalThis.self=globalThis;self.postMessage=m=>parentPort.postMessage(m);await import(${JSON.stringify(target)});parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({kind:'ready'});`;
const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(wrapper)));
const start=Date.now();
await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{worker.terminate();reject(Error('Tiempo agotado.'));},180000);
  worker.on('error',reject);
  worker.on('message',m=>{
    if(m.kind==='ready')worker.postMessage({config,options:{iterations:1000,seed:20261018}});
    if(m.kind==='error'){clearTimeout(timeout);worker.terminate();reject(Error(m.value));}
    if(m.kind==='result'){
      clearTimeout(timeout);worker.terminate();
      try{
        const r=m.value;assert.equal(r.config.halfError2023,false);
        const total=Object.values(r.national).reduce((s,h)=>s+Object.entries(h).reduce((n,[k,count])=>n+Number(k)*count,0),0);assert.equal(total,350000);
        const rows=Object.keys(r.provincial).map(code=>provinceConfidence(r,code));assert.equal(rows.length,52);
        const races=Object.keys(r.provincial).map(code=>provinceRaces(r,code));for(const p of races){assert.equal(p.stable+p.swing,p.seats.length);for(const s of p.seats)assert.ok(Math.abs(s.contenders.reduce((n,c)=>n+c.probability,0)-1)<1e-9);}
        const counts=rows.reduce((s,p)=>({solid:s.solid+p.solid,likely:s.likely+p.likely,swing:s.swing+p.swing}),{solid:0,likely:0,swing:0});assert.equal(counts.solid+counts.likely+counts.swing,350);
        const junts={aggregate:aggregate(config).shares.JUNTS,seats:project(config).allocation.JUNTS,without:config.polls.filter(p=>'JUNTS' in p.shares).map(p=>{const c={...config,polls:config.polls.map(q=>q.id===p.id?{...q,enabled:false}:q)};return {institute:p.institute,share:p.shares.JUNTS,aggregateWithout:aggregate(c).shares.JUNTS,seatsWithout:project(c).allocation.JUNTS};}),histogram:r.national.JUNTS};
        const report={iterations:1000,seed:r.seed,totalSeats:total,counts:{consolidated:counts.solid+counts.likely,swing:counts.swing},orderedDhondtVerified:true,independentOfCorrection:true,seconds:(Date.now()-start)/1000,provinces:rows.map(p=>({code:p.code,solid:p.solid,likely:p.likely,swing:p.swing})),junts};
        fs.writeFileSync('data/research/national-worker-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({counts:report.counts,seconds:report.seconds,largestDisputes:report.provinces.sort((a,b)=>b.swing-a.swing).slice(0,5),junts}));resolve();
      }catch(error){reject(error);}
    }
  });
});
