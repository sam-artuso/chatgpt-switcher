/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { chromeMock } from "./setup";
import {
  createAutocompleteMenu,
  showMenu,
  hideMenu,
  _resetForTesting,
  _setCustomGPTs,
  _setAutocompleteMenu,
  _setHasScrapedThisSession,
  _getSelectedIndex,
  _getCustomGPTs,
  _centerMenu,
  _handleResize,
  type CustomGPT,
} from "../src/content";

describe("hideMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
  });

  it("should add hidden class to menu", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    menu.menu.classList.remove("gpt-switcher-hidden");

    hideMenu();

    expect(menu.menu.classList.contains("gpt-switcher-hidden")).toBe(true);
  });

  it("should do nothing if autocompleteMenu is null", () => {
    _setAutocompleteMenu(null);
    expect(() => hideMenu()).not.toThrow();
  });

  it("should work when menu is already hidden", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    // Menu starts hidden by default

    hideMenu();

    expect(menu.menu.classList.contains("gpt-switcher-hidden")).toBe(true);
  });
});

describe("showMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
    chromeMock.storage.local._reset();
  });

  it("should remove hidden class from menu", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);

    await showMenu();

    expect(menu.menu.classList.contains("gpt-switcher-hidden")).toBe(false);
  });

  it("should do nothing if autocompleteMenu is null", async () => {
    _setAutocompleteMenu(null);
    await expect(showMenu()).resolves.not.toThrow();
  });

  it("should reset selectedIndex to 0", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([{ name: "Test", url: "/g/g-test" }]);

    await showMenu();

    expect(_getSelectedIndex()).toBe(0);
  });

  it("should clear input value", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    menu.input.value = "test search";

    await showMenu();

    expect(menu.input.value).toBe("");
  });

  it("should focus the input", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);

    await showMenu();

    expect(document.activeElement).toBe(menu.input);
  });

  it("should load from cache if no GPTs available", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([]);

    const cachedGPTs = [{ name: "Cached GPT", url: "/g/g-cached", image: null }];
    await chromeMock.storage.local.set({ "chatgpt-switcher-gpts": cachedGPTs });

    await showMenu();

    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(1);
    expect(gpts[0].name).toBe("Cached GPT");
  });

  it("should not load from cache if GPTs already available", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    const existingGPTs: CustomGPT[] = [{ name: "Existing GPT", url: "/g/g-existing" }];
    _setCustomGPTs(existingGPTs);

    const cachedGPTs = [{ name: "Cached GPT", url: "/g/g-cached", image: null }];
    await chromeMock.storage.local.set({ "chatgpt-switcher-gpts": cachedGPTs });

    await showMenu();

    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(1);
    expect(gpts[0].name).toBe("Existing GPT");
  });

  it("should try to scrape from page if not scraped this session", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setHasScrapedThisSession(false);

    // Add a GPT link to the DOM
    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    await showMenu();

    // The scraper should have found the GPT
    const gpts = _getCustomGPTs();
    expect(gpts.length).toBeGreaterThan(0);
  });

  it("should not scrape if already scraped this session", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setHasScrapedThisSession(true);
    const existingGPTs: CustomGPT[] = [{ name: "Existing GPT", url: "/g/g-existing" }];
    _setCustomGPTs(existingGPTs);

    // Add a different GPT link to the DOM
    const link = document.createElement("a");
    link.href = "/g/g-new";
    link.textContent = "New GPT";
    document.body.appendChild(link);

    await showMenu();

    // Should still have the existing GPT, not the new one
    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(1);
    expect(gpts[0].name).toBe("Existing GPT");
  });

  it("should set menu position", async () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);

    await showMenu();

    expect(menu.menu.style.top).toBe("20%");
    expect(menu.menu.style.left).toBeDefined();
  });
});

describe("centerMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
  });

  it("should do nothing if autocompleteMenu is null", () => {
    _setAutocompleteMenu(null);
    expect(() => _centerMenu()).not.toThrow();
  });

  it("should center menu horizontally based on window width", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);

    // Set a known width for the menu
    Object.defineProperty(menu.menu, "getBoundingClientRect", {
      value: () => ({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
    });

    // Mock window.innerWidth
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true });

    _centerMenu();

    // Expected left = (1000 - 400) / 2 = 300
    expect(menu.menu.style.left).toBe("300px");

    // Restore
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
  });

  it("should recalculate position when window width changes", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);

    Object.defineProperty(menu.menu, "getBoundingClientRect", {
      value: () => ({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
    });

    const originalInnerWidth = window.innerWidth;

    // First width
    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true });
    _centerMenu();
    expect(menu.menu.style.left).toBe("300px");

    // Resize to smaller width
    Object.defineProperty(window, "innerWidth", { value: 600, writable: true });
    _centerMenu();
    // Expected left = (600 - 400) / 2 = 100
    expect(menu.menu.style.left).toBe("100px");

    // Restore
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
  });
});

describe("handleResize", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
  });

  it("should do nothing if autocompleteMenu is null", () => {
    _setAutocompleteMenu(null);
    expect(() => _handleResize()).not.toThrow();
  });

  it("should not center menu if it is hidden", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    // Menu starts hidden by default

    const originalLeft = menu.menu.style.left;
    _handleResize();

    // Position should not change
    expect(menu.menu.style.left).toBe(originalLeft);
  });

  it("should center menu if it is visible", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    menu.menu.classList.remove("gpt-switcher-hidden");

    Object.defineProperty(menu.menu, "getBoundingClientRect", {
      value: () => ({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
    });

    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true });

    _handleResize();

    // Expected left = (800 - 400) / 2 = 200
    expect(menu.menu.style.left).toBe("200px");

    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
  });

  it("should update position when viewport is resized while menu is visible", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    menu.menu.classList.remove("gpt-switcher-hidden");

    Object.defineProperty(menu.menu, "getBoundingClientRect", {
      value: () => ({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
    });

    const originalInnerWidth = window.innerWidth;

    // Initial size
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    _handleResize();
    expect(menu.menu.style.left).toBe("400px");

    // Simulate viewport resize (e.g., DevTools opened)
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true });
    _handleResize();
    expect(menu.menu.style.left).toBe("200px");

    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
  });
});
