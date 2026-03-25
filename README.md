# LumiThing

Your CarThing, reimagined.

## Features

- Desktop companion app with a guided installer
- Status bar with date and time (synced from your computer's clock)
- Spotify controls (play/pause, skip, volume)
- Customizable shortcuts to apps with Font Awesome icon picker
- Physical button shortcuts (assign apps to buttons 1–4)
- Album art background styles (full bleed or thumbnail)
- Audio visualizer and progress bar in the media player
- Sleep timer and screensaver support
- OTA updates via GitHub Releases
- Lock your computer directly from the CarThing menu

## Getting started

Linux, Windows, and Mac are all supported.

1. Download LumiThing from [Releases](../../releases/).
2. Open the downloaded file to install.
3. Open the LumiThing desktop companion and follow the instructions to set up your CarThing.

## Usage

### Client interface

Here you will see your current media player status, app shortcuts, and a visualizer. You can use the touch screen, or navigate using the physical buttons.

Pressing the **M button** (right-most button) opens the system menu where you can:
- Navigate to Settings
- Sleep the device
- Restore the device to original Spotify software
- Reboot the device
- Lock your computer

Double-tapping the M button will also lock your computer instantly.

Using the dial will:

- **Media widget**:
  - Click: Play/Pause playback
  - Scroll: Adjust volume

- **Shortcuts**:
  - Click: Execute highlighted shortcut
  - Scroll: Scroll between items

Pressing the **Back button** (below the dial) reveals the fullscreen media player with album art, a progress bar, elapsed/remaining time, and shuffle/repeat controls.

### Desktop companion

The home screen shows your CarThing's connection status and any notices (missing playback handler, available updates, etc.).

Updates are handled automatically — when a new version is available you'll see a Download button. Once downloaded, click Install to apply the update.

### Shortcuts Editor

Add and edit your application shortcuts. You can add up to 8 shortcuts and assign a Font Awesome icon or upload a custom image. Shortcuts can also be assigned to the physical preset buttons (1–4) on top of the CarThing.

### Settings

Adjust how the app behaves — launch on startup, minimize to tray, auto-install to CarThing, brightness, date/time format, album art background style, and more.

### Tray icon

LumiThing lives in your system tray. Right-click it to open or quit the app, or click it once to open.

## Credits

- **1Vortexx** — Primary LumiThing Developer ([itsvortexx.space](https://itsvortexx.space))
- **BluDood** — Developer and creator of [GlanceThing](https://github.com/BluDood/GlanceThing), LumiThing's base and inspiration

## Technologies

**Desktop Companion**
- Electron Vite toolkit
- TypeScript
- React TSX + React Router
- ws
- axios
- electron-updater

**Client**
- React + Vite
- TypeScript
