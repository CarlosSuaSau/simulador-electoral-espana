export type Transfer = { origin: string; destination: string; percent: number };
export type Scenario = { version: 1; name: string; province: string; transfers: Transfer[]; candidates: string[]; mobilization: number; newcomers: number; destination: string };
export const special = ['@abstention', '@blank', '@null'];
export function simulate(base: Record<string,number>, blank: number, invalid: number, abstention: number, scenario: Scenario) {
  const pools = {...base, '@blank': blank, '@null': invalid, '@abstention': abstention};
  const totals: Record<string,number> = Object.fromEntries([...Object.keys(pools), ...scenario.candidates].map(k=>[k,0]));
  for (const row of scenario.transfers) if (!(row.origin in pools) || !(row.destination in totals) || !Number.isFinite(row.percent) || row.percent < 0 || row.percent > 100) throw new Error('Trasvase inválido.');
  for (const [origin, count] of Object.entries(pools)) {
    const rows = scenario.transfers.filter(t=>t.origin===origin);
    const sum = rows.reduce((n,r)=>n+r.percent,0);
    if (sum > 100 + 1e-9) throw new Error('Los destinos de un origen superan el 100 %.');
    const shares = [...rows.map(r=>({destination:r.destination, share:r.percent})), {destination:origin, share:100-sum}].map(r=>({...r, exact:count*r.share/100}));
    const rounded = shares.map(r=>Math.floor(r.exact));
    const order = shares.map((r,i)=>({i, fraction:r.exact-rounded[i]})).sort((a,b)=>b.fraction-a.fraction);
    for (let j=0;j<count-rounded.reduce((a,b)=>a+b,0);j++) rounded[order[j].i]++;
    shares.forEach((r,i)=>totals[r.destination]+=rounded[i]);
  }
  if (![scenario.mobilization,scenario.newcomers].every(n=>Number.isSafeInteger(n)&&n>=0) || scenario.mobilization > totals['@abstention'] || !(scenario.destination in totals) || special.includes(scenario.destination)) throw new Error('Movilización inválida o superior a los abstencionistas disponibles.');
  totals['@abstention']-=scenario.mobilization;
  totals[scenario.destination]+=scenario.mobilization+scenario.newcomers;
  return {votes:Object.fromEntries(Object.entries(totals).filter(([k])=>!special.includes(k))), blank:totals['@blank'], invalid:totals['@null'], abstention:totals['@abstention']};
}
export function validateScenario(value: unknown): Scenario {
  const s = value as Scenario;
  if (!s || s.version !== 1 || typeof s.name !== 'string' || typeof s.province !== 'string' || !Array.isArray(s.transfers) || !Array.isArray(s.candidates) || !s.candidates.every(c=>typeof c==='string' && !c.startsWith('@')) || typeof s.destination !== 'string') throw new Error('Archivo de escenario incompatible.');
  return s;
}
