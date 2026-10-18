import {probabilitySimulation} from './projection';
import type {Config} from './types';
self.onmessage=(event:MessageEvent<Config>)=>{
  try{const result=probabilitySimulation(event.data,n=>self.postMessage({kind:'progress',value:n}));self.postMessage({kind:'result',value:result});}
  catch(error){self.postMessage({kind:'error',value:(error as Error).message});}
};
