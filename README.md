# WhatsApp Web Export Viewer & Clone (Static GitHub Pages App)

A 100% client-side, zero-backend WhatsApp Web clone designed to run anywhere, including as a static website hosted on **GitHub Pages**.

Drop your WhatsApp chat export `.zip` files (including master archives like `whatsapp_exports.zip` containing 63+ nested chats or individual chat zips) and browse all your conversations, photos, videos, voice notes (`.opus`), stickers, and documents just like WhatsApp Web.

---

## 🔒 Security & Privacy Architecture

- **Zero Network Traffic**: No chat logs, contact names, or media ever leave your browser. Everything is processed locally in memory.
- **Mac Local Storage Auto-Login**: Using the browser's native **File System Access API**, you link your Mac's `whatsapp_exports.zip` once. When you return to the page, it automatically reconnects to your local file without needing to drag & drop again!
- **Extension Password Authentication**:
  - Open your **Secret Password Generator** Chrome extension in the browser toolbar.
  - Enter your secret to generate your 12-character password.
  - Paste it into WhatsApp Web to unlock your chats!
- **Strong Cryptography**: Password verification is secured with **AES-GCM 256-bit** encryption via the native browser Web Crypto API.

---

## 🚀 Quick Start (Local)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build production bundle**:
   ```bash
   npm run build
   ```
   The static distribution files are generated in `./dist`.

---

## 🌐 Deploying to GitHub Pages

### Method 1: Automatic Deployment (Recommended)
This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Initialize Git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: WhatsApp Web Clone"
   ```
2. Create a repository on GitHub and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
   - Your site will automatically build and publish to `https://<your-username>.github.io/<your-repo-name>/`!

---

## 💡 Key Features

- **WhatsApp Web Interface**:
  - Full desktop two-column layout + responsive mobile view.
  - WhatsApp doodle wallpaper background with custom dark/light theme.
  - Outgoing message bubbles in WhatsApp green (`#005c4b`) with double checkmarks (`✓✓`).
  - Incoming message bubbles with WhatsApp group sender color coding.
  - Date dividers ("Today", "Yesterday", "28 December 2024").
- **Full Media Rendering**:
  - **Voice Notes (`.opus`, `.m4a`)**: Custom WhatsApp voice note player with waveform visualization, playback scrubber, and 1x/1.5x/2x speed controls.
  - **Photos & Images**: Inline thumbnails with click-to-open full-screen Lightbox with zoom and download.
  - **Videos (`.mp4`)**: Inline playable video player.
  - **Stickers (`.webp`)**: Transparent borderless sticker display.
  - **Documents (`.pdf`, `.vcf`)**: File preview cards with download capability.
- **Search & Filters**:
  - Sidebar contact and message search.
  - In-chat search with match count and jump-to-match arrows.
- **Smart Identity Detection**:
  - Automatically identifies the account owner (`Balanagu Satya Siddhartha`) across chats.
  - Switch perspective anytime via Settings.
