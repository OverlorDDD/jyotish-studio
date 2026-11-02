# R4.2 — Відновлення production, цілісність Git і жива статистика адміністратора

Дата: 2026-11-02. Гілка: `fix/r42-deploy-integrity-admin-realtime-20261102`; базовий підтверджений власником коміт: `f3e27d74eb5bdb14b1938472f1409eeae540b817`.

## Підтверджений інцидент

- AWS `git rev-parse HEAD` показував правильний коміт після fast-forward.
- `tools/r42-growth.test.mjs` прочитав старий `apps/web/app/layout.tsx` без `GrowthConsent`, старі `galaxy-round-v4` і `robots.index:false`; у GitHub `HEAD` файл правильний. Власник вручну відновив його через `git show HEAD:path`, і всі 7 тестів пройшли.
- Наступний крок `pretest:r32:seo` викликав генератор брендових іконок і впав на **відсутньому `apps/web/app/icon.svg`**, хоча файл існує в `HEAD`.
- Це невідповідність робочого каталогу та Git index/tree; стан `assume-unchanged` / `skip-worktree`, sparse/старі локальні файли можливі, але першопричину прапорців на AWS **не доведено**, поки не перевірено `git ls-files -v`. Не потрібно робити `git reset --hard` і видаляти `.env`.

## Виправлено в коді

- `tools/source-integrity-repair.mjs` порівнює SHA-1 blob **всіх tracked-файлів** із `git ls-tree HEAD`; це працює навіть якщо звичайний `git status` приховує зміни. `--repair` зберігає передзмінені файли в `~/.galaxiora-source-recovery/<timestamp>-<sha>/` **поза репозиторієм**, знімає Git прапорці, відновлює оригінальні Git blobs і повторно перевіряє. Жодних змін untracked файлів (насамперед `.env`).
- `tools/source-integrity-repair.test.mjs` моделює **саме цей клас збою** в незалежному тимчасовому Git-репозиторії: прихований змінений `layout.tsx`, пропущений `icon.svg`, нетронутий untracked `.env`.
- `tools/r42-admin-integrity-release.sh`: один сценарій `source repair → all tests → icons → production build → GA4 bundle doctor → restart BOTH galaxiora-api & galaxiora-web → readiness → site:check → launch:verify → r32:seo:audit → r4:search:audit → guest-denied admin API check`. На відміну від попередніх версій, **NestJS API теж перезапускається**, бо додається захищений endpoint.
- Без міграцій PostgreSQL, DNS чи змін астрономічних обчислень.

## Що вже працює в адміністраторі

`GET /api/v1/admin/overview` викликає `requireAdmin`, читає count/groupBy/aggregate безпосередньо через Prisma/PostgreSQL: користувачів, нові реєстрації (7 днів), збережені карти, успішні розклади Таро, замовлення, підписки, використання AI, редакційні записи. UI (`AdminDashboard.tsx`) виконує `cache:'no-store'` і оновлює приблизно кожні 60 секунд та при фокусі. **Це реальні показники акаунтів**, а не відвідування всіх гостей.

## Нова статистика GA4 Realtime

- `GET /api/v1/admin/traffic/realtime` перевіряє наявну роль `ADMIN` **до** будь-якого виклику Google. `Cache-Control: private,no-store`. Для гостей має бути HTTP 401.
- Серверний `apps/api/src/admin-ga4-realtime.ts` використовує OAuth 2.0 service account, scope `analytics.readonly` і Google Analytics Data API `v1beta/properties/{numericPropertyId}:runRealtimeReport`, metric `activeUsers`, за замовчуванням останні 30 хв. HTTP-запити лише на константні Google URL, credentials не виходять у фронтенд. Токен кешується в API-процесі; звіт кешується до 30 секунд. Жодних email, IP, birth dates, chart або Tarot questions у payload.
- Admin UI показує `activeUsers30m` **окремо** від зареєстрованих користувачів, з часом відповіді. Стан `not_configured` чи `unavailable` — не 0.
- Поточний GA4 Measurement ID `G-SZDVCT8TF4` — **це не Property ID для Data API**. Потрібні цифровий ID ресурсу та серверні облікові дані з правом читання, налаштовані власником. Не додавати ключі в GitHub, браузерний `NEXT_PUBLIC_`, повідомлення чату чи файл `public/`.

