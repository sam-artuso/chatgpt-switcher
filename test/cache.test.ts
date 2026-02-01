/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { chromeMock } from "./setup";
import {
  loadFromCache,
  saveToCache,
  isChromeStorageAvailable,
  type CustomGPT,
  type CacheableGPT,
} from "../src/content";

describe("isChromeStorageAvailable", () => {
  it("should return true when chrome.storage.local is available", () => {
    expect(isChromeStorageAvailable()).toBe(true);
  });

  it("should return false when chrome is undefined", () => {
    const originalChrome = globalThis.chrome;
    // @ts-expect-error - intentionally setting to undefined for test
    globalThis.chrome = undefined;

    expect(isChromeStorageAvailable()).toBe(false);

    globalThis.chrome = originalChrome;
  });

  it("should return false when chrome.storage is undefined", () => {
    const originalChrome = globalThis.chrome;
    // @ts-expect-error - intentionally setting partial object for test
    globalThis.chrome = {};

    expect(isChromeStorageAvailable()).toBe(false);

    globalThis.chrome = originalChrome;
  });
});

describe("loadFromCache", () => {
  beforeEach(() => {
    chromeMock.storage.local._reset();
  });

  it("should return null when cache is empty", async () => {
    const result = await loadFromCache();
    expect(result).toBeNull();
  });

  it("should return cached GPTs", async () => {
    const cached: CacheableGPT[] = [{ name: "Test GPT", url: "/g/g-test", image: "test.png" }];
    await chromeMock.storage.local.set({ "chatgpt-switcher-gpts": cached });

    const result = await loadFromCache();
    expect(result).toEqual(cached);
  });

  it("should return multiple cached GPTs", async () => {
    const cached: CacheableGPT[] = [
      { name: "GPT One", url: "/g/g-one", image: "one.png" },
      { name: "GPT Two", url: "/g/g-two", image: null },
      { name: "GPT Three", url: "/g/g-three", image: "three.png" },
    ];
    await chromeMock.storage.local.set({ "chatgpt-switcher-gpts": cached });

    const result = await loadFromCache();
    expect(result).toHaveLength(3);
    expect(result).toEqual(cached);
  });

  it("should only return name, url, and image properties", async () => {
    const cached = [
      {
        name: "Test GPT",
        url: "/g/g-test",
        image: "test.png",
        extraProperty: "should be ignored",
      },
    ];
    await chromeMock.storage.local.set({ "chatgpt-switcher-gpts": cached });

    const result = await loadFromCache();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      name: "Test GPT",
      url: "/g/g-test",
      image: "test.png",
    });
  });

  it("should handle storage errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(chromeMock.storage.local, "get").mockRejectedValueOnce(new Error("Storage error"));

    const result = await loadFromCache();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("Failed to load GPTs from cache:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("should return null when chrome storage is not available", async () => {
    const originalChrome = globalThis.chrome;
    // @ts-expect-error - intentionally setting to undefined for test
    globalThis.chrome = undefined;

    const result = await loadFromCache();
    expect(result).toBeNull();

    globalThis.chrome = originalChrome;
  });
});

describe("saveToCache", () => {
  beforeEach(() => {
    chromeMock.storage.local._reset();
  });

  it("should save GPTs to storage", async () => {
    const gpts: CustomGPT[] = [{ name: "Test GPT", url: "/g/g-test", image: "test.png" }];
    await saveToCache(gpts);

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    expect(stored["chatgpt-switcher-gpts"]).toEqual([
      { name: "Test GPT", url: "/g/g-test", image: "test.png" },
    ]);
  });

  it("should not save DOM element references", async () => {
    const element = document.createElement("a");
    const gpts: CustomGPT[] = [{ name: "Test GPT", url: "/g/g-test", image: null, element }];
    await saveToCache(gpts);

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    const savedGpt = (stored["chatgpt-switcher-gpts"] as CacheableGPT[])[0];
    expect(savedGpt).not.toHaveProperty("element");
    expect(savedGpt).toEqual({
      name: "Test GPT",
      url: "/g/g-test",
      image: null,
    });
  });

  it("should save multiple GPTs", async () => {
    const gpts: CustomGPT[] = [
      { name: "GPT One", url: "/g/g-one", image: "one.png" },
      { name: "GPT Two", url: "/g/g-two" },
      { name: "GPT Three", url: "/g/g-three", image: null },
    ];
    await saveToCache(gpts);

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    expect(stored["chatgpt-switcher-gpts"]).toHaveLength(3);
  });

  it("should handle storage errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(chromeMock.storage.local, "set").mockRejectedValueOnce(new Error("Storage error"));

    await saveToCache([{ name: "Test", url: "/g/g-test" }]);
    expect(consoleSpy).toHaveBeenCalledWith("Failed to save GPTs to cache:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("should do nothing when chrome storage is not available", async () => {
    const originalChrome = globalThis.chrome;
    // @ts-expect-error - intentionally setting to undefined for test
    globalThis.chrome = undefined;

    // Should not throw
    await expect(saveToCache([])).resolves.not.toThrow();

    globalThis.chrome = originalChrome;
  });

  it("should save empty array", async () => {
    await saveToCache([]);

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    expect(stored["chatgpt-switcher-gpts"]).toEqual([]);
  });
});
