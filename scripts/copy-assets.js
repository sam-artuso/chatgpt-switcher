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

// Copy manifest from src/
cpSync(join(srcDir, "manifest.json"), join(distDir, "manifest.json"));
console.log("Copied manifest.json");

// Copy HTML from assets/html/
cpSync(join(assetsDir, "html", "options.html"), join(distDir, "options.html"));
console.log("Copied options.html");

// Copy CSS from assets/css/
cpSync(join(assetsDir, "css", "styles.css"), join(distDir, "styles.css"));
console.log("Copied styles.css");

cpSync(join(assetsDir, "css", "options.css"), join(distDir, "options.css"));
console.log("Copied options.css");

// Copy icons from assets/icons/
cpSync(join(assetsDir, "icons"), join(distDir, "icons"), { recursive: true });
console.log("Copied icons");

console.log("Assets copied to dist/build/");
