/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

type StorageData = Record<string, unknown>;

interface ChromeStorageLocal {
  get: (keys: string | string[]) => Promise<StorageData>;
  set: (items: StorageData) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
  _data: StorageData;
  _reset: () => void;
}

interface ChromeMock {
  storage: {
    local: ChromeStorageLocal;
  };
}

export function createChromeMock(): ChromeMock {
  const storage: StorageData = {};

  return {
    storage: {
      local: {
        _data: storage,
        _reset: () => {
          for (const key of Object.keys(storage)) {
            delete storage[key];
          }
        },
        get: async (keys: string | string[]) => {
          const result: StorageData = {};
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            if (key in storage) {
              result[key] = storage[key];
            }
          }
          return result;
        },
        set: async (items: StorageData) => {
          Object.assign(storage, items);
        },
        remove: async (keys: string | string[]) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            delete storage[key];
          }
        },
      },
    },
  };
}
