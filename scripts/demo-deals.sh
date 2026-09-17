#!/usr/bin/env bash
#
# Учебные клиенты и сделки — чтобы посмотреть, как выглядит система с данными.
#
#   ./scripts/demo-deals.sh            — показать, что будет добавлено
#   ./scripts/demo-deals.sh apply      — добавить
#   ./scripts/demo-deals.sh remove     — убрать всё добавленное
#
# Запускать ТОЛЬКО на своей машине. На боевом сервере учебные сделки
# перемешаются с настоящими, и отличить их через месяц будет нечем.
#
# Скрипт идемпотентный: повторный запуск ничего не дублирует — клиенты
# опознаются по телефону, сделки по номеру лота.
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

MODE="${1:-preview}"

PORT=$(grep -E '^HTTP_PORT=' .env | cut -d= -f2 | tr -d '[:space:]')
BASE="http://127.0.0.1:${PORT:-8081}"

# Боевой стенд себя выдаёт NODE_ENV — на нём учебные данные не заводим
if grep -qE '^NODE_ENV=production' .env; then
  echo "Это боевая настройка (NODE_ENV=production). Учебные данные сюда не пишем."
  exit 1
fi

LOGIN=$(grep -E '^BOOTSTRAP_ADMIN_LOGIN=' .env | cut -d= -f2)
PASS=$(grep -E '^BOOTSTRAP_ADMIN_PASSWORD=' .env | cut -d= -f2)

JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT

curl -fsS -c "$JAR" -H 'Content-Type: application/json' \
  -d "{\"login\":\"${LOGIN}\",\"password\":\"${PASS}\"}" \
  "${BASE}/api/auth/login" >/dev/null || { echo "Не вышло войти под ${LOGIN}"; exit 1; }

# ─── Что заводим ─────────────────────────────────────────────────────────────
#
# Сделки расставлены по разным этапам и с разной оплатой: так на доске видно
# и полные столбцы, и долги, и просрочку прихода в порт.

