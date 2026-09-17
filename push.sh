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

# GitHub на `ssh -T` всегда отвечает кодом 1 («shell access denied»), даже когда
# ключ принят. С set -o pipefail это ломало проверку: успешная авторизация
# выглядела как отказ. Поэтому сначала забираем ответ, потом смотрим текст.
SSH_OUT=$(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1 || true)

if [[ "$SSH_OUT" != *"successfully authenticated"* ]]; then
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

# GitHub называет имя учётной записи в приветствии — сверяем с тем, что
# передали: опечатка в логине даёт невнятную ошибку при push
GH_USER=$(sed -n 's/^Hi \([^!]*\)!.*/\1/p' <<<"$SSH_OUT")
echo "Доступ есть. Учётная запись: ${GH_USER:-неизвестна}"

if [[ -n "$GH_USER" && "$GH_USER" != "$USER_NAME" ]]; then
  echo "  Внимание: вы указали «${USER_NAME}», а ключ принадлежит «${GH_USER}»."
  echo "  Использую ${GH_USER}."
  USER_NAME="$GH_USER"
  REMOTE="git@github.com:${USER_NAME}/${REPO}.git"
fi

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
