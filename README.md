# ChatGPT Switcher

A minimal Chrome extension for quickly switching between custom GPTs on chatgpt.com using a keyboard shortcut.

## Preview

![ChatGPT Switcher in action](img/screenshot.png)

## Installation

1. **Clone or download this repository** to your computer

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → Extensions → Manage Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the `src` folder from this repository
   - The extension should now appear in your extensions list

## Usage

1. Visit [chatgpt.com](https://chatgpt.com) and log in
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type to fuzzy search your custom GPTs or use arrow keys to navigate
4. Press `Enter` to switch to the selected GPT

The extension automatically detects all your custom GPTs from the page - no manual configuration needed!

### Keyboard Shortcuts

- `Ctrl+Shift+P` / `Cmd+Shift+P` - Open/close the switcher menu
- `↑` / `↓` - Navigate between GPTs
- `Enter` - Switch to selected GPT
- `Escape` - Close the menu

### Features

- **Automatic GPT detection** - Scrapes your custom GPTs directly from the ChatGPT sidebar
- **Fuzzy search** - Type partial letters to quickly find GPTs (e.g., "fm" matches "Finance mentor")
- **SPA navigation** - Switches GPTs without page reloads for a smooth experience

## Development

### Building for Distribution

To create a zip file ready for Chrome Web Store submission:

```bash
./scripts/pack.sh
```

This will create `dist/chrome-extension.zip` containing all the extension files.