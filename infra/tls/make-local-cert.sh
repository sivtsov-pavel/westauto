#!/usr/bin/env bash
#
# Самоподписанный сертификат для локального стенда.
#
# Нужен, чтобы проверять то, что на http не проверишь: установку PWA
# (браузеры требуют https везде, кроме localhost), secure-куки и поведение
# сайта под настоящей схемой. В боевом окружении вместо него — Let's Encrypt,
# см. infra/nginx/prod-tls.conf.
#
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT="$DIR/local.crt"
KEY="$DIR/local.key"

if [[ -f "$CERT" && -f "$KEY" ]]; then
  echo "Сертификат уже есть: $CERT"
  echo "Пересоздать — удалите local.crt и local.key и запустите скрипт снова."
  exit 0
fi

# SAN обязателен: браузеры давно не смотрят на CN
openssl req -x509 -nodes -newkey rsa:2048 \
  -days 825 \
  -keyout "$KEY" \
  -out "$CERT" \
  -subj "/C=UA/O=AvtoKlyuch Local/CN=local.westauto.com.ua" \
  -addext "subjectAltName=DNS:local.westauto.com.ua,DNS:westauto.localhost,DNS:localhost,IP:127.0.0.1"

chmod 600 "$KEY"

cat <<TXT

Готово.
  сертификат: $CERT
  ключ:       $KEY

Дальше:
  1. Включите TLS в стенде:
       docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d
  2. Откройте https://local.westauto.com.ua:8443
  3. Браузер предупредит о самоподписанном сертификате — это ожидаемо.
     Чтобы предупреждения не было, добавьте $CERT в доверенные корневые
     сертификаты системы.
TXT
