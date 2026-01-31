/*
 * Copyright (c) 2025 Samuele Artuso
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Copies static assets (manifest, CSS, HTML, icons) to dist/build/ after TypeScript compilation.
// TypeScript only compiles .ts files, so this script handles the non-TypeScript files.

import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "..");
const srcDir = join(projectRoot, "src");
const assetsDir = join(projectRoot, "assets");
const distDir = join(projectRoot, "dist", "build");

// Ensure dist/build exists
mkdirSync(distDir, { recursive: true });

// Copy assets from src/
const srcAssets = ["manifest.json", "styles.css", "options.html"];
srcAssets.forEach((asset) => {
  const src = join(srcDir, asset);
  const dest = join(distDir, asset);
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${asset}`);
});

// Copy icons from assets/
cpSync(join(assetsDir, "icons"), join(distDir, "icons"), { recursive: true });
console.log("Copied icons");

console.log("Assets copied to dist/build/");
