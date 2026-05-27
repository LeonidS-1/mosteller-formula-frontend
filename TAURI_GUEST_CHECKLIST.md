# Tauri Guest LAN Checklist

Этот файл закрывает финальные шаги проверки гостевого Tauri-приложения.

## 1) LAN параметры (без localhost для API/медиа)

Приложение берет адреса из `VITE_*` переменных (см. `src/target_config.ts`):

- `VITE_LAN_IP` (например, `192.168.0.42`)
- `VITE_API_PORT` (например, `8080`)
- `VITE_MEDIA_PORT` (например, `9000`)
- `VITE_MEDIA_BUCKET` (например, `test`)
- `VITE_USE_DEV_PROXY`:
  - `true` -> фронт ходит на `/api` и `/minio/<bucket>` через Vite proxy
  - `false` -> фронт ходит напрямую на `http://<LAN_IP>:<port>`

Рекомендуемый пример:

```bash
export VITE_LAN_IP=192.168.0.42
export VITE_API_PORT=8080
export VITE_MEDIA_PORT=9000
export VITE_MEDIA_BUCKET=test
```

## 2) Команды проверки и запуска

Из директории `inv_frontend`:

```bash
npm run lint
npm run build
```

Запуск Tauri в dev (без proxy, сразу по LAN URL):

```bash
VITE_USE_DEV_PROXY=false npm run tauri dev
```

Сборка Tauri (также без proxy):

```bash
VITE_USE_DEV_PROXY=false npm run tauri build
```

Если команды `tauri` падают с ошибкой `cargo metadata ... No such file or directory`, нужно установить Rust toolchain (`cargo`) и инструменты платформы (на macOS: Xcode Command Line Tools).

## 3) Ожидаемые endpoint'ы в guest-сценарии

При `VITE_USE_DEV_PROXY=false`:

- API: `http://<VITE_LAN_IP>:<VITE_API_PORT>/api`
- Медиа (картинки/видео): `http://<VITE_LAN_IP>:<VITE_MEDIA_PORT>/<VITE_MEDIA_BUCKET>`

При `VITE_USE_DEV_PROXY=true` (обычный Vite dev):

- API запросы: `/api/*` -> `http://<VITE_LAN_IP>:<VITE_API_PORT>`
- Медиа: `/minio/<bucket>/*` -> `http://<VITE_LAN_IP>:<VITE_MEDIA_PORT>/<bucket>/*`

## 4) Чеклист демонстрации лабораторной

Проверить последовательно:

- [ ] Открывается страница каталога (`/`)
- [ ] Работает фильтрация по названию препарата в каталоге
- [ ] Переход в карточку препарата (`/drugs/:drugId`) работает
- [ ] Картинка/видео препарата загружаются с LAN адреса
- [ ] Переход в страницу рецепта (`/prescriptions/:prescriptionId`) работает
- [ ] В таблице рецепта изображения препаратов загружаются с LAN адреса
- [ ] Нет экранов входа/регистрации и нет UI редактирования (гостевой read-only режим)
- [ ] В запросах/конфигах нет fallback на `localhost` для API/медиа

## 5) Ручная проверка с другого устройства в LAN

- Устройство в той же сети (или подключено через ZeroTier).
- Проверить доступность backend и media по `http://<LAN_IP>:<port>`.
- Запустить `tauri dev` на хосте и пройти чеклист из раздела 4.
- Для демонстрации релизного режима дополнительно собрать `tauri build` и запустить собранный бинарник.
