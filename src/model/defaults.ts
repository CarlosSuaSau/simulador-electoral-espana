import type {Config, Poll} from './types';
import pollCatalog from '../data/polls-2026.json';
import {closedCandidates,closedSuccessors} from './coalitions';
import {defaultTransfers} from './retention';

export const colorSources = [
  {party:'PSOE',hex:'#E20025',source:'https://psoedejaen.com/wp-content/uploads/2020/12/MANUAL-IDENTIDAD-CORPORATIVA-PSOE-2020.pdf',note:'RGB 226/0/37 del manual de 2020; conversión a hexadecimal.'},
  {party:'PP',hex:'#1D84CE',source:'https://www.wikidata.org/wiki/Q185088',note:'Referencia gráfica; pendiente de contraste con manual vigente.'},
  {party:'VOX',hex:'#63BE21',source:'https://www.wikidata.org/wiki/Q15630787',note:'sRGB registrado en Wikidata.'},
  {party:'SUMAR',hex:'#E61455',source:'https://www.wikidata.org/wiki/Q119458764',note:'sRGB registrado en Wikidata.'},
  {party:'CC',hex:'#FFD700',source:'https://www.wikidata.org/wiki/Q1104327',note:'Referencia sRGB de Wikidata.'},
  {party:'NC',hex:'#1C9468',source:'https://nuevacanarias.org/wp-content/uploads/2023/01/20221004-Nueva-Canarias-Manual-Corporativo-2020.pdf',note:'Hexadecimal del manual corporativo 2020.'},
];
export const colors: Record<string,string> = {
  PSOE:'#E20025', PP:'#1D84CE', VOX:'#63BE21', SUMAR:'#E61455', PODEMOS:'#6B1F5F',
  CC:'#FFD700', NC:'#1C9468', ERC:'#F2B500', JUNTS:'#00A4A6', BILDU:'#B5CF39',
  PNV:'#008000', BNG:'#76B5C5', UPN:'#234A88', SALF:'#8C5430',
};
export const labels: Record<string,string> = {PSOE:'PSOE',PP:'PP',SUMAR:'Sumar',FA:'Frente Amplio',COMPROMIS:'Compromís–Front Valencià',PODEMOS:'Podemos',VOX:'Vox',NC:'NC–BC',CC:'Coalición Canaria',BILDU:'EH Bildu',UPC:'Unidad del Pueblo Canario',PC_CC:'Primero Canarias–Coalición Canaria',DRAGO:'Drago Canarias',OTHER:'No desglosado'};

export function defaultConfig(): Config {
  return {
    version:2, name:'Encuestas 2026 · escenario de trabajo', asOf:'2026-10-27',
    polls:structuredClone(pollCatalog) as unknown as Poll[],
    candidates:structuredClone(closedCandidates),
    successors:closedSuccessors(),dataRevision:7,
    profileWeights:{'2023-07-23':100,'2019-11-10':0,'2019-04-28':0},
    routes:defaultTransfers(),turnout:65,blank:0.8,invalid:1,
    halfLife:30,proxies:{PODEMOS:'SUMAR',SALF:'VOX'},territorial:{},
    uncertainty:{seed:20261017,iterations:300,national:1,regional:0.5,provincial:0.5,bloc:0,turnout:1,accepted:false},
  };
}
