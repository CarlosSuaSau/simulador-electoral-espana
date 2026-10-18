import {describe,it,expect} from 'vitest';
import {monteCarlo,seededRandom} from './monteCarlo';
import {geometryPath} from '../ProvinceMap';
import fs from 'node:fs';
describe('cartografía',()=>{it('proyecta las 52 geometrías dentro del lienzo y conserva anillos',()=>{
 const geo=JSON.parse(fs.readFileSync('public/data/spain-provinces.geojson','utf8'));
 expect(geo.features).toHaveLength(52);
 for(const f of geo.features){const path=geometryPath(f.geometry,['35','38'].includes(f.properties.cod_prov));expect(path).not.toMatch(/NaN|undefined/);const points=[...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)];expect(points.length).toBeGreaterThan(2);for(const p of points){expect(Number(p[1])).toBeGreaterThanOrEqual(0);expect(Number(p[1])).toBeLessThan(620);expect(Number(p[2])).toBeGreaterThanOrEqual(0);expect(Number(p[2])).toBeLessThan(610);}}
});});
describe('Monte Carlo exploratorio',()=>{it('reproduce muestras e histogramas con semilla fija',()=>{const a=seededRandom(42),b=seededRandom(42);expect(Array.from({length:10},a)).toEqual(Array.from({length:10},b));const config={seed:42,iterations:30,assumptions:'Ejemplo sintético de prueba, no electoral',draw:(random:()=>number)=>[{code:'test',drawOrder:['A','B'],votes:{A:Math.floor(random()*100)+1,B:60},blank:0,seats:1}]};expect(monteCarlo(config)).toEqual(monteCarlo(config));});});
