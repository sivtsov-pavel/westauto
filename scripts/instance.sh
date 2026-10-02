#!/usr/bin/env bash
#
# Экземпляр системы для отдельного клиента.
#
# Один код — много экземпляров. У каждого клиента свои контейнеры, своя база
# и свой домен; обновление кода общее (git pull), данные не пересекаются
# физически, а не по правам доступа.
#
#   ./scripts/instance.sh new larus laruslogistics.seoshkin.tools 8092
#   ./scripts/instance.sh up larus
#   ./scripts/instance.sh logs larus
#   ./scripts/instance.sh down larus
#   ./scripts/instance.sh list
#
# Настройки экземпляра лежат в .env.<имя> рядом с проектом и в git не хранятся:
# там пароли базы и секрет подписи сессий.
#
# Скрипт идемпотентный: повторный `new` существующий .env не трогает — иначе
# при втором запуске сменился бы пароль базы, а данные остались бы зашифрованы
# старым, и экземпляр просто не поднялся бы.
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE_FILE="docker-compose.prod.yml"

usage() {
  cat <<'TXT'
Экземпляр системы для клиента.

  ./scripts/instance.sh new <имя> <домен> <порт> [профиль_бренда]
      Создать настройки нового экземпляра. Пароли генерируются сами.
      Профиль бренда по умолчанию совпадает с именем экземпляра.

  ./scripts/instance.sh up <имя>        поднять (собрать и запустить)
  ./scripts/instance.sh down <имя>      остановить
  ./scripts/instance.sh restart <имя>   перезапустить
  ./scripts/instance.sh logs <имя>      смотреть журнал
  ./scripts/instance.sh ps <имя>        состояние контейнеров
  ./scripts/instance.sh env <имя>       показать настройки (пароли скрыты)
  ./scripts/instance.sh list            все экземпляры на этой машине

  ./scripts/instance.sh user <имя> <логин> "Имя Фамилия" <admin|manager> [пароль]
      Завести пользователя в экземпляре. Без пароля — сгенерирует случайный
      и покажет один раз. Система потребует сменить его при первом входе.

Порт берётся из реестра экосистемы: seoshkin.tools/infra/ports.json,
диапазон docker_http 8080-8199. Записать туда новый порт — обязательно,
иначе следующий проект займёт тот же и отдаст чужой сайт.
TXT
}

env_file_for() { echo ".env.$1"; }

require_instance() {
  local name="${1:-}"
  [[ -n "$name" ]] || { echo "Укажите имя экземпляра."; usage; exit 1; }
  local file; file=$(env_file_for "$name")
  [[ -f "$file" ]] || {
    echo "Нет настроек экземпляра «${name}» (файл ${file})."
    echo "Создайте: ./scripts/instance.sh new ${name} <домен> <порт>"
    exit 1
  }
  echo "$file"
}

# Пароли из криптографического генератора, а не из головы: придуманные пароли
# живут годами и переживают всех, кто их придумал.
gen_secret() { openssl rand -hex 48; }
gen_password() { openssl rand -base64 18 | tr -d '/+=' | head -c 20; }

