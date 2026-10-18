export type Quotient = { candidate: string; divisor: number; quotient: number };
export function calculateDhondt(votes: Record<string, number>, seats: number, thresholdPercent = 3, blankVotes = 0, drawOrder: string[] = []) {
  if (!Number.isSafeInteger(seats) || seats < 1 || !Number.isSafeInteger(blankVotes) || blankVotes < 0 || !Number.isFinite(thresholdPercent) || thresholdPercent < 0 || thresholdPercent > 100 || Object.values(votes).some(v => !Number.isSafeInteger(v) || v < 0)) throw new Error('Los votos deben ser enteros no negativos y los escaños positivos.');
  const validVotes = Object.values(votes).reduce((a, b) => a + b, blankVotes);
  const threshold = seats === 1 ? 0 : validVotes * thresholdPercent / 100;
  const eligible = Object.entries(votes).filter(([, v]) => v > 0 && v >= threshold);
  const allocation = Object.fromEntries(Object.keys(votes).map(k => [k, 0]));
  const quotientTable: Quotient[] = eligible.flatMap(([candidate, v]) => Array.from({length: seats + 1}, (_, i) => ({candidate, divisor: i + 1, quotient: v / (i + 1)})));
  const unresolvedTies: string[] = [];
  quotientTable.sort((a,b) => {
    const diff = BigInt(votes[b.candidate]) * BigInt(a.divisor) - BigInt(votes[a.candidate]) * BigInt(b.divisor);
    return diff > 0n ? 1 : diff < 0n ? -1 : votes[b.candidate] - votes[a.candidate] || a.candidate.localeCompare(b.candidate);
  });
  const assigned: Quotient[] = [];
  // Equal totals require an explicit recorded draw; alternate subsequent tied seats.
  for (let i = 0; i < quotientTable.length;) {
    let end = i + 1;
    const first = quotientTable[i];
    while (end < quotientTable.length && BigInt(votes[first.candidate]) * BigInt(quotientTable[end].divisor) === BigInt(votes[quotientTable[end].candidate]) * BigInt(first.divisor) && votes[first.candidate] === votes[quotientTable[end].candidate]) end++;
    const group = quotientTable.slice(i,end);
    if (group.length > 1 && assigned.length < seats && assigned.length + group.length > seats) {
      if (group.some(q => !drawOrder.includes(q.candidate))) unresolvedTies.push(...group.map(q => q.candidate));
      group.sort((a,b) => (drawOrder.indexOf(a.candidate) - drawOrder.indexOf(b.candidate)) * (first.divisor % 2 ? 1 : -1));
    }
    assigned.push(...group); i = end;
  }
  const winners = assigned.slice(0,seats);
  winners.forEach(q => allocation[q.candidate]++);
  return { allocation, quotientTable: assigned, lastSeatCandidate: winners.at(-1)?.candidate ?? null, lastSeatQuotient: winners.at(-1)?.quotient ?? null, bestNonSeatQuotient: assigned[seats]?.quotient ?? null, contenders: [...new Set(assigned.slice(seats).map(q => q.candidate))], threshold, validVotes, unresolvedTies };
}
export function seatDistance(votes: Record<string,number>, seats: number, blank: number, candidate: string, mode: 'additional' | 'loss' | 'transfer', donor?: string): number | null {
  const initial = calculateDhondt(votes,seats,3,blank).allocation[candidate] ?? 0;
  if (mode === 'transfer' && (!donor || donor === candidate)) return null;
  const limit = mode === 'loss' ? votes[candidate] ?? 0 : mode === 'transfer' ? votes[donor!] ?? 0 : Object.values(votes).reduce((a,b)=>a+b,blank) * 100 + 1;
  const changes = (n: number) => {
    const next = {...votes, [candidate]: (votes[candidate] ?? 0) + (mode === 'loss' ? -n : n)};
    if (mode === 'transfer') next[donor!] -= n;
    const result = calculateDhondt(next,seats,3,blank);
    if (result.unresolvedTies.length) return false;
    return mode === 'loss' ? result.allocation[candidate] < initial : result.allocation[candidate] > initial;
  };
  if (!changes(limit)) return null;
  let low = 1, high = limit;
  while (low < high) { const mid = Math.floor((low+high)/2); if(changes(mid)) high=mid; else low=mid+1; }
  return low;
}
