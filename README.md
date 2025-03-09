# wbData

Задача решена с использованием шаблона: [btlz-wb-test](https://github.com/lucard17/btlz-wb-test)

## Настройка проекта

Для корректной работы перед сборкой в корень проекта (рядом с `package.json`) необходимо положить файл `.env`. Этот файл служит конфигурацией и содержит следующие ключи со значениями:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
WB_URL=https://common-api.wildberries.ru/api/v1/tariffs/box
WB_API_KEY=123123123
GOOGLE_API_KEYS={"type": "service_account","project_id": "123123","private_key_id": "123123","private_key": "-----BEGIN PRIVATE KEY----","client_email": "123@123","client_id": "123","auth_uri": "https://123.123/auth","token_uri": "https:/123.123/token","auth_provider_x509_cert_url": "https://123.123/certs","client_x509_cert_url": "https://123.123","universe_domain": "googleapis.com"}
GOOGLE_SHEETS_IDS=123,456
SCHEDULE={"getBoxTariffs": "0 * * * *"}
APP_PORT=5000
```


## Пояснение к ключам и их значениям
WB_URL: Ссылка на endpoint.

WB_API_KEY: API ключ для авторизации в endpoint.

GOOGLE_API_KEYS: JSON объект с ключами для доступа к Google Sheets. Необходимо подставить ваши ключи.

GOOGLE_SHEETS_IDS: ID таблиц. Если таблиц несколько, ID передаются через запятую (см. пример выше).

SCHEDULE: JSON объект, где ключи — названия задач (например, "getBoxTariffs"), а значения — строки в формате cron (например, "* * * * *"). Задачи хранятся в папке jobs/job-<название задачи>.js. В текущем примере расписание "0 * * * *" означает, что задача будет выполняться в 00 минут каждого часа (00:00, 01:00, 02:00 и т.д.).


## Безопасный доступ к значениям из .env
1. При старте проекта в базе данных создаётся таблица "boxes" (если она ранее не существовала). После этого выполняются миграции и добавляются seed-данные. В эту таблицу будет загружаться информация, полученная от WB API.

2. Если GOOGLE_API_KEYS отсутствует в .env или имеет некорректный JSON, значение будет равно undefined. Критической ошибки не будет, действие "Выгрузка данных из PG в Google Sheets" будет пропущено с сообщением в логе:
"Google Sheets API KEYS not specified in .env. Google Sheets upload skipped".

3. Если GOOGLE_SHEETS_IDS отсутствует в .env или имеет некорректное значение, оно будет равно [] (пустой массив). Критической ошибки не будет, действие "Выгрузка данных из PG в Google Sheets" будет пропущено с сообщением в логе:
"Google Sheets IDS not specified in .env. Google Sheets upload skipped".

4. Аналогичное поведение для WB_URL и WB_API_KEY. При их отсутствии они будут равны undefined. Критической ошибки не будет, действие "Получение информации от WB API по endpoint" будет пропущено с сообщением в логе:
"WB_URL or WB_API_KEY not specified in .env. Job skipped".

5. Если SCHEDULE отсутствует в .env или имеет некорректный JSON, значение будет равно {} (пустой объект). Это означает, что задач с расписанием не назначено.

6. Если при обращении к таблице в Google Sheets отсутствует лист "stocks_coefs", он будет создан автоматически. В логе будет сообщение об этом, и данные будут загружены в таблицу.


## Масштабирование
Для удобства масштабирования реализован следующий механизм:

* Папка jobs является глобальным хранилищем задач. Все файлы в этой папке должны начинаться с "job-".

* Для добавления новой задачи достаточно создать файл в папке jobs и добавить её в конфиг .env с указанием расписания.

* Задачи динамически импортируются и выполняются в соответствии с их расписанием.


