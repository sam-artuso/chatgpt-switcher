/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import functions from content script
const { scrapeCustomGPTs, fuzzyScore } = await import('../src/content.js');

// Discover all fixture directories and get the most recent one
const fixturesDir = join(__dirname, 'fixtures');
const fixtureDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .sort();

// Only test the most recent fixture (ChatGPT's DOM changes over time)
const latestFixture = fixtureDirs[fixtureDirs.length - 1];

describe('ChatGPT Switcher Extension', () => {
  describe('scrapeCustomGPTs', () => {
    // Test the latest fixture (older ones are kept for historical reference)
    it(`should correctly scrape GPTs from ${latestFixture} snapshot`, () => {
      const fixtureDate = latestFixture;

      // Load HTML fixture
      const htmlPath = join(fixturesDir, fixtureDate, 'chatgpt.html');
      const html = readFileSync(htmlPath, 'utf-8');

      // Load expected results
      const expectedPath = join(fixturesDir, fixtureDate, 'expected.json');
      const expected = JSON.parse(readFileSync(expectedPath, 'utf-8'));

      // Create JSDOM instance
      const dom = new JSDOM(html);
      global.document = dom.window.document;

      // Run the scraper
      const gpts = scrapeCustomGPTs();

      // Verify correct number of GPTs found
      expect(gpts.length).toBe(expected.length);

      // Verify each GPT
      expected.forEach((expectedGpt, index) => {
        const actualGpt = gpts[index];

        // Check name matches
        expect(actualGpt.name).toBe(expectedGpt.name);

        // Check URL matches (normalize to handle both absolute and relative URLs)
        const actualUrl = actualGpt.url.replace('https://chatgpt.com', '');
        expect(actualUrl).toBe(expectedGpt.url);

        // Check image URL matches if expected
        if (expectedGpt.image) {
          expect(actualGpt.image).toBe(expectedGpt.image);
        }

        // Verify element reference exists
        expect(actualGpt.element).toBeDefined();
      });
    });

    it('should return empty array when no GPTs are present', () => {
      const dom = new JSDOM('<html><body><div></div></body></html>');
      global.document = dom.window.document;

      const gpts = scrapeCustomGPTs();
      expect(gpts).toEqual([]);
    });
  });

  describe('fuzzyScore', () => {
    it('should return score of 1 for empty query', () => {
      const result = fuzzyScore('Finance mentor', '');
      expect(result.matches).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should match exact substrings with high score', () => {
      const result = fuzzyScore('Finance mentor', 'finance');
      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should match fuzzy patterns', () => {
      const result = fuzzyScore('Finance mentor', 'fm');
      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should give higher scores to consecutive matches', () => {
      const consecutive = fuzzyScore('Finance mentor', 'finance');
      const scattered = fuzzyScore('Finance mentor', 'fnnc');

      expect(consecutive.score).toBeGreaterThan(scattered.score);
    });

    it('should not match when query characters are not present', () => {
      const result = fuzzyScore('Finance mentor', 'xyz');
      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should be case insensitive', () => {
      const lower = fuzzyScore('Finance Mentor', 'finance');
      const upper = fuzzyScore('Finance Mentor', 'FINANCE');
      const mixed = fuzzyScore('Finance Mentor', 'FiNaNcE');

      expect(lower.matches).toBe(true);
      expect(upper.matches).toBe(true);
      expect(mixed.matches).toBe(true);
      expect(lower.score).toBe(upper.score);
      expect(lower.score).toBe(mixed.score);
    });
  });
});
