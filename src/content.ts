/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Type definitions
export interface CustomGPT {
  name: string;
  url: string;
  image?: string | null;
  element?: HTMLAnchorElement;
}

interface CacheableGPT {
  name: string;
  url: string;
  image?: string | null;
}

interface FuzzyResult {
  score: number;
  matches: boolean;
}

interface AutocompleteMenu {
  menu: HTMLDivElement;
  input: HTMLInputElement;
  list: HTMLUListElement;
}

// Module state
let customGPTs: CustomGPT[] = [];
let autocompleteMenu: AutocompleteMenu | null = null;
let selectedIndex = 0;
let observer: MutationObserver | null = null;
let hasScrapedThisSession = false;

// Cache key for localStorage
const CACHE_KEY = "chatgpt-switcher-gpts";

// Scrape custom GPTs from the page
export function scrapeCustomGPTs(): CustomGPT[] {
  const gpts: CustomGPT[] = [];
  const seenUrls = new Set<string>();

  // Find all <a> elements with href starting with /g/g- (custom GPT links)
  // These are the custom GPT links in the sidebar
  const gptLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="/g/g-"]');

  gptLinks.forEach((link) => {
    const href = link.getAttribute("href");

    // Filter out conversation links (/g/g-xxx/c/xxx) and project links (/g/g-p-xxx/project)
    // We only want direct GPT links
    if (!href || href.includes("/c/") || href.includes("/project")) {
      return;
    }

    // Deduplicate by URL (same GPT might appear multiple times)
    const fullUrl = link.href;
    if (seenUrls.has(fullUrl)) {
      return;
    }
    seenUrls.add(fullUrl);

    // Get the GPT name from the link's text content
    const name = link.textContent?.trim() ?? "";

    // Get the GPT image URL from the img element inside the link
    const img = link.querySelector("img");
    const imageUrl = img ? img.src : null;

    // Only add if we have a valid name
    if (name) {
      gpts.push({
        name: name,
        url: fullUrl,
        image: imageUrl,
        element: link, // Store reference to the actual DOM element
      });
    }
  });

  return gpts;
}

// Check if chrome storage API is available (not available in test environment)
function isChromeStorageAvailable(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local;
}

// Load GPTs from chrome.storage.local cache
async function loadFromCache(): Promise<CacheableGPT[] | null> {
  if (!isChromeStorageAvailable()) {
    return null;
  }
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cached = result[CACHE_KEY] as CacheableGPT[] | undefined;
    if (cached) {
      // Don't restore element references from cache, only name, url, and image
      return cached.map((gpt) => ({ name: gpt.name, url: gpt.url, image: gpt.image }));
    }
  } catch (e) {
    console.error("Failed to load GPTs from cache:", e);
  }
  return null;
}

// Save GPTs to chrome.storage.local cache
async function saveToCache(gpts: CustomGPT[]): Promise<void> {
  if (!isChromeStorageAvailable()) {
    return;
  }
  try {
    // Only save name, url, and image (don't save DOM element references)
    const cacheable: CacheableGPT[] = gpts.map((gpt) => ({
      name: gpt.name,
      url: gpt.url,
      image: gpt.image,
    }));
    await chrome.storage.local.set({ [CACHE_KEY]: cacheable });
  } catch (e) {
    console.error("Failed to save GPTs to cache:", e);
  }
}

// Try to scrape and update cache (called by MutationObserver)
function tryScrapeAndCache(): void {
  // Only scrape once per page load
  if (hasScrapedThisSession) {
    return;
  }

  const gpts = scrapeCustomGPTs();

  // Only consider it successful if we found at least one GPT
  // This guards against scraping too early when the list is empty
  if (gpts.length > 0) {
    customGPTs = gpts;
    saveToCache(gpts);
    hasScrapedThisSession = true;

    // Disconnect observer since we successfully scraped
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // If menu is currently open and showing loading state, refresh it
    if (autocompleteMenu && !autocompleteMenu.menu.classList.contains("gpt-switcher-hidden")) {
      updateGPTList(autocompleteMenu.input.value);
    }
  }
}

// Start watching for GPT links to appear in the DOM
function startObserver(): void {
  // Create MutationObserver to detect when GPT links are added to the page
  observer = new MutationObserver((mutations) => {
    // Check if any GPT links have been added
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        // Look for any nodes that match our GPT link selector
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const hasGPTLinks = element.querySelector?.('a[href^="/g/g-"]');
            if (
              hasGPTLinks ||
              (element.tagName === "A" && element.getAttribute("href")?.startsWith("/g/g-"))
            ) {
              tryScrapeAndCache();
              return;
            }
          }
        }
      }
    }
  });

  // Start observing the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also try to scrape immediately in case GPTs are already loaded
  tryScrapeAndCache();
}

// Create autocomplete menu
function createAutocompleteMenu(): AutocompleteMenu {
  const menu = document.createElement("div");
  menu.id = "gpt-switcher-menu";
  menu.className = "gpt-switcher-hidden";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Search custom GPTs...";
  input.className = "gpt-switcher-input";

  const list = document.createElement("ul");
  list.className = "gpt-switcher-list";

  menu.appendChild(input);
  menu.appendChild(list);
  document.body.appendChild(menu);

  return { menu, input, list };
}

