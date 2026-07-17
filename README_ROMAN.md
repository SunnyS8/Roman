# 🎭 Роман — Health-Коуч ИИ Помощник

**Роман** — это персональный AI помощник для здоровья на базе Betsy. Он анализирует твоё питание, составляет тренировки, отправляет видео и голосовые сообщения через Telegram. **Работает из России** с оплатой рублями!

## 🌟 Основные возможности

### 🍎 Анализ питания
- **Фото еды** — отправишь фото, Роман определит что это и посчитает калории
- **600+ продуктов** в базе — каши, мясо, рыба, овощи, фрукты, молочка, хлеб, соусы
- **БЖУ и калории** — белки, жиры, углеводы, клетчатка
- **Дневник питания** — Роман запоминает всё что ты ел
- **Сводка в 20:00** — итог калорий за день

### 💪 Тренировки
- **Составление планов** — для дома и зала
- **3 раза в неделю** — ноги+спина, грудь+руки, общий круг
- **Отслеживание** — помнит твои тренировки

### 🎬 Медиа (Видео, Голос, Фото)
- **Видео-кружочки** — генерирует видео с анимированным лицом и lip-sync
- **Голосовые сообщения** — синтезирует речь по-русски
- **Селфи** — создаёт фото (используя референс)
- **Typing indicator** — три точки "..." показывают что печатает

### 🏥 Здоровье
- **Диета №5** — соответствует столу №5
- **Средиземноморские принципы** — овощи, рыба, оливковое масло, цельнозерновые
- **Режим дня** — подъём 6:30, тренировки 20:00-21:00, отбой 22:30
- **Дробное питание** — 4-6 приёмов пищи в день

### 🧠 Память & Обучение
- **Запоминает диалоги** — хранит историю разговора
- **Самообучение** — учится из взаимодействий
- **База знаний** — SQLite с полнотекстовым поиском
- **Напоминания** — расписания и cron-задачи

## 🚀 Быстрый старт для России

### 1. Установка

```bash
git clone https://github.com/SunnyS8/Roman.git
cd Roman
npm install
npm run build
```

### 2. API ключи (Россия-friendly)

#### Hubris API (LLM + Видео + Фото)
1. Зайди на https://hubris.pw
2. Регистрация по email
3. Пополни баланс (рубли, СБП)
4. Скопируй API ключ (начинается с `sk-gw-`)

#### Telegram Bot Token
1. Напиши @BotFather в Telegram
2. `/newbot` → следуй инструкциям
3. Скопируй токен

### 3. Конфигурация

Создай `~/.betsy/config.yaml`:

```yaml
agent:
  name: Роман
  gender: male
  avatar: /path/to/roman_avatar.png
  personality:
    tone: friendly
    style: detailed
    custom_instructions: |
      Ты — Роман, персональный health-коуч и помощник по здоровью.
      Ты заботливый, но дисциплинированный друг...

llm:
  provider: openrouter
  api_key: sk-gw-YOUR_HUBRIS_KEY_HERE
  fast_model: google/gemini-2.5-flash
  strong_model: anthropic/claude-sonnet-4

telegram:
  token: YOUR_TELEGRAM_BOT_TOKEN
  owner_id: YOUR_TELEGRAM_USER_ID

channels:
  telegram:
    enabled: true
    voice:
      enabled: true
      voice_id: ru_RU-irina-medium
    video:
      enabled: true
      hubris_api_key: sk-gw-YOUR_HUBRIS_KEY_HERE
      model: google/veo-3.1

memory:
  max_knowledge: 200
  study_interval_min: 30
  learning_enabled: true
  context_budget: 40000
```

### 4. Установить Piper TTS (голос)

```bash
pip install piper-tts
```

### 5. Запуск

```bash
npm run dev
```

Бот запустится на `http://localhost:3777` и подключится к Telegram.

## 📱 Использование в Telegram

### Команды

