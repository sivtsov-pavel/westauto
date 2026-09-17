# Перенос и доступы

## Кто где заходит

| Роль | Логин | Адрес | Что видит |
|---|---|---|---|
| **Администратор** | `admin` / `admin12345` | `/app` | Всё: тарифы, настройки, агенты, все расчёты и заявки |
| **Менеджер** | заводит админ | `/app` | Расчёты, история, витрина, тарифы (только смотрит) |
| **Агент** | заводит админ | `/app` | Свои клиенты, свои сделки, своё вознаграждение |
| **Клиент** | доступа нет | сайт | Цена по ссылке от менеджера, витрина, калькулятор |

**Смените пароль администратора** после первого входа — «Настройки» → «Сменить пароль».

## Адреса

| Адрес | Что там |
|---|---|
| `local.westauto.seoshkin.tools:8081` | Сайт WestAuto |
| `local.autokey.seoshkin.tools:8081` | Сайт АвтоКлюч |
| `ivan.westauto.seoshkin.tools:8081` | Сайт агента (тот же WestAuto + его карточка) |
| любой из них + `/app` | Общая CRM |

На сервере те же имена без `local.` и без порта.

---

## Перенос через git

### 1. Создайте репозиторий

На GitHub — **приватный**, без README и .gitignore (они уже есть).
Имя, например: `westauto`.

### 2. Добавьте SSH-ключ в GitHub

Ключ уже создан на этой машине. Откройте
**GitHub → Settings → SSH and GPG keys → New SSH key**, вставьте строку
из `~/.ssh/id_ed25519.pub` (её выводит команда `cat ~/.ssh/id_ed25519.pub`).

### 3. Отправьте код — **на этой машине (WSL)**

```bash
cd /var/www/westauto.com.ua
git remote add origin git@github.com:ВАШ_АККАУНТ/westauto.git
git push -u origin main
```

### 4. Макбук

```bash
git clone git@github.com:ВАШ_АККАУНТ/westauto.git
cd westauto
cp .env.example .env
docker compose up -d --build
```

Открывается на `http://localhost:8081`. Для красивых адресов — в `/etc/hosts`:

```
127.0.0.1 local.westauto.seoshkin.tools
127.0.0.1 local.autokey.seoshkin.tools
127.0.0.1 ivan.westauto.seoshkin.tools
```

### 5. Сервер

```bash
git clone git@github.com:ВАШ_АККАУНТ/westauto.git /var/www/westauto
cd /var/www/westauto
cp .env.example .env

openssl rand -hex 48          # → вставить в JWT_SECRET
nano .env                     # JWT_SECRET, POSTGRES_PASSWORD, пароль админа

docker compose -f docker-compose.prod.yml up -d --build
```

Обновление потом: `git pull && docker compose -f docker-compose.prod.yml up -d --build`

---

## Что проверить после переноса

1. **`/api/health`** отвечает `{"ok":true}`
2. **Вход** админом работает, пароль сменён
3. **Расчёт**: ставка 10000, год 2018, бензин 2.5 — итог появляется сразу
4. **Калькулятор на сайте** (секция «Калькулятор») считает и показывает цену
5. **Три языка**: `/`, `/ru`, `/en` — заголовок меняется
6. **Агент**: заведите тестового, войдите им — разделов «Тарифы» и
   «Настройки» в меню нет, в расчёте нет строки «Маржа»
7. **Заявка с сайта** появляется в «Клиенты» у админа

---

## DNS для боевого сервера

Записи A на IP сервера:

```
westauto.seoshkin.tools      → IP
autokey.seoshkin.tools       → IP
*.westauto.seoshkin.tools    → IP    ← важно: поддомены агентов
```

Без звёздочки под каждого агента придётся заводить запись вручную.

## HTTPS на сервере

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d westauto.seoshkin.tools -d autokey.seoshkin.tools
```

Дальше подключите `infra/nginx/prod-tls.conf` — инструкция внутри файла.

**Без HTTPS вход в проде не заработает**: кука сессии помечается `Secure`,
и браузер отдаёт её только по https. Выглядит как «залогинился и вылетел».

---

## Что НЕ попадает в git

`.env` с паролями, ключи TLS, `node_modules`, сборки и загруженные фото.

**База и фото** переносятся отдельно:

```bash
# база
docker compose exec -T db pg_dump -U avtoklyuch avtoklyuch | gzip > db.sql.gz
gunzip -c db.sql.gz | docker compose exec -T db psql -U avtoklyuch -d avtoklyuch

# фото витрины
docker run --rm -v avtoklyuch_uploads:/data -v $PWD:/out alpine \
  tar czf /out/uploads.tar.gz -C /data .
docker run --rm -v avtoklyuch_uploads:/data -v $PWD:/in alpine \
  tar xzf /in/uploads.tar.gz -C /data
```
