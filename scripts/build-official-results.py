import json
import hashlib
from urllib.request import urlretrieve
import re
from datetime import date
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / 'data' / 'raw' / 'Elecciones-Congreso.xlsx'
OUTPUT = ROOT / 'src' / 'data' / 'official-results-2023.json'

PROVINCE_NAMES = {
    1: 'Araba/Álava', 2: 'Albacete', 3: 'Alicante/Alacant', 4: 'Almería', 5: 'Ávila',
    6: 'Badajoz', 7: 'Balears, Illes', 8: 'Barcelona', 9: 'Burgos', 10: 'Cáceres',
    11: 'Cádiz', 12: 'Castellón/Castelló', 13: 'Ciudad Real', 14: 'Córdoba', 15: 'A Coruña',
    16: 'Cuenca', 17: 'Girona', 18: 'Granada', 19: 'Guadalajara', 20: 'Gipuzkoa', 21: 'Huelva',
    22: 'Huesca', 23: 'Jaén', 24: 'León', 25: 'Lleida', 26: 'La Rioja', 27: 'Lugo',
    28: 'Madrid', 29: 'Málaga', 30: 'Murcia', 31: 'Navarra', 32: 'Ourense', 33: 'Asturias',
    34: 'Palencia', 35: 'Las Palmas', 36: 'Pontevedra', 37: 'Salamanca', 38: 'Santa Cruz de Tenerife',
    39: 'Cantabria', 40: 'Segovia', 41: 'Sevilla', 42: 'Soria', 43: 'Tarragona', 44: 'Teruel',
    45: 'Toledo', 46: 'Valencia/València', 47: 'Valladolid', 48: 'Bizkaia', 49: 'Zamora',
    50: 'Zaragoza', 51: 'Ceuta', 52: 'Melilla',
}

PROVINCE_SEATS = {
    1: 4, 2: 5, 3: 12, 4: 6, 5: 3, 6: 6, 7: 8, 8: 32, 9: 4, 10: 6,
    11: 9, 12: 5, 13: 5, 14: 7, 15: 8, 16: 3, 17: 7, 18: 7, 19: 3, 20: 6,
    21: 5, 22: 3, 23: 7, 24: 4, 25: 4, 26: 4, 27: 4, 28: 37, 29: 11, 30: 10,
    31: 5, 32: 4, 33: 8, 34: 3, 35: 8, 36: 7, 37: 4, 38: 7, 39: 5, 40: 3,
    41: 12, 42: 2, 43: 6, 44: 2, 45: 5, 46: 15, 47: 5, 48: 8, 49: 3, 50: 7,
    51: 1, 52: 1,
}

if not WORKBOOK.exists():
    WORKBOOK.parent.mkdir(parents=True, exist_ok=True)
    try:
        urlretrieve('https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-Congreso.xlsx', WORKBOOK)
    except Exception as error:
        raise SystemExit(f'No se pudo descargar el Excel: {error}. Copia manualmente Elecciones-Congreso.xlsx en data/raw/ y repite.')

wb = load_workbook(WORKBOOK, read_only=True)
ws = wb['Congreso']

metadata = {}
records = {}
by_name = {}

for row in ws.iter_rows(values_only=True):
    if not row or not row[0]:
        continue
    first = row[0]
    if not hasattr(first, 'date'):
        continue
    if first.date() != date(2023, 7, 23):
        continue

    desc = row[3] if len(row) > 3 else None
    if not isinstance(desc, str):
        continue

    desc = __import__('unicodedata').normalize('NFC', desc)
    fields = {'Electores': 'census', 'Votantes': 'turnout', 'Votos v\u00e1lidos': 'validVotes', 'Votos nulos': 'nullVotes', 'Votos en blanco': 'blankVotes'}
    if desc in fields:
        for index in range(1, 53):
            metadata.setdefault(str(index), {})[fields[desc]] = int(row[index + 3] or 0)

    if desc.startswith('Votos ('):
        match = re.search(r'\((.*)\)', desc)
        if not match:
            continue
        name = match.group(1).strip()
        votes = [row[idx] for idx in range(4, 56)]
        if not any(v is not None for v in votes):
            continue
        by_name.setdefault(name, {'votes': {}, 'seats': {}})
        for province_index, value in enumerate(votes, start=1):
            if value is None:
                continue
            province_code = str(province_index)
            by_name[name]['votes'][province_code] = by_name[name]['votes'].get(province_code, 0) + value
    elif desc.startswith('Escaños'):
        match = re.search(r'\((.*)\)', desc)
        if not match:
            continue
        name = match.group(1).strip()
        seats = [row[idx] for idx in range(4, 56)]
        if not any(v is not None for v in seats):
            continue
        by_name.setdefault(name, {'votes': {}, 'seats': {}})
        for province_index, value in enumerate(seats, start=1):
            if value is None:
                continue
            province_code = str(province_index)
            by_name[name]['seats'][province_code] = by_name[name]['seats'].get(province_code, 0) + value

for name, payload in by_name.items():
    for province_index in range(1, 53):
        province_code = str(province_index)
        votes = payload['votes'].get(province_code, 0)
        seats = payload['seats'].get(province_code, 0)
        if votes == 0 and seats == 0:
            continue
        records.setdefault(province_code, {'name': PROVINCE_NAMES[province_index], 'seats': PROVINCE_SEATS[province_index], 'votes': {}})
        records[province_code]['votes'][name] = {'votes': int(votes), 'seats': int(seats)}

provinces = []
for province_index in range(1, 53):
    code = str(province_index)
    payload = records.get(code, {'name': PROVINCE_NAMES[province_index], 'seats': PROVINCE_SEATS[province_index], 'votes': {}})
    votes = {key: value['votes'] for key, value in payload['votes'].items()}
    seats = {key: value['seats'] for key, value in payload['votes'].items()}
    provinces.append({
        **metadata.get(code, {}),
        'code': code,
        'name': PROVINCE_NAMES[province_index],
        'seats': sum(seats.values()),
        'validVotes': metadata[code]['validVotes'],
        'candidateIds': {name: 'congreso-2023-' + hashlib.sha256(name.encode('utf-8')).hexdigest()[:16] for name in votes},
        'votes': votes,
        'seatsByCandidate': seats,
    })

assert len(provinces) == 52 and sum(p['seats'] for p in provinces) == 350
for p in provinces:
    assert sum(p['votes'].values()) + p['blankVotes'] == p['validVotes'], p['name']
    assert p['validVotes'] + p['nullVotes'] == p['turnout'], p['name']

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps({
    'schemaVersion': 2,
    'source': {
        'name': 'Ministerio del Interior – Elecciones al Congreso 2023',
        'file': 'data/raw/Elecciones-Congreso.xlsx',
        'url': 'https://descargas.interior.gob.es/datasets/resultados_electorales/Elecciones-Congreso.xlsx',
        'sha256': hashlib.sha256(WORKBOOK.read_bytes()).hexdigest(),
        'status': 'official-source; independent BOE cross-check pending',
        'type': 'official',
        'date': '2023-07-23'
    },
    'provinces': provinces,
}, ensure_ascii=False, indent=2), encoding='utf-8')

print(f'Generated {len(provinces)} provinces in {OUTPUT}')
