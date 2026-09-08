# 🐱 Desktop Cat (with Inactivity Screamer Meme)

A lightweight, native macOS desktop companion that puts a sharp, dapper black cat in a yellow tie right on the bottom-right corner of your screen—with **zero external installations or dependencies**.

If you step away from your desk and leave your keyboard/mouse idle for **10 seconds**, the corner cat transforms in-place into the viral **screaming cat meme** with full audio. The moment you touch or move your mouse, it instantly silences and switches back to the peaceful sitting business cat!

---

## ✨ Features

- **100% Zero-Install Native Mac App**:
  - Runs directly on macOS Cocoa (`AppKit`) and WebKit.
  - Zero npm packages, zero external downloads, zero terminal dependencies.
- **In-Place Bottom-Right Corner Swap**:
  - The screaming cat is confined strictly to the bottom-right corner window.
  - Leaves the rest of your screen 100% open and visible so you can continue working on other apps uninterrupted.
- **Instant Mouse-Move Shutoff**:
  - Checks for motion every 0.2 seconds.
  - Moving the mouse by even 1 pixel or pressing any key immediately stops the video and silences the audio.
- **10-Second Inactivity Trigger**:
  - Automatically triggers if you leave your mouse and keyboard untouched for 10 seconds.
- **Offline Local Video Playback**:
  - Bundles the screaming cat MP4 video locally—works completely offline without internet or YouTube.
- **Draggable & Transparent**:
  - Pure transparent background (no boxes or borders).
  - Click and drag the cat to reposition him anywhere on your screen.
- **Quick Menu Controls**:
  - Right-click directly on the cat or click the **🐱** icon in your macOS Menu Bar.
  - Instant screamer test button (`⚡ Test Screamer`).
  - Size adjustments (Medium, Large, Giant).
  - Click-through mode toggle.
  - Snap back to bottom-right corner.

---

## 🚀 How to Run

1. Double-click **`Launch Desktop Cat.command`**, or
2. Run `./start.sh` in the terminal:
   ```bash
   ./start.sh
   ```

---

## 📁 Project Structure

```
├── Desktop Cat.app/             # Standalone macOS Application Bundle
│   └── Contents/
│       ├── Info.plist
│       ├── MacOS/Desktop Cat    # App launcher
│       └── Resources/
│           ├── AppIcon.icns     # Native icon
│           ├── cat.png          # Business cat image
│           ├── desktop_cat.js   # Native Cocoa / WebKit controller
│           └── video_base64.txt # Embedded offline screaming cat video
├── Launch Desktop Cat.command   # Double-clickable launcher for macOS Finder
├── start.sh                     # Terminal launcher script
└── assets/                      # Raw image & video assets
```

---

## 🔒 Privacy

- **No Camera Used**: Inactivity is detected strictly through local macOS input idle checks.
- **100% Offline**: No network calls, telemetry, or third-party connections.
