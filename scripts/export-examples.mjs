import fs from 'node:fs';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
// Bundle the same typed defaults and JSON catalog used by the application.
const bundled=await build({entryPoints:[fileURLToPath(new URL('../src/model/defaults.ts',import.meta.url))],bundle:true,write:false,format:'esm',platform:'node'});
const js=bundled.outputFiles[0].text;
const {defaultConfig}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const config=defaultConfig();
fs.mkdirSync(new URL('../data/polls/',import.meta.url),{recursive:true});
fs.mkdirSync(new URL('../data/scenarios/',import.meta.url),{recursive:true});
for(const poll of config.polls)fs.writeFileSync(new URL(`../data/polls/${poll.id}.json`,import.meta.url),JSON.stringify(poll,null,2));
fs.writeFileSync(new URL('../data/scenarios/base-2026.json',import.meta.url),JSON.stringify(config,null,2));
console.log('Exportados ejemplos versionados de encuesta y escenario.');