cmd_new() {
  local name="${1:-}" domain="${2:-}" port="${3:-}" brand="${4:-}"
  if [[ -z "$name" || -z "$domain" || -z "$port" ]]; then
    echo "Нужны имя, домен и порт."
    echo "Например: ./scripts/instance.sh new larus laruslogistics.seoshkin.tools 8092"
    exit 1
  fi
  brand="${brand:-$name}"

  local file; file=$(env_file_for "$name")
  if [[ -f "$file" ]]; then
    echo "Настройки экземпляра «${name}» уже есть (${file}) — не трогаю."
    echo "Пароль базы менять нельзя: данные останутся недоступны."
    exit 0
  fi

  # Имена контейнеров, тома и сеть разводятся по имени стека. Без этого второй
  # экземпляр подхватил бы тома первого и затёр его базу.
  cat > "$file" <<ENVFILE
# ─── Экземпляр «${name}» ─────────────────────────────────────────────────────
# Создан $(date +%Y-%m-%d). Домен: ${domain}
#
# Запуск:  ./scripts/instance.sh up ${name}
#
# ВНИМАНИЕ: здесь пароль базы и секрет подписи сессий. Файл в git не хранится
# (см. .gitignore) и в чат не пересылается.

STACK_NAME=${name}-prod
WEB_CONTAINER=${name}_web
NETWORK_NAME=${name}-net
HTTP_PORT=${port}
PUBLIC_HOST=${domain}

# Профиль бренда сайта: apps/site-westauto/src/content/brands/<профиль>.ts
BRAND_PROFILE=${brand}

# Демо-экземпляр закрыт от поисковиков целиком: в выдаче ему делать нечего,
# а чужой домен с теми же текстами навредил бы и клиенту, и нам.
SITE_NOINDEX=true

# ─── PostgreSQL ──────────────────────────────────────────────────────────────
POSTGRES_USER=${name}
POSTGRES_PASSWORD=$(gen_password)
POSTGRES_DB=${name}

# ─── API ─────────────────────────────────────────────────────────────────────
API_PORT=3000
NODE_ENV=production
JWT_SECRET=$(gen_secret)
SESSION_TTL_HOURS=12

# ─── Первый администратор (создаётся при первом старте, если база пустая) ────
BOOTSTRAP_ADMIN_LOGIN=admin
BOOTSTRAP_ADMIN_PASSWORD=$(gen_password)
BOOTSTRAP_ADMIN_NAME=Администратор

# ─── Растаможка ──────────────────────────────────────────────────────────────
# Пусто — калькулятор считает оценочной формулой и помечает результат оценкой
BAZA_GAI_API_KEY=
BAZA_GAI_BASE_URL=https://baza-gai.com.ua
BAZA_GAI_TIMEOUT_MS=8000

# ─── Курсы валют (НБУ, ключ не нужен) ────────────────────────────────────────
NBU_RATES_URL=https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json
FX_REFRESH_MINUTES=180

# ─── Парсер лотов Copart / IAAI ──────────────────────────────────────────────
LOT_FETCHER_ENABLED=true
LOT_FETCHER_TIMEOUT_MS=12000
ENVFILE

  chmod 600 "$file"

  cat <<TXT

────────────────────────────────────────────────────────────
Экземпляр «${name}» описан.

  Домен          ${domain}
  Порт на хосте  127.0.0.1:${port}
  Настройки      ${file}
  Профиль бренда ${brand}

Дальше:
  1. Записать порт ${port} в seoshkin.tools/infra/ports.json
  2. Добавить домен в infra/nginx/router/westauto.conf — сначала ТОЛЬКО
     HTTP-блок, иначе nginx не стартует без сертификата и уронит все сайты
  3. Выпустить сертификат (команда в шапке того же файла)
  4. ./scripts/instance.sh up ${name}

Пароль первого администратора лежит в ${file} — показать:
  ./scripts/instance.sh env ${name} --with-secrets
────────────────────────────────────────────────────────────
TXT
}

cmd_up() {
  local file; file=$(require_instance "${1:-}")
  echo "Поднимаю «${1}» (${file})…"
  docker compose --env-file "$file" -f "$COMPOSE_FILE" up -d --build
  echo
  docker compose --env-file "$file" -f "$COMPOSE_FILE" ps
}

cmd_simple() {
  local action="$1"; shift
  local file; file=$(require_instance "${1:-}")
  case "$action" in
    down)    docker compose --env-file "$file" -f "$COMPOSE_FILE" down ;;
    restart) docker compose --env-file "$file" -f "$COMPOSE_FILE" restart ;;
    logs)    docker compose --env-file "$file" -f "$COMPOSE_FILE" logs -f --tail=200 ;;
    ps)      docker compose --env-file "$file" -f "$COMPOSE_FILE" ps ;;
  esac
}

cmd_env() {
  local name="${1:-}"
  local file; file=$(require_instance "$name")
  if [[ "${2:-}" == "--with-secrets" ]]; then
    cat "$file"
  else
    # Пароли не печатаем: вывод команд уезжает в журналы и в переписку
    sed -E 's/^(POSTGRES_PASSWORD|JWT_SECRET|BOOTSTRAP_ADMIN_PASSWORD)=.*/\1=••••••• (--with-secrets чтобы показать)/' "$file"
  fi
}

