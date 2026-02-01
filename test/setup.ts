/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { beforeEach, vi } from "vitest";
import { createChromeMock } from "./mocks/chrome";

// Create and expose the chrome mock globally
const chromeMock = createChromeMock();
vi.stubGlobal("chrome", chromeMock);

// Mock scrollIntoView which is not implemented in JSDOM
Element.prototype.scrollIntoView = vi.fn();

// Reset chrome storage before each test
beforeEach(() => {
  chromeMock.storage.local._reset();
});

// Export the mock for direct manipulation in tests
export { chromeMock };
