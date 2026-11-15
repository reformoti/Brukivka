# HoMoW на бесплатной Oracle VM

Подготовлен перенос существующего Node/WebSocket-сервера на Linux VM. Новый хост пока не создан. Render больше не нужен для этого варианта; уже созданную тестовую базу Neon можно использовать повторно. Механики, протокол WebSocket, ассеты и локальный HTML не меняются.

## Аккаунт и VM

Пользователь самостоятельно регистрируется на https://www.oracle.com/cloud/free/ и проходит проверку личности/карты. Бесплатный тариф не является обещанием вечного uptime: Oracle может отозвать простаивающую VM; доступность ресурсов зависит от региона.

В консоли выбирать только **Always Free Eligible**: Ubuntu и `VM.Standard.A1.Flex`, суммарно не более 2 OCPU / 12 GB RAM и не более 200 GB Always Free block storage в домашнем регионе по текущим условиям. Минимальный boot volume около 47–50 GB достаточен для приложения. Временный trial-кредит не использовать для платных VM, дисков или других ресурсов. Параметры и отметку Free повторно проверить в консоли перед созданием.

## Запуск после получения VM

1. Установить Docker Engine + Compose plugin, Nginx и Git из официальных репозиториев для выбранного Ubuntu; Docker образ поддерживает AMD64 и ARM64 через официальный `node:24-bookworm-slim`.
2. Клонировать `https://github.com/reformoti/Brukivka` в `/var/www/brukivka`.
3. Скопировать `deploy/vps/.env.example` в `deploy/vps/.env`; задать строку **новой тестовой** Neon БД и реальный HTTPS `PUBLIC_ORIGIN`. Ограничить доступ к файлу: `chmod 600 deploy/vps/.env`. Секреты не отправлять в GitHub/переписку.
4. Из корня репозитория:
   ```sh
   docker compose -f deploy/vps/compose.yaml up -d --build
   docker compose -f deploy/vps/compose.yaml ps
   curl -f http://127.0.0.1:3000/health
   ```
5. Для публикации использовать `deploy/nginx/homow.conf.example`, заменив три HTML-location онлайн-блоком из `homow-online.locations.conf.example`. Указать действительные домен, TLS-сертификат и путь репозитория. Node доступен только на localhost:3000. В Oracle NSG/security list и firewall открыть 80/443; SSH ограничить доверенным IP. Порт 3000 наружу не открывать.
6. Выполнить `nginx -t`, затем reload Nginx. Проверить HTTPS, регистрацию тестового персонажа, вход, сохранение и восстановление после reload. Переключать Steam на фактический URL только после этой проверки. Не угадывать IP или домен заранее.

Для формирования предсжатых файлов на хосте без Node:
```sh
docker compose -f deploy/vps/compose.yaml run --rm --no-deps --user "$(id -u):$(id -g)" -v "$PWD:/transfer" -w /transfer game node scripts/precompress-homow.mjs
```
Это создаёт `.gz`/`.br` рядом с исходными публичными файлами. Их нужно обновлять при каждом релизе. Команда не выводит секреты.

## Обновление и проверка

```sh
git pull --ff-only
docker compose -f deploy/vps/compose.yaml up -d --build
docker compose -f deploy/vps/compose.yaml logs --tail=50 game
```

Сервер запускается от непривилегированного пользователя, получает SIGTERM напрямую через init и имеет 60 секунд на сохранение. Контейнер перезапускается после сбоя/перезагрузки VM; PostgreSQL-прогресс находится в Neon. Логи ограничены 3 файлами по 10 MB. Docker-сборка не включает `.env`, `.neon`, локальные зависимости или Git-метаданные.

В этой среде YAML разобран и команды/пути сверены с проектом. Docker-образ и реальная Oracle VM ещё не запущены; окончательная проверка выполняется после регистрации и создания VM.