read -r -d '' PAYLOAD <<'JSON' || true
[
  { "client": { "fullName": "Андрій Ковальчук", "phone": "+380 67 201 45 12", "telegram": "@a_kovalchuk", "city": "Київ", "source": "site" },
    "deals": [
      { "stage": "delivered", "platform": "copart", "lot": "58120433", "vin": "1C4PJMDX5KD123456",
        "car": "Jeep Cherokee Latitude", "year": 2019, "location": "TX — Dallas", "price": 8900,
        "portEta": "-120", "portArrived": "-115", "delivered": "-95", "createdAgo": 210,
        "charges": [["lot", 9400, "USD"], ["delivery", 2350, "USD"], ["customs", 141000, "UAH"], ["parking", 180, "USD"]],
        "payments": [["lot", 9400, "USD", -180], ["delivery", 2350, "USD", -150], ["customs", 141000, "UAH", -110], ["parking", 180, "USD", -100]],
        "comment": "Забрав авто сам, лишився задоволений. Обіцяв порадити друзям." },
      { "stage": "shipping", "platform": "iaai", "lot": "41209887", "vin": "5YFBURHE8JP765432",
        "car": "Toyota Corolla LE", "year": 2018, "location": "NJ — Newark", "price": 6200,
        "portEta": "25", "createdAgo": 28,
        "charges": [["lot", 6750, "USD"], ["delivery", 2100, "USD"]],
        "payments": [["lot", 6750, "USD", -20], ["delivery", 1000, "USD", -5]],
        "comment": "Друге авто цього клієнта — цього разу для дружини." }
    ] },

  { "client": { "fullName": "Олена Марченко", "phone": "+380 50 884 17 03", "telegram": "@olena_m", "city": "Львів", "source": "telegram" },
    "deals": [
      { "stage": "customs", "platform": "copart", "lot": "60417722", "vin": "3VW2B7AJ9JM098765",
        "car": "VW Jetta S", "year": 2018, "location": "GA — Atlanta", "price": 5400,
        "portEta": "-12", "portArrived": "-9", "createdAgo": 75,
        "charges": [["lot", 5900, "USD"], ["delivery", 2250, "USD"], ["customs", 98000, "UAH"]],
        "payments": [["lot", 5900, "USD", -70], ["delivery", 2250, "USD", -40], ["customs", 40000, "UAH", -6]],
        "comment": "Просила прискорити розмитнення — обіцяли до кінця тижня." }
    ] },

  { "client": { "fullName": "Сергій Бондаренко", "phone": "+380 63 442 90 88", "whatsapp": "+380634429088", "city": "Одеса", "source": "whatsapp" },
    "deals": [
      { "stage": "port", "platform": "iaai", "lot": "39887120", "vin": "1N4BL4BV5LC223344",
        "car": "Nissan Altima SV", "year": 2020, "location": "CA — Sacramento", "price": 9100,
        "portEta": "-3", "portArrived": "-1", "createdAgo": 88,
        "charges": [["lot", 9700, "USD"], ["delivery", 2600, "USD"], ["customs", 168000, "UAH"], ["parking", 240, "USD"]],
        "payments": [["lot", 9700, "USD", -80], ["delivery", 2600, "USD", -45]],
        "comment": "Чекає рахунок на розмитнення." }
    ] },

  { "client": { "fullName": "Ігор Тимченко", "phone": "+380 97 330 26 41", "city": "Харків", "source": "call" },
    "deals": [
      { "stage": "purchased", "platform": "copart", "lot": "61903355", "vin": "WBA8E9C55GK334455",
        "car": "BMW 328i xDrive", "year": 2016, "location": "IL — Chicago", "price": 7800,
        "portEta": "-6", "createdAgo": 45,
        "charges": [["lot", 8400, "USD"], ["delivery", 2450, "USD"]],
        "payments": [["lot", 4000, "USD", -30]],
        "comment": "Авто вже викуплено, чекаємо завантаження в контейнер. Клієнт затримує другий платіж." }
    ] },

  { "client": { "fullName": "Наталія Гриценко", "phone": "+380 68 715 04 27", "telegram": "@nataliia_g", "city": "Дніпро", "source": "instagram" },
    "deals": [
      { "stage": "bidding", "platform": "copart", "lot": "62550918", "vin": "",
        "car": "Mazda CX-5 Touring", "year": 2019, "location": "FL — Miami", "price": 0,
        "createdAgo": 9,
        "charges": [["lot", 11200, "USD"]],
        "payments": [],
        "comment": "Ліміт ставки 11 200 $. Торги в четвер." }
    ] },

  { "client": { "fullName": "Володимир Савченко", "phone": "+380 95 118 76 39", "city": "Вінниця", "source": "referral" },
    "deals": [
      { "stage": "quoted", "platform": "iaai", "lot": "", "vin": "",
        "car": "Honda CR-V EX", "year": 2018, "location": "OH — Columbus", "price": 0,
        "createdAgo": 4,
        "charges": [],
        "payments": [],
        "comment": "Розрахунок відправлено, думає два дні." }
    ] }
]
JSON

export PAYLOAD

python3 - "$MODE" "$BASE" "$JAR" <<'PY'
import json, pathlib, subprocess, sys, os
from datetime import date, timedelta

mode, base, jar = sys.argv[1], sys.argv[2], sys.argv[3]
payload = json.loads(os.environ['PAYLOAD'])

def call(method, path, body=None):
    cmd = ['curl', '-sS', '-b', jar, '-X', method, f'{base}{path}']
    if body is not None:
        cmd += ['-H', 'Content-Type: application/json', '-d', json.dumps(body, ensure_ascii=False)]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    try:
        return json.loads(out) if out else {}
    except json.JSONDecodeError:
        return {'error': out[:200]}

def day(offset):
    return (date.today() + timedelta(days=int(offset))).isoformat()

clients = call('GET', '/api/clients').get('items', [])
deals = call('GET', '/api/deals').get('items', [])
by_phone = {c['phone'].translate(str.maketrans('', '', ' -()+'))[-9:]: c for c in clients}
by_lot = {d['lotNumber']: d for d in deals if d.get('lotNumber')}

