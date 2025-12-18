/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

let customGPTs = [];
let autocompleteMenu = null;
let selectedIndex = 0;

// Scrape custom GPTs from the page
function scrapeCustomGPTs() {
  const gpts = [];

  // Find all <a> elements with href starting with /g/g- (custom GPT links)
  // These are the custom GPT links in the sidebar
  const gptLinks = document.querySelectorAll('a[href^="/g/g-"]');

  gptLinks.forEach(link => {
    // Get the GPT name from the link's text content
    const name = link.textContent.trim();

    // Only add if we have a valid name
    if (name) {
      gpts.push({
        name: name,
        url: link.href,
        element: link  // Store reference to the actual DOM element
      });
    }
  });

  return gpts;
}

// Create autocomplete menu
function createAutocompleteMenu() {
  const menu = document.createElement('div');
  menu.id = 'gpt-switcher-menu';
  menu.className = 'gpt-switcher-hidden';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search custom GPTs...';
  input.className = 'gpt-switcher-input';

  const list = document.createElement('ul');
  list.className = 'gpt-switcher-list';

  menu.appendChild(input);
  menu.appendChild(list);
  document.body.appendChild(menu);

  return { menu, input, list };
}

// Fuzzy search scoring
function fuzzyScore(text, query) {
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
function updateGPTList(searchTerm = '') {
  const { list } = autocompleteMenu;
  list.innerHTML = '';

  const filtered = customGPTs
    .map(gpt => ({
      ...gpt,
      fuzzyResult: fuzzyScore(gpt.name, searchTerm)
    }))
    .filter(gpt => gpt.fuzzyResult.matches)
    .sort((a, b) => b.fuzzyResult.score - a.fuzzyResult.score);

  filtered.forEach((gpt, index) => {
    const li = document.createElement('li');
    li.textContent = gpt.name;
    li.className = 'gpt-switcher-item';
    if (index === selectedIndex) {
      li.classList.add('gpt-switcher-selected');
    }
    li.addEventListener('click', () => navigateToGPT(gpt));
    list.appendChild(li);
  });

  return filtered;
}

// Navigate to selected GPT
function navigateToGPT(gpt) {
  // Click the actual link element to use ChatGPT's SPA routing
  if (gpt.element) {
    gpt.element.click();
  } else {
    // Fallback to URL navigation if element not available
    window.location.href = gpt.url;
  }
}

// Show menu
function showMenu() {
  const { menu, input } = autocompleteMenu;

  // Scrape GPTs from the page before showing menu
  customGPTs = scrapeCustomGPTs();

  menu.classList.remove('gpt-switcher-hidden');

  // Center the menu
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  menu.style.top = '20%';

  selectedIndex = 0;
  input.value = '';
  updateGPTList();
  input.focus();
}

// Hide menu
function hideMenu() {
  const { menu } = autocompleteMenu;
  menu.classList.add('gpt-switcher-hidden');
}

// Initialize
function init() {
  autocompleteMenu = createAutocompleteMenu();
  const { menu, input, list } = autocompleteMenu;

  // Keyboard shortcuts
  const keyHandler = (e) => {
    // Ctrl+Shift+P or Cmd+Shift+P
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (menu.classList.contains('gpt-switcher-hidden')) {
        showMenu();
      } else {
        hideMenu();
      }
      return false;
    }

    // Escape to close
    if (e.key === 'Escape' && !menu.classList.contains('gpt-switcher-hidden')) {
      hideMenu();
    }
  };

  window.addEventListener('keydown', keyHandler, true);
  document.addEventListener('keydown', keyHandler, true);

  // Input handling
  input.addEventListener('input', (e) => {
    selectedIndex = 0;
    updateGPTList(e.target.value);
  });

  // Navigation
  input.addEventListener('keydown', (e) => {
    const filteredGPTs = customGPTs
      .map(gpt => ({
        ...gpt,
        fuzzyResult: fuzzyScore(gpt.name, input.value)
      }))
      .filter(gpt => gpt.fuzzyResult.matches)
      .sort((a, b) => b.fuzzyResult.score - a.fuzzyResult.score);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredGPTs.length;
      updateGPTList(input.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredGPTs.length) % filteredGPTs.length;
      updateGPTList(input.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredGPTs[selectedIndex]) {
        navigateToGPT(filteredGPTs[selectedIndex]);
      }
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !menu.classList.contains('gpt-switcher-hidden')) {
      hideMenu();
    }
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}