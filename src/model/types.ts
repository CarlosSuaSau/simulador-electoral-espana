export type Province = {
  code: string; name: string; seats: number; votes: Record<string, number>;
  seatsByCandidate: Record<string, number>; blankVotes: number; nullVotes: number;
  census: number; turnout: number; validVotes: number;
};
export type Poll = {
  id: string; institute: string; publisher: string; start: string | null; end: string | null;
  published: string; sample: number | null; source: string; originalSource: string;
  verification: 'primary' | 'secondary' | 'user'; denominator: 'valid' | 'candidates';
  shares: Record<string, number>; enabled: boolean; weight: number; note?: string;
};
export type Candidate = {
  id: string; name: string; color: string; organizations: string[];
  territories: string[]; date: string; source: string;
  status: 'hypothetical' | 'announced' | 'closed' | 'registered' | 'official';
  kind?: 'party' | 'coalition'; evidence?: string;
};
export type Route = {
  id: string; province: string; origin: string; destination: string;
  percent: number; uncertainty: number;
};
export type Config = {
  version: 2; name: string; asOf: string; polls: Poll[]; candidates: Candidate[];
  routes: Route[]; turnout: number; blank: number; invalid: number;
  halfLife: number; proxies: Record<string, string>;
  territorial: Record<string, Record<string, number>>;
  uncertainty: { seed: number; iterations: number; national: number; regional: number;
    provincial: number; bloc: number; turnout: number; accepted: boolean };
  dataRevision?: number;
  profileWeights?: Record<string,number>;
  halfError2023?: boolean;
  territorialReferences?: {id:string;province:string;party:string;share:number;nationalShare:number;weight:number;kind:'general-poll'|'regional-election';source:string;date:string}[];
  successors?: Record<string, Record<string, string>>;
};
export type Projection = {
  code: string; votes: Record<string, number>; blank: number; invalid: number;
  abstention: number; valid: number; seats: number; sourceVotes: Record<string, number>;
  allocation: Record<string, number>; last: string | null; next: string | null;
  tie: boolean; awarded: string[];
};
export type Forecast = {
  provinces: Projection[]; allocation: Record<string, number>; nationalTargets: Record<string, number>;
  nationalActual: Record<string, number>; fittingError: number;
  pollWeights: { id: string; weight: number }[];
};
export type Probabilities = {
  seed: number; iterations: number; config: Config;
  national: Record<string, Record<number, number>>;
  provincial: Record<string, Record<string, Record<number, number>>>;
  order: Record<string, Record<string, Record<number, number>>>;
  unresolvedDraws: number;
  jointProvincial?: Record<string,Record<string,number>>;
  jointOrder?: Record<string,Record<string,string[]>>;
};
