#!/usr/bin/env bash
#
# Запуск проекта на новой машине.
#
#   ./start.sh          — стенд для разработки (по умолчанию)
#   ./start.sh prod     — боевой режим
#
# Скрипт делает всё, что можно сделать без пароля: создаёт .env, генерирует
# секреты, поднимает контейнеры и проверяет, что всё ответило. Записи в
# /etc/hosts требуют sudo — их команду он выведет отдельно, вводить решаете вы.
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"
[[ "$MODE" == "prod" ]] && COMPOSE_FILE="docker-compose.prod.yml"

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

# ─── Проверка окружения ──────────────────────────────────────────────────────

say "Проверяю окружение"

if ! command -v docker >/dev/null 2>&1; then
  echo "  Docker не найден."
  echo "  macOS:  скачайте Docker Desktop — https://docker.com/products/docker-desktop"
  echo "  Debian: curl -fsSL https://get.docker.com | sudo sh"
  exit 1
fi
ok "docker $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"

if ! docker info >/dev/null 2>&1; then
  echo "  Docker установлен, но не запущен. Откройте Docker Desktop и повторите."
  exit 1
fi
ok "docker запущен"

# ─── Настройки ───────────────────────────────────────────────────────────────

say "Настройки"

if [[ ! -f .env ]]; then
  cp .env.example .env
  ok ".env создан из шаблона"

  # Секреты генерируем сразу: .env из шаблона содержит заглушки, с которыми
  # в бою работать нельзя, а забыть их поменять — легче лёгкого
  JWT=$(openssl rand -hex 48)
  DBPASS=$(openssl rand -hex 16)

  # sed на macOS и Linux ведёт себя по-разному — пишем через временный файл
  python3 - "$JWT" "$DBPASS" <<'PY'
import sys, pathlib
jwt, dbpass = sys.argv[1], sys.argv[2]
p = pathlib.Path('.env')
s = p.read_text()
s = s.replace('JWT_SECRET=dev_only_insecure_secret_replace_me_with_openssl_rand_hex_48',
              f'JWT_SECRET={jwt}')
s = s.replace('POSTGRES_PASSWORD=change_me_in_production', f'POSTGRES_PASSWORD={dbpass}')
s = s.replace('postgres://avtoklyuch:change_me_in_production@db:5432/avtoklyuch',
              f'postgres://avtoklyuch:{dbpass}@db:5432/avtoklyuch')
p.write_text(s)
PY
  ok "секреты сгенерированы"

  if [[ "$MODE" == "prod" ]]; then
    warn "смените BOOTSTRAP_ADMIN_PASSWORD в .env перед первым входом"
  fi
else
  ok ".env уже есть — не трогаю"
fi

PORT=$(grep -E '^HTTP_PORT=' .env | cut -d= -f2 | tr -d '[:space:]')
PORT="${PORT:-8081}"

# ─── Запуск ──────────────────────────────────────────────────────────────────

say "Поднимаю контейнеры (первый раз — несколько минут)"
docker compose -f "$COMPOSE_FILE" up -d --build

say "Жду, пока сервисы ответят"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/api/health" 2>/dev/null; then
    ok "API отвечает"
    break
  fi
  [[ $i -eq 60 ]] && { warn "API не ответил за минуту — смотрите: docker compose logs api"; exit 1; }
  sleep 1
done

for path in "/" "/app/"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${path}" || echo 000)
  [[ "$code" == "200" ]] && ok "${path} отвечает" || warn "${path} вернул ${code}"
done

# ─── Что дальше ──────────────────────────────────────────────────────────────

ADMIN_LOGIN=$(grep -E '^BOOTSTRAP_ADMIN_LOGIN=' .env | cut -d= -f2)
ADMIN_PASS=$(grep -E '^BOOTSTRAP_ADMIN_PASSWORD=' .env | cut -d= -f2)

cat <<TXT

────────────────────────────────────────────────────────────
Готово.

  Сайт WestAuto     http://localhost:${PORT}
  Приложение        http://localhost:${PORT}/app
  Вход              ${ADMIN_LOGIN} / ${ADMIN_PASS}

Смените пароль сразу после входа: Настройки → Сменить пароль.

Чтобы открывались красивые адреса, добавьте строки в /etc/hosts
(потребуется пароль вашей учётной записи):

  sudo tee -a /etc/hosts <<'HOSTS'
127.0.0.1 local.westauto.seoshkin.tools
127.0.0.1 local.autokey.seoshkin.tools
127.0.0.1 ivan.westauto.seoshkin.tools
HOSTS

После этого:

  WestAuto          http://local.westauto.seoshkin.tools:${PORT}
  АвтоКлюч          http://local.autokey.seoshkin.tools:${PORT}
  Сайт агента       http://ivan.westauto.seoshkin.tools:${PORT}

Полезное:
  docker compose logs -f api     логи
  docker compose down            остановить
  git pull && ./start.sh         обновить до свежей версии
────────────────────────────────────────────────────────────
TXT
