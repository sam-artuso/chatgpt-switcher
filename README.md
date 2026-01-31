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

### Testing

The extension includes snapshot tests that verify the scraper works correctly against saved ChatGPT HTML:

```bash
pnpm install  # Install dependencies
pnpm test     # Run tests
```

Tests are located in `test/scraper.test.js` and use fixtures from `test/fixtures/`.

#### Creating new test snapshots

When ChatGPT updates their DOM structure or URL patterns, you'll need to create a new snapshot:

1. **Capture the DOM:**
   - Open ChatGPT in your browser and log in
   - Open DevTools (F12 or right-click → Inspect)
   - In the Elements tab, find the `<html>` tag at the very top
   - Right-click on `<html>` → Copy → Copy outerHTML

2. **Save the snapshot:**
   ```bash
   mkdir -p test/fixtures/YYYY-MM-DD
   # Paste the copied HTML into the file
   # (Use your editor or pbpaste > test/fixtures/YYYY-MM-DD/chatgpt.html)
   ```

3. **Create expected results:**
   - Use Claude Code to generate `test/fixtures/YYYY-MM-DD/expected.json`:
     ```
     Parse test/fixtures/YYYY-MM-DD/chatgpt.html and extract all custom GPT links.
     Create expected.json with an array of objects containing name and url for each GPT.
     ```
     The file `CLAUDE.md` contains instructions for Claude Code to carry out
     this task correctly.
   - Or create manually in the format:
   ```json
   [
     {"name": "GPT Name", "url": "/g/g-xxxxx-gpt-name"}
   ]
   ```
   - **Note**: URL patterns (currently `/g/g-...`) may change as ChatGPT evolves

4. **Run tests:**
   ```bash
   pnpm test
   ```

The test suite automatically tests the most recent fixture only (older fixtures are kept for historical reference). When you add a new dated directory with a later date, tests will automatically switch to using that one.

### Building for Distribution

Before building, bump the version number in `manifest.json` (the Chrome Web Store requires a new version for each submission):

```bash
./scripts/bump-version.sh        # Bump patch version (default)
./scripts/bump-version.sh minor  # Bump minor version
./scripts/bump-version.sh major  # Bump major version
```

Then create a zip file ready for Chrome Web Store submission:

```bash
./scripts/pack.sh
```

This will create `dist/chrome-extension.zip` containing all the extension files.

To publish it on the Chrome Web Store, head to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Todo

- [x] Ability to clear cache of the Chrome extension
- [ ] TypeScript + proper tooling
- [ ] Investigate Chrome extension hot reload
- [ ] Automate Chrome Web Store publishing
- [ ] Move autocomplete when viewport size changes
