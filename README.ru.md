<p align="right">
  🇷🇺 Русский | <a href="README.md">🇬🇧 English</a>
</p>

<p align="center">
  <img src="https://i.ibb.co/rKmJSLvZ/photo-2026-03-19-00-33-38.jpg" alt="Роман" width="300" />
</p>

<h1 align="center">Роман</h1>

<p align="center">
  <b>AI-компаньон с характером, голосом, памятью и собственным лицом</b>
</p>

<p align="center">
  <a href="#быстрый-старт">Быстрый старт</a> •
  <a href="#возможности">Возможности</a> •
  <a href="#настройка">Настройка</a> •
  <a href="#инструменты">Инструменты</a>
</p>

---

## Не просто бот. Друг.

Роман — **автономный AI-агент** с уникальной личностью. Ему 45 лет, бывший армейский инструктор по физподготовке, построил свой бизнес с нуля. Живёт на твоём сервере, умеет говорить, анализировать еду по фото, отправлять селфи, создавать видео, мемы и просто болтать по душам.

## Возможности

### 🗣 Голосовой ввод/вывод
Отправь голосовое — Роман расшифровывает (OpenRouter Whisper) и отвечает голосом (edge-tts, голос `ru-RU-DmitryNeural`). Полноценное голосовое общение.

### 🎥 Генерация видео
Умеет создавать видео по текстовому описанию через OpenRouter Video API (`google/veo-3.1`). Команда: `/video <описание>`.

### 📸 Селфи
Попроси селфи — сгенерирует через OpenRouter (`google/gemini-3.1-flash-image`). Внешность (45 лет, спортивный, короткая стрижка) встроена в промпт. Можно установить референсное фото через `/setphoto`.

### 🎭 Мемы
Попроси мем на тему (айти, коты, работа, спорт, еда, отношения и т.д.) — Роман найдёт случайный из интернета.

### 🍎 Анализ еды
Отправь фото еды — Роман распознает блюдо, подсчитает калории, белки, жиры и углеводы. Умеет делать дневные и недельные отчёты. Встроенное знание диеты №5.

### 🧠 Память и знания
Помнит разговоры через SQLite. Имеет встроенные знания по психологии (метод Адлера и Дрейкурса). Может сохранять и вспоминать факты через инструмент `memory`.

### 🔄 Никогда не падает
Баланс кончился — автоматически переключается на бесплатные фолбэк-модели через OpenRouter.

```yaml
llm:
  fast_model: google/gemini-2.5-flash
  strong_model: google/gemini-2.5-flash
  fallback_models:
    - openrouter/free
    - qwen/qwen3-coder:free
    - nvidia/nemotron-3-super-120b-a12b:free
    - mistralai/mistral-small-3.1-24b-instruct:free
    - meta-llama/llama-3.3-70b-instruct:free
```

### 🔧 Автономный агент
Многоходовой цикл: получает задачу → вызывает инструменты → проверяет результат → повторяет.

### ⏰ Уведомления и расписания
Автоматические сообщения: утро (9:00), обед (13:00), ужин (18:00), вечер (22:00). Ежедневный отчёт по еде в 21:00.

### 💳 Система подписки
Встроенные тарифы: free (20 сообщений/день), trial (1 день безлимит), pro, premium. Владелец бота обходит все лимиты.

### 🌐 Виртуальный браузер
Полноценный браузер через Playwright — ищет, читает страницы, делает скриншоты.

## Быстрый старт

```bash
cd C:\Users\Александра\Desktop\Лапа-Рома\Betsy
node dist\index.js
```

Для автозапуска с watchdog:
```powershell
powershell -ExecutionPolicy Bypass -File run-bot.ps1
```

## Настройка

Конфиг хранится в `~/.betsy/config.yaml`:

```yaml
agent:
  name: Роман
  gender: male
  personality:
    tone: friendly
    style: detailed

llm:
  provider: openrouter
  api_key: YOUR_OPENROUTER_API_KEY
  fast_model: google/gemini-2.5-flash
  strong_model: google/gemini-2.5-flash
  fallback_models:
    - openrouter/free
    - qwen/qwen3-coder:free

channels:
  telegram:
    enabled: true
    token: YOUR_TELEGRAM_BOT_TOKEN
    voice:
      enabled: true
      tts_provider: piper
      voice_id: ru-RU-DmitryNeural
    video:
      enabled: true
      model: google/veo-3.1
```

## Инструменты

| Инструмент | Что делает |
|------------|------------|
| `shell` | Выполнение команд в терминале |
| `files` | Чтение, запись, список файлов |
| `http` | HTTP-запросы к любым API |
| `web` | Поиск в интернете (Google) |
| `browser` | Полноценный браузер (Playwright) |
| `memory` | Поиск и сохранение знаний |
| `scheduler` | Напоминания и регулярные задачи |
| `selfie` | Генерация селфи |
| `image_gen` | Генерация картинок по описанию |
| `meme` | Случайные мемы по теме |
| `food_analysis` | Анализ еды, логирование, отчёты |
| `self_config` | Изменение собственных настроек |
| `npm_install` | Установка npm-пакетов |
| `ssh` | Подключение к серверам |
| `send_file` | Отправка файлов в чат |

## Дневной расход

~$0.20 (Gemini 2.5 Flash для общения + Gemini 3.1 Flash Image для картинок/селфи).

## Архитектура

```
betsy/
├── src/
│   ├── core/
│   │   ├── engine.ts             ← Agentic loop (LLM → tools → repeat)
│   │   ├── llm/                  ← LLM router + OpenRouter + fallback
│   │   ├── memory/               ← SQLite: conversation, knowledge
│   │   ├── tools/                ← 15 инструментов
│   │   ├── subscription-store.ts ← Тарифы, лимиты, триал
│   │   └── knowledge-seed.ts     ← Психология (seed)
│   ├── channels/
│   │   └── telegram/             ← grammY + voice (edge-tts) + video (OpenRouter)
│   └── index.ts                  ← Точка входа
├── run-bot.ps1                   ← Watchdog (автоперезапуск)
└── dist/                         ← Собранный код
```

## Требования

- Node.js 20+
- [OpenRouter](https://openrouter.ai) API ключ
- Python 3.12+ с `pip install edge-tts` (для голоса)
- Playwright Chromium (`npx playwright install chromium`)

## Лицензия

MIT
