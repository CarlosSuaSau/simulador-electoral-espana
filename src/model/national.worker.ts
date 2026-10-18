import {nationalSimulation} from './nationalSimulation';
import type {Config} from './types';
import type {NationalOptions} from './nationalSimulation';
self.onmessage=(e:MessageEvent<{config:Config;options:NationalOptions}>)=>{
  try{const value=nationalSimulation(e.data.config,e.data.options,n=>self.postMessage({kind:'progress',value:n}));self.postMessage({kind:'result',value});}
  catch(error){self.postMessage({kind:'error',value:(error as Error).message});}
};