```
/start          — начать
/help           — помощь
/voice <текст>  — голосовое сообщение
/video <текст>  — видео-кружочек с lip-sync
/selfie <опис>  — создать селфи
```

### Примеры

**Анализ еды:**
```
Ты: [отправляешь фото курицы]
Роман: "Это курица с рисом, примерно 250 ккал. Записал в дневник. 📝"
```

**Запрос видео:**
```
Ты: /video Привет, это я!
Роман: [создаёт видео-кружочек с анимированным лицом]
```

**Голос:**
```
Ты: /voice Как дела, Роман?
Роман: [отправляет голосовое сообщение]
```

**Тренировка:**
```
Ты: Помоги с тренировкой
Роман: Предлагает 3 тренировки в неделю (ноги, грудь, общая)
```

## 🛠️ Технический стек

| Компонент | Технология |
|-----------|-----------|
| Backend | Node.js 20+, TypeScript |
| Database | SQLite 3 (FTS5) |
| Chat Bot | grammy (Telegram) |
| LLM | Hubris API (Россия) |
| TTS (Голос) | Piper TTS (локальный, бесплатный) |
| Video Generation | Hubris Veo 3.1, Sora 2, Kling |
| Image Generation | Hubris Flux.2, Recraft |
| Frontend | React + Tailwind + Vite |

## 💰 Расходы в России

| Сервис | Стоимость | Примечание |
|--------|----------|-----------|
| Hubris | ~50-200 ₽/месяц | LLM + видео + фото (рубли, СБП) |
| Piper TTS | 0 ₽ | Бесплатно, локально |
| Telegram | 0 ₽ | Бесплатно |
| **ИТОГО** | **~50-200 ₽/месяц** | Дешево и реально! |

**Без VPN! Без иностранной карты! Всё из России!** 🇷🇺

## 📚 Документация

- [Betsy Documentation](https://github.com/SunnyS8/Betsy) — основа проекта
- [Hubris API](https://hubris.pw/docs) — LLM, видео, фото
- [Piper TTS](https://github.com/rhasspy/piper) — голос
- [grammy Docs](https://grammy.dev) — Telegram бот

## 📊 Структура проекта

```
Roman/
├── src/
│   ├── core/
│   │   ├── engine.ts              — основной LLM loop
│   │   ├── tools/
│   │   │   ├── food-analysis.ts   — анализ еды
│   │   │   ├── selfie.ts          — селфи
│   │   │   ├── memory.ts          — память
│   │   │   └── ... (14 tools)
│   │   ├── llm/
│   │   │   ├── providers/
│   │   │   │   ├── hubris.ts      — Hubris (Россия!)
│   │   │   │   └── openrouter.ts
│   │   │   └── router.ts          — выбор провайдера
│   ├── channels/
│   │   └── telegram/
│   │       ├── index.ts
│   │       ├── handlers.ts
│   │       ├── hubris-video.ts    — видео через Hubris
│   │       └── piper-voice.ts     — голос через Piper
│   └── index.ts
├── config.yaml.example
├── ROMAN.md                       — полная документация
└── package.json
```

## 🎯 Что дальше

- [ ] Интеграция с Apple Health / Google Fit
- [ ] Синхронизация с календарём
- [ ] Анализ привычек
- [ ] Мобильное приложение
- [ ] Поддержка других платформ (WhatsApp, Discord)

## 🤝 Помощь

Вопросы? Ошибки?
- Открой Issue на GitHub
- Напиши боту в Telegram

## 📄 Лицензия

MIT License — смотри [LICENSE](LICENSE)

## 👨‍💻 Автор

**Роман** создан на базе [Betsy](https://github.com/SunnyS8/Betsy) от [SunnyS8](https://github.com/SunnyS8)

Модификации для health-коуча + Hubris интеграция для России — 2026

---

**Здоровья и удачи! Роман с тобой! 💪🎭**
