# NovaCV — AI-Powered Resume Builder

Create professional resumes with AI assistance. Free, privacy-first, no signup required.

NovaCV is a modern resume editor with real-time preview, 8 beautiful templates, AI-powered text polishing, and instant PDF export.

## Features

- 🎨 8 Professional Templates — Classic, Modern, Timeline, Minimalist, Elegant, Creative, Editorial, Left-Right
- 🤖 AI Text Polishing — Improve your writing with DeepSeek, OpenAI, Gemini, or Doubao
- 👁️ Real-time Preview — See changes instantly in a WYSIWYG editor
- 📄 PDF Export — Professional-quality PDF output
- 📥 Import from PDF — AI extracts structured data from any resume PDF
- 🌍 i18n — English and Chinese support
- 🌙 Dark Mode — Easy on the eyes
- 💾 Local Storage — Your data stays on your device
- 📱 Responsive — Works on desktop and mobile

## Quick Start

```bash
# Clone the repo
git clone https://github.com/nova-hermes/novacv.git
cd novacv

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Docker

```bash
docker-compose up -d
```

Access at `http://localhost:3000`

## Deployment

### Cloudflare Workers
```bash
pnpm build
npx wrangler deploy
```

### Vercel
Connect your GitHub repo and deploy automatically.

## Tech Stack

- **Framework:** TanStack Start (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **Editor:** Tiptap v3
- **State:** Zustand
- **Animations:** Framer Motion
- **AI:** OpenAI-compatible APIs, Google Gemini

## Pricing

NovaCV offers a free tier with core features and a Pro plan for power users.

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Resumes | 1 | Unlimited |
| Templates | 3 basic | All 8+ |
| AI Polish | ❌ | ✅ |
| PDF Export | Watermark | Clean |
| JSON/Markdown | ✅ | ✅ |

## License

Based on [magic-resume](https://github.com/JOYCEQL/magic-resume) (Apache 2.0).
Forked and enhanced by NovaCV.