// Fuzzy search scoring
export function fuzzyScore(text: string, query: string): FuzzyResult {
  if (!query) return { score: 1, matches: true };

  text = text.toLowerCase();
  query = query.toLowerCase();

  let score = 0;
  let textIndex = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      score += 1 + consecutiveMatches;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
    textIndex++;
  }

  // Return null if not all query characters were found
  if (queryIndex < query.length) {
    return { score: 0, matches: false };
  }

  return { score, matches: true };
}

// Filter and display GPTs
function updateGPTList(searchTerm = ""): CustomGPT[] {
  if (!autocompleteMenu) return [];

  const { list } = autocompleteMenu;
  list.innerHTML = "";

  // Show loading state if no GPTs are available yet
  if (customGPTs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Loading custom GPTs...";
    li.className = "gpt-switcher-item gpt-switcher-loading";
    list.appendChild(li);
    return [];
  }

  const filtered = customGPTs
    .map((gpt) => ({
      ...gpt,
      fuzzyResult: fuzzyScore(gpt.name, searchTerm),
    }))
    .filter((gpt) => gpt.fuzzyResult.matches)
    .sort((a, b) => b.fuzzyResult.score - a.fuzzyResult.score);

  filtered.forEach((gpt, index) => {
    const li = document.createElement("li");
    li.className = "gpt-switcher-item";

    // Create image element if image URL exists
    if (gpt.image) {
      const img = document.createElement("img");
      img.src = gpt.image;
      img.alt = "";
      img.className = "gpt-switcher-image";
      li.appendChild(img);
    }

    // Create text span for the name
    const nameSpan = document.createElement("span");
    nameSpan.className = "gpt-switcher-name";
    nameSpan.textContent = gpt.name;
    li.appendChild(nameSpan);

    if (index === selectedIndex) {
      li.classList.add("gpt-switcher-selected");
    }
    li.addEventListener("click", () => navigateToGPT(gpt));
    list.appendChild(li);
  });

  // Scroll selected item into view
  const selectedItem = list.querySelector(".gpt-switcher-selected");
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: "nearest" });
  }

  return filtered;
}

// Navigate to selected GPT
function navigateToGPT(gpt: CustomGPT): void {
  // Click the actual link element to use ChatGPT's SPA routing
  if (gpt.element) {
    gpt.element.click();
  } else {
    // Fallback to URL navigation if element not available
    window.location.href = gpt.url;
  }
}

// Show menu
async function showMenu(): Promise<void> {
  if (!autocompleteMenu) return;

  const { menu, input } = autocompleteMenu;

  // Load from cache if we don't have GPTs yet
  if (customGPTs.length === 0) {
    const cached = await loadFromCache();
    if (cached && cached.length > 0) {
      customGPTs = cached;
    }
  }

  // Try to scrape from the page if we haven't scraped this session
  if (!hasScrapedThisSession) {
    const liveGPTs = scrapeCustomGPTs();
    if (liveGPTs.length > 0) {
      customGPTs = liveGPTs;
      saveToCache(liveGPTs);
      hasScrapedThisSession = true;
      // Disconnect observer if still running
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  }

  menu.classList.remove("gpt-switcher-hidden");

  // Center the menu
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  menu.style.top = "20%";

  selectedIndex = 0;
  input.value = "";
  updateGPTList();
  input.focus();
}

// Hide menu
function hideMenu(): void {
  if (!autocompleteMenu) return;
  const { menu } = autocompleteMenu;
  menu.classList.add("gpt-switcher-hidden");
}

// Initialize
async function init(): Promise<void> {
  // Load from cache on startup
  const cached = await loadFromCache();
  if (cached && cached.length > 0) {
    customGPTs = cached;
  }

  // Start MutationObserver to detect when GPTs load
  startObserver();

  autocompleteMenu = createAutocompleteMenu();
  const { menu, input } = autocompleteMenu;

  // Keyboard shortcuts
  const keyHandler = (e: KeyboardEvent): void => {
    // Ctrl+Shift+P or Cmd+Shift+P
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (menu.classList.contains("gpt-switcher-hidden")) {
        showMenu();
      } else {
        hideMenu();
      }
      return;
    }

    // Escape to close
    if (e.key === "Escape" && !menu.classList.contains("gpt-switcher-hidden")) {
      hideMenu();
    }
  };

  window.addEventListener("keydown", keyHandler, true);
  document.addEventListener("keydown", keyHandler, true);

  // Input handling
  input.addEventListener("input", (e) => {
    selectedIndex = 0;
    updateGPTList((e.target as HTMLInputElement).value);
  });

  // Navigation
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    const filteredGPTs = customGPTs
      .map((gpt) => ({
        ...gpt,
        fuzzyResult: fuzzyScore(gpt.name, input.value),
      }))
      .filter((gpt) => gpt.fuzzyResult.matches)
      .sort((a, b) => b.fuzzyResult.score - a.fuzzyResult.score);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredGPTs.length;
      updateGPTList(input.value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredGPTs.length) % filteredGPTs.length;
      updateGPTList(input.value);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredGPTs[selectedIndex]) {
        navigateToGPT(filteredGPTs[selectedIndex]);
      }
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target as Node) && !menu.classList.contains("gpt-switcher-hidden")) {
      hideMenu();
    }
  });
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
