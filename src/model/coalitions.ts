import regions from '../data/regions.json';
import type {Candidate} from './types';
export const separateBallots=[{id:'AA',name:'Adelante Andalucía',territories:['4','11','14','18','21','23','29','41'],source:'https://elpais.com/espana/2026-10-05/adelante-andalucia-se-presentara-en-solitario-a-las-generales-recogemos-el-legado-de-las-ultimas-elecciones-andaluzas.html',evidence:'Concurre separada de Frente Amplio. El perfil de Sumar restringido a Andalucía es un proxy geográfico, no una coalición ni un trasvase de votos.'}];
const territorial='https://elpais.com/espana/elecciones-generales/2026-10-16/estos-son-los-acuerdos-territoriales-que-ya-estan-cerrados-en-la-izquierda-alternativa-para-las-elecciones-del-29-n.html';
export const closedCandidates:Candidate[]=[
  {id:'UPN_PP',name:'UPN–PP',color:'#234A88',organizations:['Unión del Pueblo Navarro','Partido Popular'],territories:['31'],date:'2026-10-14',source:'https://www.rtve.es/noticias/20261014/upn-pp-sellan-acuerdo-para-concurrir-coalicion-a-elecciones-generales-del-29-n/17266826.shtml',status:'closed',kind:'coalition',evidence:'Denominación: Unión del Pueblo Navarro en coalición con el Partido Popular. Una papeleta; los electos de UPN irán al Grupo Mixto. No se atribuyen todos los diputados al PP.'},
  {id:'UPC',name:'Unidad del Pueblo Canario',color:'#1C9468',organizations:['Nueva Canarias–Bloque Canarista','Podemos','Izquierda Unida','Movimiento Sumar'],territories:['35','38'],date:'2026-10-15',source:'https://efe.com/espana/2026-10-15/podemos-sumar-acuerdo-territorial-nueva-canarias-iu/',status:'closed',kind:'coalition',evidence:'Acuerdo cerrado anunciado por las organizaciones y recogido por EFE; comprobación documental del registro electoral pendiente.'},
  {id:'PC_CC',name:'Mesa de Unidad Canaria (CC–Primero Canarias)',color:'#D9B930',organizations:['Coalición Canaria','Municipalistas Primero Canarias'],territories:['35','38'],date:'2026-10-17',source:'https://cadenaser.com/canarias/2026/10/17/coalicion-canaria-y-primero-canarias-sellan-la-unidad-para-defender-canarias-en-madrid-radio-club-tenerife/',status:'closed',kind:'coalition',evidence:'Presentación pública de la alianza y su denominación en Cadena SER/EFE. No se confunden los firmantes de apoyo con componentes registrales.'},
  {id:'DRAGO',name:'Drago Canarias',color:'#657A73',organizations:['Drago Canarias'],territories:['35','38'],date:'2026-10-15',source:'https://efe.com/espana/2026-10-15/podemos-sumar-acuerdo-territorial-nueva-canarias-iu/',status:'announced',kind:'party',evidence:'Candidatura en solitario, fuera de UPC. No es una coalición hipotética.'},
  {id:'FA',name:'Frente Amplio',color:'#E61455',organizations:['Izquierda Unida','Movimiento Sumar','Más Madrid','Comuns'],territories:Object.keys(regions).filter(c=>!['3','12','35','38','46'].includes(c)),date:'2026-10-16',source:'https://cadenaser.com/nacional/2026/10/16/podemos-y-frente-amplio-no-acuerdan-una-candidatura-unitaria-e-iran-por-separado-en-todos-los-territorios-excepto-canarias-y-comunidad-valenciana-cadena-ser/',status:'closed',kind:'coalition',evidence:'Acuerdo y cierre del registro recogidos por SER. Las marcas autonómicas se agrupan en Frente Amplio; no se incluyen pactos del Senado.'},
  {id:'COMPROMIS',name:'Compromís–Front Valencià',color:'#E87525',organizations:['Compromís','Podem','Esquerra Unida'],territories:['3','12','46'],date:'2026-10-16',source:territorial,status:'closed',kind:'coalition',evidence:'Acuerdo territorial cerrado. Su pertenencia futura a un grupo parlamentario no se da por confirmada.'},
];
export function closedSuccessors():Record<string,Record<string,string>>{return Object.fromEntries(Object.keys(regions).map(code=>[code,
  ['35','38'].includes(code)?{SUMAR:'UPC',PODEMOS:'UPC',NC:'UPC',CC:'PC_CC'}:
    ['3','12','46'].includes(code)?{SUMAR:'COMPROMIS',PODEMOS:'COMPROMIS'}:
      code==='31'?{SUMAR:'FA',PP:'UPN_PP',UPN:'UPN_PP'}:['8','17','25','43'].includes(code)?{SUMAR:'FA',PODEMOS:'ERC'}:{SUMAR:'FA'}
])) as unknown as Record<string,Record<string,string>>;}
export const territorialAgreements=[
  {region:'Aragón',national:'FA',partners:'Chunta Aragonesista'},
  {region:'Asturias',national:'FA',partners:'Somos Asturies'},
  {region:'Andalucía',national:'FA',partners:'Iniciativa del Pueblo Andaluz, Verdes Equo; marca Frente Amplio por Andalucía. Adelante Andalucía concurre separadamente.'},
  {region:'Baleares',national:'FA',partners:'Ara Més'},
  {region:'Navarra',national:'FA',partners:'Batzarre'},
  {region:'Cataluña',national:'ERC',partners:'Colaboración con Podemos; apoyo sin papeleta propia, no se crea una segunda papeleta de ERC.'},
].map(a=>({...a,source:territorial,date:'2026-10-16'}));
