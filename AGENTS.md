# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

ChatGPT Switcher is a minimal Chrome extension (Manifest V3) that enables quick switching between custom GPTs on chatgpt.com via a keyboard shortcut. The extension runs a content script on all chatgpt.com pages that creates an autocomplete menu overlay.

## Architecture

Source files are located in the `src/` directory (TypeScript), static assets in `assets/`, and build output goes to `dist/build/`:

**Source (src/):**

- **src/manifest.json**: Chrome extension manifest (v3) defining content scripts that run on https://chatgpt.com/*
- **src/content.ts**: Main logic injected into chatgpt.com pages. Creates autocomplete UI, handles keyboard events, and manages navigation
- **src/options.ts**: Options page logic for cache clearing

**Assets (assets/):**

- **assets/css/styles.css**: Styling for the autocomplete menu overlay with dark mode support
- **assets/css/options.css**: Styling for the options page
- **assets/html/options.html**: Options page HTML
- **assets/icons/**: Extension icons in multiple sizes (16x16, 48x48, 128x128)
- **assets/img/**: Screenshots and images for documentation

## Key Implementation Details

### Keyboard Event Handling

The extension uses `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) because ChatGPT intercepts `Cmd+Shift+K`. To capture events before ChatGPT's handlers:

- Uses capture phase (`addEventListener(..., true)`)
- Listens on both `window` and `document`
- Calls `e.stopImmediatePropagation()` to prevent ChatGPT from receiving the event

### GPT List

The extension automatically detects custom GPTs by scraping the ChatGPT sidebar. GPTs are extracted from the page DOM and cached. The format is:

```typescript
{ name: "GPT Name", url: "https://chatgpt.com/g/g-XXXXX-gpt-name" }
```

**Note**: ChatGPT's DOM structure and URL patterns change over time. The scraper in `src/content.ts` (specifically `scrapeCustomGPTs()`) may need updates when:

- Custom GPT link selectors change (currently `a[href^="/g/g-"]`)
- URL patterns evolve (currently `/g/g-xxxxx-name`)
- Sidebar structure is redesigned

When the extension stops working, create a new test fixture with the current ChatGPT DOM and update the scraper accordingly.

## Development

### Building

```bash
pnpm build          # Compile TypeScript and copy assets to dist/build/
pnpm typecheck      # Type-check without emitting files
```

**Note**: The `dist/build/` directory is only used to test the Chrome extension locally by loading it as an unpacked extension in `chrome://extensions/`.

**DO NOT run `pnpm dev`**: The developer will handle running the Vite dev server with hot reload for development purposes. Agents should not start the dev server themselves.

### Publishing

When preparing the extension for publication on the Chrome Web Store:

1. Bump the version number in `manifest.json` using the provided scripts:

   ```bash
   ./scripts/bump-version.sh        # Bump patch version (default)
   ./scripts/bump-version.sh minor  # Bump minor version
   ./scripts/bump-version.sh major  # Bump major version
   ```

2. Build and package for distribution:

   ```bash
   pnpm build
   ./scripts/pack.sh
   ```

   This creates `dist/chrome-extension.zip` ready for Chrome Web Store submission.

**Note**: When publishing, the build in `dist/build/` is irrelevant to the final packaged extension in `dist/chrome-extension.zip`.

### Pre-commit Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for pre-commit hooks. After installing dependencies:

```bash
pnpm lefthook install
```

Pre-commit hooks automatically run:

- Type checking (`pnpm typecheck`)
- Linting (`pnpm lint`)
- Format checking (`pnpm format:check`)
- Tests (`pnpm test`)

### Git Remotes

This repository has two origins configured:

- **origin**: git@gitlab.com:kYuZz/chatgpt-switcher.git
- **github**: git@github.com:sam-artuso/chatgpt-switcher.git

**Whenever asked to push changes, push to both origins**:

```bash
git push origin
git push github
```

### Linting and Formatting

```bash
pnpm lint           # Run ESLint and Stylelint
pnpm lint:fix       # Auto-fix lint issues
pnpm format         # Format all files with Prettier
pnpm format:check   # Check formatting without writing
```

### Testing Changes

1. Run `pnpm build` to compile TypeScript
2. Go to `chrome://extensions/`
3. Click "Load unpacked" and select `dist/build/` (or refresh if already loaded)
4. Refresh chatgpt.com
5. Press `Cmd+Shift+P` / `Ctrl+Shift+P` to test

## Testing

### Test Fixtures and Snapshots

The project uses snapshot testing to verify that `scrapeCustomGPTs()` works correctly. Test fixtures are located in `test/fixtures/` with dated directories (e.g., `test/fixtures/2025-12-18/`).

Each fixture directory contains:

- **chatgpt.html**: Saved ChatGPT DOM (captured via DevTools "Copy outerHTML" from the `<html>` tag)
- **expected.json**: Array of custom GPTs that should be extracted from that HTML

### Generating expected.json Files

When asked to generate an `expected.json` file for a test fixture:

1. **Read the HTML snapshot** from `test/fixtures/YYYY-MM-DD/chatgpt.html`

2. **Extract custom GPT links** by finding all `<a>` elements with `href` starting with `/g/g-`:
   - Look for: `<a href="/g/g-...">GPT Name</a>`
   - Extract the GPT name from the link's text content
   - Extract the URL from the `href` attribute
   - **Note**: URL patterns may change as ChatGPT evolves. Use whatever format is present in the HTML snapshot.

3. **Filter out non-GPT links**:
   - Skip conversation links: URLs containing `/c/` (e.g., `/g/g-xxx/c/yyy`)
   - Skip project links: URLs containing `/project` (e.g., `/g/g-p-xxx/project`)
   - Skip duplicate GPTs (same URL appearing multiple times)

4. **Create JSON output** in this exact format:

   ```json
   [
     {
       "name": "GPT Name",
       "url": "/g/g-xxxxx-gpt-name"
     }
   ]
   ```

5. **Requirements**:
   - Array of objects with `name` and `url` properties
   - URLs must be relative (starting with `/g/g-`, not `https://chatgpt.com/g/g-`)
   - Preserve exact capitalization and special characters in GPT names (e.g., "LLM" not "llm", "&" not "and")
   - Only include unique GPT links (first occurrence)
   - Output should be formatted with 2-space indentation

6. **Write the file** to `test/fixtures/YYYY-MM-DD/expected.json`

The test suite automatically tests only the most recent fixture (determined by date in directory name).
