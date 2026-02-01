/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createAutocompleteMenu,
  updateGPTList,
  _resetForTesting,
  _setCustomGPTs,
  _setAutocompleteMenu,
  _setSelectedIndex,
  type CustomGPT,
} from "../src/content";

describe("createAutocompleteMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
  });

  it("should create menu element with correct ID", () => {
    const menu = createAutocompleteMenu();
    expect(menu.menu.id).toBe("gpt-switcher-menu");
  });

  it("should create menu with hidden class initially", () => {
    const menu = createAutocompleteMenu();
    expect(menu.menu.classList.contains("gpt-switcher-hidden")).toBe(true);
  });

  it("should create input with correct placeholder", () => {
    const menu = createAutocompleteMenu();
    expect(menu.input.placeholder).toBe("Search custom GPTs...");
  });

  it("should create input with correct class", () => {
    const menu = createAutocompleteMenu();
    expect(menu.input.className).toBe("gpt-switcher-input");
  });

  it("should create input with type text", () => {
    const menu = createAutocompleteMenu();
    expect(menu.input.type).toBe("text");
  });

  it("should create list with correct class", () => {
    const menu = createAutocompleteMenu();
    expect(menu.list.className).toBe("gpt-switcher-list");
  });

  it("should append menu to document body", () => {
    createAutocompleteMenu();
    expect(document.getElementById("gpt-switcher-menu")).not.toBeNull();
  });

  it("should have correct DOM structure (input before list)", () => {
    const menu = createAutocompleteMenu();
    const children = Array.from(menu.menu.children);
    expect(children[0]).toBe(menu.input);
    expect(children[1]).toBe(menu.list);
  });

  it("should return all three elements", () => {
    const menu = createAutocompleteMenu();
    expect(menu.menu).toBeInstanceOf(HTMLDivElement);
    expect(menu.input).toBeInstanceOf(HTMLInputElement);
    expect(menu.list).toBeInstanceOf(HTMLUListElement);
  });
});

describe("updateGPTList", () => {
  const mockGPTs: CustomGPT[] = [
    {
      name: "Finance mentor",
      url: "https://chatgpt.com/g/g-1",
      image: "img1.png",
    },
    { name: "Code mentor", url: "https://chatgpt.com/g/g-2", image: null },
    {
      name: "Career coach",
      url: "https://chatgpt.com/g/g-3",
      image: "img3.png",
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = "";
    _resetForTesting();
  });

  it("should return empty array if autocompleteMenu is null", () => {
    _setAutocompleteMenu(null);
    const result = updateGPTList();
    expect(result).toEqual([]);
  });

  it("should show loading state when no GPTs available", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([]);

    updateGPTList();

    const loadingItem = menu.list.querySelector(".gpt-switcher-loading");
    expect(loadingItem).not.toBeNull();
    expect(loadingItem?.textContent).toBe("Loading custom GPTs...");
  });

  it("should return empty array when no GPTs available", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([]);

    const result = updateGPTList();
    expect(result).toEqual([]);
  });

  it("should display all GPTs when search term is empty", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    const result = updateGPTList("");
    expect(result.length).toBe(3);
    expect(menu.list.children.length).toBe(3);
  });

  it("should filter GPTs by search term", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    const result = updateGPTList("mentor");
    expect(result.length).toBe(2);
    expect(result.map((g) => g.name)).toContain("Finance mentor");
    expect(result.map((g) => g.name)).toContain("Code mentor");
  });

  it("should sort results by fuzzy score (highest first)", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    const result = updateGPTList("fin");
    expect(result[0].name).toBe("Finance mentor");
  });

  it("should mark first item as selected by default", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);
    _setSelectedIndex(0);

    updateGPTList();

    const selected = menu.list.querySelector(".gpt-switcher-selected");
    expect(selected).not.toBeNull();
  });

  it("should mark item at selectedIndex as selected", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);
    _setSelectedIndex(1);

    updateGPTList();

    const items = menu.list.querySelectorAll(".gpt-switcher-item");
    expect(items[0].classList.contains("gpt-switcher-selected")).toBe(false);
    expect(items[1].classList.contains("gpt-switcher-selected")).toBe(true);
  });

  it("should create image element when GPT has image", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([mockGPTs[0]]); // Finance mentor has image

    updateGPTList();

    const img = menu.list.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.src).toContain("img1.png");
    expect(img?.className).toBe("gpt-switcher-image");
  });

  it("should not create image element when GPT has no image", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([mockGPTs[1]]); // Code mentor has no image

    updateGPTList();

    const img = menu.list.querySelector("img");
    expect(img).toBeNull();
  });

  it("should create name span with correct class", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([mockGPTs[0]]);

    updateGPTList();

    const nameSpan = menu.list.querySelector(".gpt-switcher-name");
    expect(nameSpan).not.toBeNull();
    expect(nameSpan?.textContent).toBe("Finance mentor");
  });

  it("should clear list before adding items", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    // First call
    updateGPTList();
    expect(menu.list.children.length).toBe(3);

    // Second call with filter
    updateGPTList("career");
    expect(menu.list.children.length).toBe(1);
  });

  it("should handle GPTs with null image", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([{ name: "Test GPT", url: "/g/g-test", image: null }]);

    updateGPTList();

    const items = menu.list.querySelectorAll(".gpt-switcher-item");
    expect(items.length).toBe(1);
    expect(items[0].querySelector("img")).toBeNull();
  });

  it("should handle GPTs with undefined image", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs([{ name: "Test GPT", url: "/g/g-test" }]);

    updateGPTList();

    const items = menu.list.querySelectorAll(".gpt-switcher-item");
    expect(items.length).toBe(1);
    expect(items[0].querySelector("img")).toBeNull();
  });

  it("should return empty array when no matches found", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    const result = updateGPTList("xyz");
    expect(result).toEqual([]);
    expect(menu.list.children.length).toBe(0);
  });

  it("should be case insensitive in search", () => {
    const menu = createAutocompleteMenu();
    _setAutocompleteMenu(menu);
    _setCustomGPTs(mockGPTs);

    const lowerResult = updateGPTList("finance");
    const upperResult = updateGPTList("FINANCE");

    expect(lowerResult.length).toBe(1);
    expect(upperResult.length).toBe(1);
  });
});
