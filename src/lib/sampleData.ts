export type ProvinceRecord = {
  code: string;
  name: string;
  seats: number;
  votes: Record<string, number>;
  source: string;
};

export const provinces: ProvinceRecord[] = [
  {
    code: '35',
    name: 'Las Palmas',
    seats: 8,
    source: '2023 official',
    votes: {
      PSOE: 175671,
      PP: 136857,
      Vox: 77343,
      Sumar: 54369,
      'NC-BC': 42430,
      'Coalición Canaria': 33558,
      Drago: 9680,
      SALF: 8921,
    },
  },
  {
    code: '38',
    name: 'Santa Cruz de Tenerife',
    seats: 7,
    source: '2023 official',
    votes: {
      PSOE: 129284,
      PP: 118763,
      Vox: 74032,
      Sumar: 46914,
      'NC-BC': 31140,
      'Coalición Canaria': 28610,
      Drago: 8400,
      SALF: 6618,
    },
  },
];
