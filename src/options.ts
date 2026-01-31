/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

const CACHE_KEY = "chatgpt-switcher-gpts";

const clearCacheButton = document.getElementById("clear-cache");
const statusElement = document.getElementById("status");

if (clearCacheButton && statusElement) {
  clearCacheButton.addEventListener("click", async () => {
    await chrome.storage.local.remove(CACHE_KEY);

    statusElement.classList.add("visible");

    setTimeout(() => {
      statusElement.classList.remove("visible");
    }, 2000);
  });
}