if mode == 'remove':
    removed = 0
    for entry in payload:
        for deal in entry['deals']:
            existing = by_lot.get(deal['lot'])
            if existing:
                call('DELETE', f"/api/deals/{existing['id']}")
                removed += 1
        key = entry['client']['phone'].translate(str.maketrans('', '', ' -()+'))[-9:]
        found = by_phone.get(key)
        if found:
            call('DELETE', f"/api/clients/{found['id']}")
    print(f'Убрано учебных сделок: {removed}, клиенты удалены вместе с ними.')
    raise SystemExit

plan_new_clients = sum(
    1 for e in payload
    if e['client']['phone'].translate(str.maketrans('', '', ' -()+'))[-9:] not in by_phone
)
plan_new_deals = sum(1 for e in payload for d in e['deals'] if d['lot'] and d['lot'] not in by_lot)

if mode != 'apply':
    print(f'К добавлению: клиентов {plan_new_clients}, сделок {plan_new_deals}.')
    print('Запустите с «apply», чтобы записать.')
    raise SystemExit

added_c = added_d = 0
for entry in payload:
    c = entry['client']
    key = c['phone'].translate(str.maketrans('', '', ' -()+'))[-9:]
    found = by_phone.get(key)
    if found:
        client_id = found['id']
    else:
        res = call('POST', '/api/clients', c)
        if 'item' not in res:
            print('Клиент не создан:', res); continue
        client_id = res['item']['id']
        added_c += 1

    for deal in entry['deals']:
        if deal['lot'] and deal['lot'] in by_lot:
            continue
        body = {
            'clientId': client_id,
            'stage': deal['stage'],
            'platform': deal['platform'],
            'lotNumber': deal['lot'] or None,
            'vin': deal['vin'] or None,
            'makeModel': deal['car'],
            'year': deal['year'],
            'location': deal['location'],
            'purchasePriceUsd': deal['price'] or None,
        }
        if deal.get('portEta'):
            body['portEta'] = day(deal['portEta'])
        if deal.get('portArrived'):
            body['portArrivedAt'] = day(deal['portArrived'])
        if deal.get('delivered'):
            body['deliveredAt'] = day(deal['delivered'])

        res = call('POST', '/api/deals', body)
        if 'item' not in res:
            print('Сделка не создана:', res); continue
        deal_id = res['item']['id']
        added_d += 1

        for article, planned, currency in deal['charges']:
            call('PUT', f'/api/deals/{deal_id}/charges/{article}',
                 {'planned': planned, 'currency': currency})

        for article, amount, currency, offset in deal['payments']:
            call('POST', f'/api/deals/{deal_id}/payments',
                 {'article': article, 'amount': amount, 'currency': currency,
                  'paidAt': day(offset), 'method': 'банк'})

        if deal.get('comment'):
            call('POST', f'/api/deals/{deal_id}/comments', {'body': deal['comment']})

# Даты создания расставляем задним числом — иначе все учебные сделки
# сваливаются в текущий месяц, и график роста показывает один столбик.
# Через API так не сделать (и правильно: настоящую дату подделывать нельзя),
# поэтому правим прямо в базе стенда — учебные данные того и стоят.
sql = []
for entry in payload:
    key = entry['client']['phone'].translate(str.maketrans('', '', ' -()+'))[-9:]
    ages = [d.get('createdAgo', 0) for d in entry['deals']]
    oldest = max(ages) if ages else 0
    sql.append(
        "UPDATE clients SET created_at = now() - interval '%d days' "
        "WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = '%s';" % (oldest, key)
    )
    for deal in entry['deals']:
        if deal['lot']:
            sql.append(
                "UPDATE deals SET created_at = now() - interval '%d days' "
                "WHERE lot_number = '%s';" % (deal.get('createdAgo', 0), deal['lot'])
            )

pathlib.Path('/tmp/demo-dates.sql').write_text('\n'.join(sql))
subprocess.run(
    'docker compose exec -T db psql -U avtoklyuch -d avtoklyuch -q -f - < /tmp/demo-dates.sql',
    shell=True, capture_output=True, text=True,
)
os.unlink('/tmp/demo-dates.sql')

print(f'Добавлено: клиентов {added_c}, сделок {added_d}. Даты расставлены по месяцам.')
PY
