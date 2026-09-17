#!/usr/bin/env bash
#
# Завести пользователя, не заходя в интерфейс.
#
#   ./add-user.sh anatoliy "Анатолій Петренко" admin
#   ./add-user.sh i.koval "Ірина Коваль" manager
#
# Пароль генерируется случайный и печатается один раз — запишите его.
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

LOGIN="${1:-}"
NAME="${2:-}"
ROLE="${3:-manager}"

if [[ -z "$LOGIN" || -z "$NAME" ]]; then
  cat <<TXT
Использование:
  ./add-user.sh ЛОГИН "Имя Фамилия" [admin|manager]

Например:
  ./add-user.sh anatoliy "Анатолій Петренко" admin
TXT
  exit 1
fi

if [[ "$ROLE" != "admin" && "$ROLE" != "manager" ]]; then
  echo "Роль может быть admin или manager. Агентов заводят в разделе «Агенты»."
  exit 1
fi

PORT=$(grep -E '^HTTP_PORT=' .env | cut -d= -f2 | tr -d '[:space:]')
PORT="${PORT:-8081}"
BASE="http://127.0.0.1:${PORT}"

ADMIN_LOGIN=$(grep -E '^BOOTSTRAP_ADMIN_LOGIN=' .env | cut -d= -f2)
ADMIN_PASS=$(grep -E '^BOOTSTRAP_ADMIN_PASSWORD=' .env | cut -d= -f2)

# Пароль из криптографического генератора, а не из головы: пароли вида
# «qwerty123» живут годами и переживают всех, кто их придумал
PASSWORD=$(openssl rand -base64 12 | tr -d '/+=' | head -c 14)

JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT

echo "Вхожу под ${ADMIN_LOGIN}…"
if ! curl -fsS -c "$JAR" -H 'Content-Type: application/json' \
     -d "{\"login\":\"${ADMIN_LOGIN}\",\"password\":\"${ADMIN_PASS}\"}" \
     "${BASE}/api/auth/login" >/dev/null 2>&1; then
  echo "Не вышло войти под администратором."
  echo "Если вы уже сменили его пароль, заведите пользователя через интерфейс:"
  echo "  ${BASE}/app → Настройки → Пользователи и роли → Добавить"
  exit 1
fi

RESULT=$(curl -fsS -b "$JAR" -H 'Content-Type: application/json' \
  -d "{\"login\":\"${LOGIN}\",\"fullName\":\"${NAME}\",\"password\":\"${PASSWORD}\",\"role\":\"${ROLE}\",\"deliveryDiscountPercent\":0}" \
  "${BASE}/api/users" 2>&1) || {
    echo "Не удалось создать: ${RESULT}"
    exit 1
  }

cat <<TXT

────────────────────────────────────────────────────────────
Пользователь создан.

  Имя     ${NAME}
  Логин   ${LOGIN}
  Пароль  ${PASSWORD}
  Роль    ${ROLE}

Пароль показан один раз — запишите и передайте лично.
Пусть сменит его при первом входе: Настройки → Сменить пароль.
────────────────────────────────────────────────────────────
TXT
