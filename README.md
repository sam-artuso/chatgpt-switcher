# ChatGPT Switcher

A minimal Chrome extension for quickly switching between custom GPTs on chatgpt.com using a keyboard shortcut.

## Installation

1. **Download the extension files** to a folder on your computer (all files should be in the same directory):
   - `manifest.json`
   - `content.js`
   - `styles.css`

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu � Extensions � Manage Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

## Usage

1. Visit [chatgpt.com](https://chatgpt.com)
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type to search or use arrow keys to navigate
4. Press `Enter` to switch to the selected GPT

### Keyboard Shortcuts

- `Ctrl+Shift+P` / `Cmd+Shift+P` - Open/close the switcher menu
- `�` / `�` - Navigate between GPTs
- `Enter` - Switch to selected GPT
- `Escape` - Close the menu

## Customization

To add your own custom GPTs, edit the `customGPTs` array in [content.js](content.js):

```javascript
const customGPTs = [
  { name: "GPT-4", url: "https://chatgpt.com/" },
  { name: "Your Custom GPT", url: "https://chatgpt.com/g/g-XXXXX-your-gpt" }
];
```

1. Find the URL of your custom GPT by visiting it on ChatGPT
2. Add a new entry with the name and URL
3. Save the file
4. Reload the extension on `chrome://extensions/`