#!/usr/bin/env bash
#
# Обновить адрес репозитория после переименования на GitHub.
#
#   ./rename-remote.sh                 → westauto
#   ./rename-remote.sh новое-имя       → другое имя
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

REPO="${1:-westauto}"
USER_NAME=$(git remote get-url origin | sed -n 's#.*github.com[:/]\([^/]*\)/.*#\1#p')
REMOTE="git@github.com:${USER_NAME}/${REPO}.git"

echo "Было:  $(git remote get-url origin)"
echo "Стало: ${REMOTE}"

git remote set-url origin "$REMOTE"

# Проверяем, что новый адрес отвечает: git remote set-url ничего не
# проверяет, и опечатка всплыла бы только при следующем push
if git ls-remote --exit-code origin >/dev/null 2>&1; then
  echo "Связь есть — адрес обновлён."
else
  echo "Репозиторий по новому адресу не отвечает. Проверьте имя на GitHub."
  exit 1
fi
