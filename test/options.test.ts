/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { chromeMock } from "./setup";

describe("options page", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="clear-cache">Clear Cache</button>
      <div id="status"></div>
    `;
    chromeMock.storage.local._reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("should clear cache when button is clicked", async () => {
    // Pre-populate cache
    await chromeMock.storage.local.set({
      "chatgpt-switcher-gpts": [{ name: "Test", url: "/g/g-test" }],
    });

    // Import options.ts to run the script
    await import("../src/options");

    // Click button
    const button = document.getElementById("clear-cache") as HTMLButtonElement;
    button.click();

    // Wait for async operation
    await vi.advanceTimersByTimeAsync(0);

    const stored = await chromeMock.storage.local.get("chatgpt-switcher-gpts");
    expect(stored["chatgpt-switcher-gpts"]).toBeUndefined();
  });

  it("should show status message after clearing cache", async () => {
    await import("../src/options");

    const button = document.getElementById("clear-cache") as HTMLButtonElement;
    const status = document.getElementById("status") as HTMLDivElement;

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(status.classList.contains("visible")).toBe(true);
  });

  it("should hide status message after 2 seconds", async () => {
    await import("../src/options");

    const button = document.getElementById("clear-cache") as HTMLButtonElement;
    const status = document.getElementById("status") as HTMLDivElement;

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(status.classList.contains("visible")).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);
    expect(status.classList.contains("visible")).toBe(false);
  });

  it("should do nothing if elements are missing", async () => {
    document.body.innerHTML = "";
    await expect(import("../src/options")).resolves.not.toThrow();
  });

  it("should do nothing if only button is missing", async () => {
    document.body.innerHTML = '<div id="status"></div>';
    await expect(import("../src/options")).resolves.not.toThrow();
  });

  it("should do nothing if only status is missing", async () => {
    document.body.innerHTML = '<button id="clear-cache">Clear Cache</button>';
    await expect(import("../src/options")).resolves.not.toThrow();
  });
});
