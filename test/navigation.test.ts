/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { chromeMock } from "./setup";
import {
  navigateToGPT,
  tryScrapeAndCache,
  createAutocompleteMenu,
  _resetForTesting,
  _setAutocompleteMenu,
  _setHasScrapedThisSession,
  _setObserver,
  _getHasScrapedThisSession,
  _getCustomGPTs,
  _getObserver,
  type CustomGPT,
} from "../src/content";

describe("navigateToGPT", () => {
  let originalLocation: Location;

  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();

    // Save original location
    originalLocation = window.location;

    // Mock window.location
    // @ts-expect-error - deleting window.location for mock
    delete window.location;
    window.location = {
      ...originalLocation,
      href: "",
      assign: vi.fn(),
      replace: vi.fn(),
    } as unknown as Location;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it("should click the element when available", () => {
    const element = document.createElement("a");
    const clickSpy = vi.spyOn(element, "click");

    const gpt: CustomGPT = {
      name: "Test GPT",
      url: "https://chatgpt.com/g/g-test",
      element,
    };

    navigateToGPT(gpt);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should fallback to window.location.href when element is not available", () => {
    const gpt: CustomGPT = {
      name: "Test GPT",
      url: "https://chatgpt.com/g/g-test",
    };

    navigateToGPT(gpt);
    expect(window.location.href).toBe("https://chatgpt.com/g/g-test");
  });

  it("should fallback when element is undefined", () => {
    const gpt: CustomGPT = {
      name: "Test GPT",
      url: "https://chatgpt.com/g/g-test",
      element: undefined,
    };

    navigateToGPT(gpt);
    expect(window.location.href).toBe("https://chatgpt.com/g/g-test");
  });
});

describe("tryScrapeAndCache", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
    chromeMock.storage.local._reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not scrape if already scraped this session", () => {
    _setHasScrapedThisSession(true);

    // Add a GPT link to the DOM
    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    // Should not have updated customGPTs
    expect(_getCustomGPTs()).toEqual([]);
  });

  it("should not update state if scrape returns empty array", () => {
    _setHasScrapedThisSession(false);

    // Empty DOM, no GPT links
    tryScrapeAndCache();

    expect(_getHasScrapedThisSession()).toBe(false);
    expect(_getCustomGPTs()).toEqual([]);
  });

  it("should update customGPTs when scrape succeeds", () => {
    _setHasScrapedThisSession(false);

    // Add a GPT link to the DOM
    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(1);
    expect(gpts[0].name).toBe("Test GPT");
  });

  it("should set hasScrapedThisSession to true when scrape succeeds", () => {
    _setHasScrapedThisSession(false);

    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    expect(_getHasScrapedThisSession()).toBe(true);
  });

  it("should save to cache when scrape succeeds", async () => {
    _setHasScrapedThisSession(false);

    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    // Wait for async saveToCache
    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    expect(stored["chatgpt-switcher-gpts"]).toBeDefined();
  });

  it("should disconnect observer after successful scrape", () => {
    const mockObserver = { disconnect: vi.fn() } as unknown as MutationObserver;
    _setObserver(mockObserver);
    _setHasScrapedThisSession(false);

    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    expect(mockObserver.disconnect).toHaveBeenCalled();
    expect(_getObserver()).toBeNull();
  });

  it("should not disconnect observer if scrape fails", () => {
    const mockObserver = { disconnect: vi.fn() } as unknown as MutationObserver;
    _setObserver(mockObserver);
    _setHasScrapedThisSession(false);

    // Empty DOM, no GPT links
    tryScrapeAndCache();

    expect(mockObserver.disconnect).not.toHaveBeenCalled();
    expect(_getObserver()).toBe(mockObserver);
  });

  it("should refresh menu if currently open", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    menu.menu.classList.remove("gpt-switcher-hidden"); // Menu is visible
    _setHasScrapedThisSession(false);

    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    // Menu list should have been updated
    expect(menu.list.children.length).toBe(1);
  });

  it("should not refresh menu if hidden", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    // Menu is hidden by default
    _setHasScrapedThisSession(false);

    const link = document.createElement("a");
    link.href = "/g/g-test";
    link.textContent = "Test GPT";
    document.body.appendChild(link);

    tryScrapeAndCache();

    // Menu list should still be empty (not refreshed)
    expect(menu.list.children.length).toBe(0);
  });

  it("should handle multiple GPT links", () => {
    _setHasScrapedThisSession(false);

    const link1 = document.createElement("a");
    link1.href = "/g/g-test1";
    link1.textContent = "Test GPT 1";
    document.body.appendChild(link1);

    const link2 = document.createElement("a");
    link2.href = "/g/g-test2";
    link2.textContent = "Test GPT 2";
    document.body.appendChild(link2);

    tryScrapeAndCache();

    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(2);
  });

  it("should filter out conversation links", () => {
    _setHasScrapedThisSession(false);

    const gptLink = document.createElement("a");
    gptLink.href = "/g/g-test";
    gptLink.textContent = "Test GPT";
    document.body.appendChild(gptLink);

    const convLink = document.createElement("a");
    convLink.href = "/g/g-test/c/123";
    convLink.textContent = "Conversation";
    document.body.appendChild(convLink);

    tryScrapeAndCache();

    const gpts = _getCustomGPTs();
    expect(gpts.length).toBe(1);
    expect(gpts[0].name).toBe("Test GPT");
  });
});
