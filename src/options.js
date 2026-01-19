/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

const CACHE_KEY = 'chatgpt-switcher-gpts';

document.getElementById('clear-cache').addEventListener('click', async () => {
  await chrome.storage.local.remove(CACHE_KEY);

  const status = document.getElementById('status');
  status.classList.add('visible');

  setTimeout(() => {
    status.classList.remove('visible');
  }, 2000);
});