cmd_user() {
  local name="${1:-}" login="${2:-}" full="${3:-}" role="${4:-manager}" password="${5:-}"
  local file; file=$(require_instance "$name")

  if [[ -z "$login" || -z "$full" ]]; then
    echo 'Нужны логин и имя: ./scripts/instance.sh user <экземпляр> <логин> "Имя Фамилия" [роль] [пароль]'
    exit 1
  fi
  if [[ "$role" != "admin" && "$role" != "manager" ]]; then
    echo "Роль может быть admin или manager. Агентов заводят в разделе «Агенты»."
    exit 1
  fi

  password="${password:-$(gen_password)}"

  local port admin_login admin_pass host
  port=$(grep -E '^HTTP_PORT=' "$file" | cut -d= -f2)
  admin_login=$(grep -E '^BOOTSTRAP_ADMIN_LOGIN=' "$file" | cut -d= -f2)
  admin_pass=$(grep -E '^BOOTSTRAP_ADMIN_PASSWORD=' "$file" | cut -d= -f2)
  host=$(grep -E '^PUBLIC_HOST=' "$file" | cut -d= -f2)

  local base="http://127.0.0.1:${port}"
  local jar; jar=$(mktemp)
  # shellcheck disable=SC2064
  trap "rm -f '$jar'" RETURN

  if ! curl -fsS -c "$jar" -H 'Content-Type: application/json' \
       -d "{\"login\":\"${admin_login}\",\"password\":\"${admin_pass}\"}" \
       "${base}/api/auth/login" >/dev/null 2>&1; then
    echo "Не вышло войти под ${admin_login} в экземпляре «${name}»."
    echo "Экземпляр запущен? ./scripts/instance.sh ps ${name}"
    echo "Если пароль первого администратора уже сменили — заводите через интерфейс:"
    echo "  https://${host}/app → Настройки → Пользователи и роли"
    exit 1
  fi

  local result
  result=$(curl -fsS -b "$jar" -H 'Content-Type: application/json' \
    -d "{\"login\":\"${login}\",\"fullName\":\"${full}\",\"password\":\"${password}\",\"role\":\"${role}\",\"deliveryDiscountPercent\":0}" \
    "${base}/api/users" 2>&1) || {
      echo "Не удалось создать: ${result}"
      exit 1
    }

  cat <<TXT

────────────────────────────────────────────────────────────
Пользователь заведён в экземпляре «${name}».

  Имя     ${full}
  Логин   ${login}
  Пароль  ${password}
  Роль    ${role}
  Вход    https://${host}/app

Пароль показан один раз. При первом входе система потребует его сменить
и до смены никуда не пустит — так и задумано.
────────────────────────────────────────────────────────────
TXT
}

cmd_list() {
  local found=no
  for file in .env.*; do
    [[ -f "$file" ]] || continue
    [[ "$file" == ".env.example" ]] && continue
    found=yes
    local name="${file#.env.}"
    local host port stack
    host=$(grep -E '^PUBLIC_HOST=' "$file" | cut -d= -f2)
    port=$(grep -E '^HTTP_PORT=' "$file" | cut -d= -f2)
    stack=$(grep -E '^STACK_NAME=' "$file" | cut -d= -f2)
    local state='остановлен'
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${name}_web$"; then
      state='работает'
    fi
    printf '  %-12s %-34s :%-6s %-16s %s\n' "$name" "$host" "$port" "$stack" "$state"
  done
  [[ "$found" == yes ]] || echo "  экземпляров нет"
}

case "${1:-}" in
  new)              shift; cmd_new "$@" ;;
  up)               shift; cmd_up "$@" ;;
  down|restart|logs|ps) action="$1"; shift; cmd_simple "$action" "$@" ;;
  env)              shift; cmd_env "$@" ;;
  user)             shift; cmd_user "$@" ;;
  list)             echo; cmd_list; echo ;;
  ''|-h|--help)     usage ;;
  *)                echo "Неизвестная команда: $1"; echo; usage; exit 1 ;;
esac