## Активація Google Analytics Data API (після безпечного релізу)

1. У GA4 **Адміністратор → Дані ресурсу / Property Settings** знайти **Property ID** — цифрове значення, НЕ `G-...`.
2. Власник створює або вибирає власний Google Cloud Project, вмикає **Google Analytics Data API** (не Ads API).
3. Створити service account із мінімальними правами в цьому Cloud Project. Якщо необхідний ключ JSON, завантажити його **лише на приватний сервер**, каталог `/opt/galaxiora/secrets/` (режим 700), файл JSON (600), доступний користувачу служби API; не комітити і не розкривати в чаті.
4. У GA4 **Адміністратор → Керування доступом до ресурсу** додати email service account із роллю **Viewer** (тільки читання). Доступ в Google Cloud IAM сам по собі не гарантує GA4-доступу.
5. У кореневий AWS `.env`:
   ```dotenv
   GA4_PROPERTY_ID=123456789
   GA4_SERVICE_ACCOUNT_KEY_FILE=/opt/galaxiora/secrets/ga4-reader.json
   ```
   Це приклад, замінити номер своїм. **Не додавати `NEXT_PUBLIC_` для цих змінних.**
6. Перезапустити **лише** `galaxiora-api` для серверних ключів. Відкрити `/uk/admin` як власник-ADMIN. Показник «активні за 30 хвилин» оновиться; якщо в GA4 нікого немає/немає consent, **0 може бути реальним**.
7. Перевірити, що для гостя `/api/v1/admin/traffic/realtime` повертає 401. Якщо недоступний Google, UI показує «недоступно», інші PostgreSQL показники залишаються працездатними.

Офіційна документація: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart ; https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport ; https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics ; https://support.google.com/analytics/answer/9271392

## Чого не слід очікувати

- Без цифрового Property ID і наданого service-account доступу кнопка «Realtime» на нашій адмінпанелі **не може отримувати чужі GA4 дані з браузерного Measurement ID**. Стан «не налаштовано» правильний.
- GA4 збирає тільки допустимі вимірювання, обмежені згодою, блокуваннями й обробкою Google; його активні відвідувачі не тотожні реальній кількості підключень до сервера. Результати можуть відрізнятися.
- Наші підтверджені цифри зареєстрованих акаунтів у PostgreSQL — окремий ряд, доступний без Cloud інтеграції.
- Це **операційний і продуктовий** реліз, а не спосіб примусово підняти Google-рейтинг або виправити AI Overview.

## Приймання релізу

GitHub CI: `npm run test:source:integrity`, `npm run test:admin:realtime`, існуючі R3/R4.2 тести, production API+web build, Chromium і SEO gates PASS. AWS:

```bash
cd /opt/galaxiora/app
git fetch origin fix/r42-deploy-integrity-admin-realtime-20261102
git merge-base --is-ancestor HEAD FETCH_HEAD
git merge --ff-only FETCH_HEAD
bash tools/r42-admin-integrity-release.sh
```

Завершення: `SOURCE_TREE_INTEGRITY_OK`, `WEB_AND_API_STARTED_OK`, `ADMIN_TRAFFIC_GUEST_DENIED_401`, `DEPLOYED_SHA=<новий SHA>`, `R42_ADMIN_GROWTH_PRODUCTION_VERIFIED`. Тільки після цього вважаємо нову версію встановленою. Якщо скрипт зупинився, резервні копії не стираються, не запускати reset/hard.
