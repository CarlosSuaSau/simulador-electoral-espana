"""Archive public poll pages; record failures without fabricating source files."""
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data' / 'raw' / 'polls'
OUT.mkdir(parents=True, exist_ok=True)
polls = json.loads((ROOT / 'src/data/polls-2026.json').read_text(encoding='utf-8-sig'))


def download(poll):
    record = {'id': poll['id'], 'url': poll['source']}
    try:
        request = Request(poll['source'], headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(request, timeout=15) as response:
            data = response.read()
        target = OUT / (poll['id'] + '.html')
        target.write_bytes(data)
        record.update(status='downloaded', file=str(target.relative_to(ROOT)), sha256=hashlib.sha256(data).hexdigest())
    except Exception as error:
        record.update(status='failed', error=str(error), manual='Abre la URL y guarda el documento original en data/raw/polls/. No se sustituye por datos estimados.')
    return record


with ThreadPoolExecutor(max_workers=4) as executor:
    records = list(executor.map(download, polls))
(OUT / 'download-status.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
for record in records:
    print(record['id'], record['status'], record.get('error', record.get('sha256', '')))
