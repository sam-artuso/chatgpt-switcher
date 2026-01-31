/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, "..", "src");
const distDir = join(__dirname, "..", "dist", "build");

// Ensure dist/build exists
mkdirSync(distDir, { recursive: true });

// Copy static assets
const assets = ["manifest.json", "styles.css", "options.html", "icons"];

assets.forEach((asset) => {
  const src = join(srcDir, asset);
  const dest = join(distDir, asset);
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${asset}`);
});

console.log("Assets copied to dist/build/");
