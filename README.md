# 💬 WhatsApp Web Export Viewer & Clone

> **A 100% private, client-side WhatsApp Web clone and archive viewer.**  
> Hostable as a static webpage on **GitHub Pages**, running entirely inside your browser with **zero backend servers and zero tracking**.

🌐 **Live Web Application:** [https://siddhu-123.github.io/whatsapp-clone/](https://siddhu-123.github.io/whatsapp-clone/)  
📁 **GitHub Repository:** [https://github.com/Siddhu-123/whatsapp-clone](https://github.com/Siddhu-123/whatsapp-clone)

---

## 📑 Table of Contents
1. [Companion Extension: Secret Password Generator](#-companion-extension-secret-password-generator)
2. [Why Use This App?](#-why-use-this-app)
3. [How to Export Your WhatsApp Chats](#-how-to-export-your-whatsapp-chats)
   - [Exporting on Android](#-exporting-on-android)
   - [Exporting on iPhone (iOS)](#-exporting-on-iphone-ios)
   - [Creating a Master Multi-Chat Archive (`whatsapp_exports.zip`)](#-creating-a-master-multi-chat-archive)
4. [How to Use the App](#-how-to-use-the-app)
5. [Key Features](#-key-features)
6. [Privacy & Cryptographic Security](#-privacy--cryptographic-security)
7. [Local Development & Deployment](#-local-development--deployment)

---

## 🔐 Companion Extension: Secret Password Generator

Enhance your security with the official companion **Secret Password Generator** Chrome extension!

Instead of saving passwords in vulnerable cloud vaults or reusing passwords across sites, this lightweight browser extension generates fixed, deterministic 12-character passwords on-the-fly using only your personal secret word.

* 🐱 **Zero Cloud / Zero Password Storage**: Neither your master secret nor your site passwords are ever saved anywhere. No databases to hack.
* 🛡️ **Cryptographic KDF**: Uses **PBKDF2 with 600,000 iterations** to derive secure, unguessable passwords locally in your browser.
* 🎭 **Crying Cat Masking**: Passwords are masked with crying cats by default so nobody can shoulder-surf your screen. Long-press to temporarily reveal.
* ⏱️ **Auto-Wipe Security**: Secrets clear from memory after 20 seconds, and copied passwords automatically clear from the clipboard.

### 📦 Get the Extension
* ⬇️ **Direct Extension Download**: [**Download `secret-password-generator.zip`**](https://siddhu-123.github.io/whatsapp-clone/secret-password-generator.zip)
* 💻 **Extension Source Code**: [**View on GitHub (`extension/`)**](https://github.com/Siddhu-123/whatsapp-clone/tree/main/extension)

#### 🛠️ How to Install in 30 Seconds (Chrome, Brave, Edge, Arc):
1. [Download `secret-password-generator.zip`](https://siddhu-123.github.io/whatsapp-clone/secret-password-generator.zip) and unzip/extract it on your computer.
2. In your browser address bar, open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on the **"Developer mode"** toggle in the top-right corner.
4. Click **"Load unpacked"** and select the unzipped extension folder.
5. Click the extension icon in your browser toolbar, enter your secret, and generate your WhatsApp clone password!

---

## 🌟 Why Use This App?

When you export chats from WhatsApp, WhatsApp gives you a plain text file (`_chat.txt`) along with unorganized media files (`.opus`, `.jpg`, `.mp4`). Reading raw text files is cumbersome and strips away the messaging experience.

This app rebuilds the **complete WhatsApp Web interface** directly from your exported zip file:
* 🟢 **Authentic Look & Feel**: Green outgoing bubbles, checkmarks, WhatsApp doodle wallpaper, and contact colors.
* 🎙️ **Voice Notes (.opus)**: Plays WhatsApp `.opus` voice recordings with live audio waveforms and 1x/1.5x/2x speed controls.
* 🖼️ **Media Lightbox**: Full-screen viewer for photos, stickers, and videos with zoom and download buttons.
* 🔍 **Global Media Search**: Search every document, photo, video, and audio file across all your chats simultaneously.
* 🔒 **100% Client-Side Privacy**: Zero data leaves your device. No cloud storage, no analytics, no server requests.

---

## 📱 How to Export Your WhatsApp Chats

WhatsApp allows you to export any one-on-one or group conversation.

### 🤖 Exporting on Android

1. Open **WhatsApp** on your Android phone.
2. Tap into the **chat** you want to export.
3. Tap the **three dots (⋮)** in the top-right corner $\rightarrow$ tap **More** $\rightarrow$ tap **Export chat**.
4. When asked, choose **"Include Media"** (to view photos, voice notes, and videos) or **"Without Media"** (text only).
5. In the sharing menu:
   - Choose **Save to Drive**, or email it to yourself, or tap your file manager to save the `.zip` file directly.
6. Transfer the `.zip` file to your computer.

---

### 🍏 Exporting on iPhone (iOS)

1. Open **WhatsApp** on your iPhone.
2. Tap into the **chat** you want to export.
3. Tap the **contact or group name** at the very top of the screen to open **Contact Info**.
4. Scroll to the bottom and tap **Export Chat**.
5. Select **"Attach Media"** (recommended for full photos, audio, and videos).
6. In the iOS Share Sheet, tap **"Save to Files"** $\rightarrow$ choose a folder on your iPhone or iCloud Drive.
7. Send or AirDrop the `.zip` file to your Mac or computer.

---

### 📦 Creating a Master Multi-Chat Archive

If you export multiple chats (e.g. 5, 20, or 60+ chats):
1. Create a new folder on your computer named `whatsapp_exports`.
2. Move all your individual chat `.zip` files (e.g. `WhatsApp Chat with Alex.zip`, `WhatsApp Chat with Team.zip`) into this folder.
3. Right-click the folder and choose **Compress / Zip**:
   - On Mac: Right-click $\rightarrow$ **Compress "whatsapp_exports"** (creates `whatsapp_exports.zip`).
   - On Windows: Right-click $\rightarrow$ **Send to $\rightarrow$ Compressed (zipped) folder**.
4. This app natively supports loading this master zip bundle and extracts all conversations automatically!

---

## 🚀 How to Use the App

### Step 1: Open the App
Open the static web app in any modern browser (Chrome, Edge, Arc, Brave, Safari, or Firefox):
👉 **[https://siddhu-123.github.io/whatsapp-clone/](https://siddhu-123.github.io/whatsapp-clone/)**

### Step 2: Connect Your Zip Archive
You have two easy ways to connect your archive:
* **Option A: Link Mac Zip File (Recommended on Mac/PC)**:
  - Click the green **"Link Mac Zip File"** button.
  - Select your `whatsapp_exports.zip` file.
  - *Advantage*: Uses the browser's File System Access API to remember your file. When you refresh or return later, you never have to re-upload!
* **Option B: Drag & Drop**:
  - Drag and drop any chat `.zip` file directly into the browser window.

### Step 3: Unlock Your Chats
1. **Password Authentication**:
   - Open your browser extension (e.g. your deterministic password generator) or enter your secure password.
   - Paste or type your password into the password field.
2. **Keep Signed In**:
   - Leave *"Keep me signed in on this Mac"* checked if you want your session to restore instantly on page reload.
3. Click **Unlock WhatsApp**.
   - Your chat history is decrypted and prepared in seconds.

### Step 4: Browse, Search & Play Media
* **Browse Chats**: Click any conversation in the left sidebar to view message history.
* **Play Voice Notes**: Click play on any green voice note bubble to stream `.opus` recordings with waveform playback.
* **View Full-Screen Photos**: Click on any photo or sticker to open the high-resolution lightbox viewer.
* **Jump to Message**: In the lightbox or media drawer, click **"Show in chat"** to jump directly to that exact message with a glowing highlight.

---

## ⚡ Key Features

### 🔍 Global File & Media Search
At the top of the sidebar, toggle to the **"Files & Media"** tab:
* **All-in-One File Index**: Searches every file, image, document, and audio note across all your exported chats.
* **Category Filters**: Instantly switch between **Photos**, **Videos**, **Voice Notes & Audio**, and **Documents**.
* **Direct Actions**:
  - **View / Play**: Open photos and videos in the lightbox.
  - **Show in Chat** (`MessageSquare` icon): Jumps straight into that conversation and highlights the message.
  - **Download** (`Download` icon): Extracts and downloads the file from your local archive.

### 💾 WhatsApp-Style Manage Storage
Click **Settings** (gear icon) $\rightarrow$ **Storage & Data**:
* **Visual Storage Progress Bar**: Color-coded visualization of chat text cache, media files, and browser quota.
* **Chat-Wise Storage Breakdown**:
  - Lists every chat sorted by storage footprint (heaviest chats first).
  - Displays message count, total media files, and individual counts for photos, videos, voice recordings, and documents.
  - In-storage search to filter chats by name.
  - One-click "Open Chat" button.

### 🎙️ Custom Voice Note Player (.opus)
* WhatsApp voice notes are encoded in the compact `.opus` format.
* The built-in audio player visualizes voice amplitudes, allows scrubbing through recordings, and supports **1x, 1.5x, and 2x** playback speeds.

### 📱 Multi-Device Responsive Design
* **Desktops & Laptops**: Two-column layout with sidebar and conversation panel.
* **Tablets (iPads, Android Tablets)**: Dynamic split view with responsive slide-over contact drawer.
* **Mobile Phones (iOS & Android)**:
  - Full mobile screen navigation with tap-to-open chats and top back arrow to return to list.
  - Full-screen slide-in contact drawer.
  - Uses modern `100dvh` dynamic viewport height and iPhone safe-area padding (`env(safe-area-inset-bottom)`) so browser address bars never hide controls.

---

## 🛡️ Privacy & Cryptographic Security

| Feature | How it Works |
| :--- | :--- |
| **Zero Server Network Requests** | The application is 100% client-side HTML, CSS, and TypeScript. No message data, contact names, or media ever leave your browser. |
| **AES-GCM 256-Bit Encryption** | Your unlock session is secured using PBKDF2 key derivation and AES-GCM 256 encryption via the native browser Web Crypto API. |
| **Local File System Access** | Media stays inside the `.zip` archive on your hard drive. Files are decompressed into temporary RAM memory only when opened, consuming zero extra disk space. |
| **Auto-Lock Screen** | Automatically locks the viewer after a configurable period of inactivity (1 min, 15 min, 1 hour, or on tab close). |

---

## 💻 Local Development & Deployment

### Running Locally
To run this application locally on your machine:

```bash
# 1. Clone the repository
git clone https://github.com/Siddhu-123/whatsapp-clone.git
cd whatsapp-clone

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
```
The optimized static build files will be created in the `dist/` directory.

### Deploying to GitHub Pages
This project contains an automated GitHub Actions deployment workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
1. Push any commits to the `main` branch:
   ```bash
   git push origin main
   ```
2. In your GitHub repository settings:
   - Go to **Settings** $\rightarrow$ **Pages**.
   - Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
3. Your site automatically updates at `https://<your-username>.github.io/<repo-name>/`.

---

## 📜 License
MIT License. Built for personal privacy and offline chat viewing.
