#!/usr/bin/env bash
#
# Архив для переноса на сервер.
#
# В архив НЕ попадают: .env с секретами, приватный ключ TLS, node_modules,
# собранные файлы и история git. Всё это либо секретно, либо собирается
# на месте — тащить его через сеть незачем.
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

NAME="avtoklyuch-$(date +%Y%m%d-%H%M)"
OUT="../${NAME}.tar.gz"

echo "Собираю ${OUT}…"

tar czf "$OUT" \
  --transform "s,^\.,${NAME}," \
  --exclude='./node_modules' \
  --exclude='./**/node_modules' \
  --exclude='./.git' \
  --exclude='./**/dist' \
  --exclude='./**/dist-ssr' \
  --exclude='./.env' \
  --exclude='./infra/tls/*.key' \
  --exclude='./infra/tls/*.crt' \
  --exclude='./**/*.log' \
  --exclude='./pgdata' \
  .

SIZE=$(du -h "$OUT" | cut -f1)

cat <<TXT

Готово: $(cd .. && pwd)/${NAME}.tar.gz  (${SIZE})

Что внутри: исходники, миграции, конфиги Docker и nginx, .env.example.
Чего нет: секретов (.env), ключей TLS, node_modules, сборок.

На сервере:
  tar xzf ${NAME}.tar.gz && cd ${NAME}
  cp .env.example .env
  openssl rand -hex 48        # вставить в JWT_SECRET
  nano .env                   # JWT_SECRET, POSTGRES_PASSWORD, пароль админа
  docker compose -f docker-compose.prod.yml up -d --build
TXT
