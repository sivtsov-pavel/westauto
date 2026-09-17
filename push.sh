#!/usr/bin/env bash
#
# Отправка проекта на GitHub.
#
#   ./push.sh ВАШ_ЛОГИН            → git@github.com:ВАШ_ЛОГИН/westauto.git
#   ./push.sh ВАШ_ЛОГИН имя-репо   → другое имя репозитория
#
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

USER_NAME="${1:-}"
REPO="${2:-westauto}"

if [[ -z "$USER_NAME" ]]; then
  echo "Укажите логин GitHub:  ./push.sh ВАШ_ЛОГИН"
  exit 1
fi

REMOTE="git@github.com:${USER_NAME}/${REPO}.git"

echo "Проверяю доступ к GitHub…"
if ! ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  cat <<TXT

GitHub пока не знает вашего ключа. Добавьте его:

  1. Откройте  https://github.com/settings/ssh/new
  2. Title — любой, например «WSL laptop»
  3. Key — вставьте строку целиком:

$(cat ~/.ssh/id_ed25519.pub)

  4. Save и запустите этот скрипт снова.

TXT
  exit 1
fi

echo "Доступ есть."

# Повторный запуск не должен падать на уже настроенном remote
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

echo "Отправляю в ${REMOTE}…"
git push -u origin main

cat <<TXT

────────────────────────────────────────────────────────────
Готово. Репозиторий: https://github.com/${USER_NAME}/${REPO}

На маке:

  git clone ${REMOTE}
  cd ${REPO}
  ./start.sh

Дальше обновляться: git pull && ./start.sh
────────────────────────────────────────────────────────────
TXT
