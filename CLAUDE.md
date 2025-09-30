# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatGPT Switcher is a minimal Chrome extension (Manifest V3) that enables quick switching between custom GPTs on chatgpt.com via a keyboard shortcut. The extension runs a content script on all chatgpt.com pages that creates an autocomplete menu overlay.

## Architecture

- **manifest.json**: Chrome extension manifest (v3) defining content scripts that run on https://chatgpt.com/*
- **content.js**: Main logic injected into chatgpt.com pages. Creates autocomplete UI, handles keyboard events, and manages navigation
- **styles.css**: Styling for the autocomplete menu overlay with dark mode support

## Key Implementation Details

### Keyboard Event Handling
The extension uses `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) because ChatGPT intercepts `Cmd+Shift+K`. To capture events before ChatGPT's handlers:
- Uses capture phase (`addEventListener(..., true)`)
- Listens on both `window` and `document`
- Calls `e.stopImmediatePropagation()` to prevent ChatGPT from receiving the event

### GPT List
Currently hardcoded in the `customGPTs` array at the top of content.js. Format:
```javascript
{ name: "GPT Name", url: "https://chatgpt.com/g/g-XXXXX-gpt-name" }
```

## Testing Changes

1. Make code changes
2. Go to `chrome://extensions/`
3. Click the refresh icon on the ChatGPT Switcher card
4. Refresh chatgpt.com
5. Press `Cmd+Shift+P` / `Ctrl+Shift+P` to test

## Known Issues

- ChatGPT blocks certain keyboard shortcuts, requiring careful selection of key combinations
- Extension requires manual reload after code changes (standard Chrome extension behavior)