<p align="right">
  <a href="README.ru.md">🇷🇺 Русский</a> | 🇬🇧 English
</p>

<p align="center">
  <img src="https://i.ibb.co/rKmJSLvZ/photo-2026-03-19-00-33-38.jpg" alt="Roman" width="300" />
</p>

<h1 align="center">Roman</h1>

<p align="center">
  <b>AI companion with personality, voice, memory, and his own face</b>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#tools">Tools</a>
</p>

---

## Not just a bot. A companion.

Roman is an **autonomous AI agent** with a unique personality. He's a 45-year-old former military fitness instructor turned entrepreneur. He lives on your server, has his own voice, face, memory — and he gets things done on his own.

He can analyze your meals from photos, generate memes, send selfies, create videos, and just chat like a real friend.

## Features

### 🗣 Voice I/O
Send a voice message — Roman transcribes it (OpenRouter Whisper) and replies with a voice message (edge-tts, `ru-RU-DmitryNeural`). Full voice conversation loop.

### 🎥 Video generation
Roman can generate videos from text prompts via OpenRouter Video API (`google/veo-3.1`). Just say `/video <description>`.

### 📸 Selfies
Ask him to send a selfie — he generates one via OpenRouter (`google/gemini-3.1-flash-image`). Character appearance (45, athletic, short hair) is built into the prompt. Set a reference photo with `/setphoto` for more consistent results.

### 🎭 Memes
Ask for a meme by topic (IT, cats, work, sports, food, relationships, etc.) — Roman fetches a random one from the internet.

### 🍎 Food analysis
Send a photo of your meal — Roman recognizes the food, counts calories, proteins, fats, and carbs. Supports daily summaries and weekly reports. Built-in diet knowledge (Diet #5).

### 🧠 Memory & knowledge
Remembers conversations via SQLite. Has built-in psychology knowledge (Adler & Dreikurs methods). Can save/recall facts with the `memory` tool.

### 🔄 Never goes down
Balance ran out? Automatically switches to free fallback models via OpenRouter. Always available.

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

### 🔧 Autonomous agent
Multi-step agentic loop: gets a task → calls tools → checks results → repeats until done.

### ⏰ Notifications & schedules
Automated messages: morning (9:00), lunch (13:00), dinner (18:00), evening (22:00). Daily food report at 21:00.

### 💳 Subscription system
Built-in subscription tiers: free (20 msg/day), trial (1 day unlimited), pro, premium. Owner bypasses all limits.

### 🌐 Virtual browser
Full headless browser via Playwright — searches, reads pages, takes screenshots.

## Quick Start

```bash
cd C:\Users\Александра\Desktop\Лапа-Рома\Betsy
node dist\index.js
```

For watchdog autostart:
```powershell
powershell -ExecutionPolicy Bypass -File run-bot.ps1
```

## Configuration

Config is stored in `~/.betsy/config.yaml`:

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

## Tools

| Tool | What it does |
|------|-------------|
| `shell` | Execute terminal commands |
| `files` | Read, write, list files |
| `http` | HTTP requests to any API |
| `web` | Web search (Google) |
| `browser` | Full browser (Playwright) |
| `memory` | Search and save knowledge |
| `scheduler` | Reminders and recurring tasks |
| `selfie` | Generate selfies |
| `image_gen` | Generate images from prompts |
| `meme` | Fetch random memes by topic |
| `food_analysis` | Analyze meals, log food, reports |
| `self_config` | Modify own settings |
| `npm_install` | Install npm packages |
| `ssh` | Connect to servers |
| `send_file` | Send files to chat |

## Daily cost

~$0.20 (Gemini 2.5 Flash for chat + Gemini 3.1 Flash Image for selfies/images).

## Architecture

```
betsy/
├── src/
│   ├── core/
│   │   ├── engine.ts           ← Agentic loop (LLM → tools → repeat)
│   │   ├── llm/                ← LLM router + OpenRouter + fallback
│   │   ├── memory/             ← SQLite: conversations, knowledge
│   │   ├── tools/              ← 15 tools (meme, food, selfie, etc.)
│   │   ├── subscription-store.ts ← Tiers, daily limits, trial
│   │   └── knowledge-seed.ts   ← Psychology seed data
│   ├── channels/
│   │   └── telegram/           ← grammY + voice (edge-tts) + video (OR)
│   └── index.ts                ← Entry point
├── run-bot.ps1                 ← Watchdog (auto-restart)
└── dist/                       ← Built output
```

## Requirements

- Node.js 20+
- [OpenRouter](https://openrouter.ai) API key
- Python 3.12+ with `pip install edge-tts` (for voice)
- Playwright Chromium (`npx playwright install chromium`)

## License

MIT
