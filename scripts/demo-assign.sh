#!/usr/bin/env bash
#
# Раздать учебные записи сотрудникам.
#
#   ./scripts/demo-assign.sh                      — показать, что получится
#   ./scripts/demo-assign.sh apply                — раздать
#   ENV_FILE=.env.larus ./scripts/demo-assign.sh apply   — в экземпляре клиента
#
# Зачем. demo-deals.sh заводит всё от имени первого администратора, и записи
# достаются ему одному. Менеджер видит только свою работу (право
# viewOthersWork), поэтому на демонстрации он открывает систему и видит
# пустоту — впечатление ровно обратное задуманному.
#
# Раздача по кругу между сотрудниками заодно показывает, как устроены права:
# руководитель видит все сделки, менеджер — только доставшиеся ему. Это и
# есть ответ на вопрос «что увидит мой сотрудник», который задают первым.
#
# Трогает ТОЛЬКО записи с флагом is_demo. Настоящие данные не затрагиваются
# ни при каких обстоятельствах — это защита от запуска на боевом стенде,
# где учебные и реальные записи лежат вперемешку.
#
# Идемпотентный: раздача считается от порядкового номера записи, поэтому
# повторный запуск расставляет всё так же.
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

MODE="${1:-preview}"
ENV_FILE="${ENV_FILE:-.env}"
[[ -f "$ENV_FILE" ]] || { echo "Нет файла настроек ${ENV_FILE}"; exit 1; }

COMPOSE_FILE="docker-compose.yml"
grep -qE '^NODE_ENV=production' "$ENV_FILE" && COMPOSE_FILE="docker-compose.prod.yml"

PG_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2)
PG_DB=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2)
PG_USER="${PG_USER:-avtoklyuch}"
PG_DB="${PG_DB:-avtoklyuch}"

psql_run() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
    psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 "$@"
}

# Раздаём только администраторам и менеджерам: агент получает клиентов через
# свою реферальную ссылку, приписывать ему чужих нельзя — он увидит в кабинете
# вознаграждение за сделки, которых не приводил.
read -r -d '' ASSIGN_SQL <<'SQL' || true
WITH staff AS (
  SELECT id, row_number() OVER (ORDER BY role DESC, login) - 1 AS n,
         count(*) OVER () AS total
    FROM users
   WHERE role IN ('admin', 'manager') AND is_active
),
numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) - 1 AS n FROM clients WHERE is_demo
)
UPDATE clients c
   SET manager_id = s.id
  FROM numbered nm
  JOIN staff s ON s.n = nm.n % s.total
 WHERE c.id = nm.id AND c.is_demo;

-- Сделка достаётся тому же, кому достался её клиент: иначе менеджер видел бы
-- сделку, но не мог открыть карточку клиента по ней
UPDATE deals d
   SET manager_id = c.manager_id
  FROM clients c
 WHERE d.client_id = c.id AND d.is_demo AND c.is_demo;
SQL

read -r -d '' REPORT_SQL <<'SQL' || true
SELECT u.login,
       u.role,
       count(DISTINCT c.id) AS clients,
       count(DISTINCT d.id) AS deals
  FROM users u
  LEFT JOIN clients c ON c.manager_id = u.id AND c.is_demo
  LEFT JOIN deals   d ON d.manager_id = u.id AND d.is_demo
 WHERE u.role IN ('admin', 'manager') AND u.is_active
 GROUP BY u.login, u.role
 ORDER BY u.role DESC, u.login;
SQL

if [[ "$MODE" != "apply" ]]; then
  echo "Сейчас учебные записи распределены так:"
  echo "$REPORT_SQL" | psql_run -f -
  echo
  echo "Запустить раздачу: ${0} apply"
  exit 0
fi

echo "$ASSIGN_SQL" | psql_run -q -f -
echo "Готово. Учебные записи розданы:"
echo "$REPORT_SQL" | psql_run -f -
echo
echo "Руководитель видит все сделки, менеджер — только свои: так устроены права."
