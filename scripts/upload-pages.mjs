#!/usr/bin/env node

/**
 * Uploads full book page illustrations from private-art/<book>/*.webp
 * to the private Supabase Storage bucket book-pages/<book>/<NN>.webp.
 *
 * Requirements:
 * - SUPABASE_URL: URL of your Supabase project (e.g. https://xyzcompany.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin-level storage operations
 *
 * Security:
 * - This script refuses to run if either variable is missing.
 * - Under no circumstances is SUPABASE_SERVICE_ROLE_KEY ever logged or printed.
 *
 * Usage:
 *   # Upload all books found in private-art/
 *   node scripts/upload-pages.mjs
 *
 *   # Upload a specific book only (e.g. ibrahim)
 *   node scripts/upload-pages.mjs ibrahim
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: Missing required environment variables.");
  if (!supabaseUrl) {
    console.error("  - SUPABASE_URL is not set.");
  }
  if (!supabaseServiceRoleKey) {
    console.error("  - SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  console.error(
    "\nPlease set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment before running this script."
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const candidateDirs = [
  path.resolve(process.cwd(), "private-art"),
  path.resolve(repoRoot, "private-art"),
];

const privateArtDir = candidateDirs.find((dir) => fs.existsSync(dir));

const targetBook = process.argv[2];

const booksToProcess = [];

if (targetBook) {
  if (fs.existsSync(targetBook) && fs.statSync(targetBook).isDirectory()) {
    booksToProcess.push({
      book: path.basename(targetBook),
      dir: path.resolve(targetBook),
    });
  } else if (privateArtDir && fs.existsSync(path.join(privateArtDir, targetBook))) {
    booksToProcess.push({
      book: targetBook,
      dir: path.join(privateArtDir, targetBook),
    });
  } else {
    console.error(
      `Error: Directory for book '${targetBook}' not found (checked: ${
        privateArtDir ? path.join(privateArtDir, targetBook) : targetBook
      }).`
    );
    process.exit(1);
  }
} else {
  if (!privateArtDir) {
    console.error(
      `Error: 'private-art' directory not found.\nLooked in:\n  - ${candidateDirs[0]}\n  - ${candidateDirs[1]}\n\nPlease create private-art/<book>/ containing your .webp files.`
    );
    process.exit(1);
  }

  const entries = fs.readdirSync(privateArtDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      booksToProcess.push({
        book: entry.name,
        dir: path.join(privateArtDir, entry.name),
      });
    }
  }

  if (booksToProcess.length === 0) {
    console.error(
      `Error: No book subdirectories found inside '${privateArtDir}'.\nExpected structure: private-art/<book>/*.webp`
    );
    process.exit(1);
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

let totalSuccess = 0;
let totalFailed = 0;

for (const { book, dir } of booksToProcess) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".webp"));

  if (files.length === 0) {
    console.log(`[${book}] No .webp files found in ${dir}. Skipping.`);
    continue;
  }

  files.sort((a, b) => {
    const numA = a.match(/\d+/);
    const numB = b.match(/\d+/);
    if (numA && numB) {
      return parseInt(numA[0], 10) - parseInt(numB[0], 10);
    }
    return a.localeCompare(b, undefined, { numeric: true });
  });

  console.log(`\n[${book}] Uploading ${files.length} page(s) from ${dir}...`);

  for (const file of files) {
    const filePath = path.join(dir, file);
    // ponytail: split-pdf.py already names files (NN.webp, front-NN.webp); keep them as-is.
    const targetFilename = file;
    const storagePath = `${book}/${targetFilename}`;
    const fileBuffer = fs.readFileSync(filePath);

    try {
      const { error } = await supabase.storage
        .from("book-pages")
        .upload(storagePath, fileBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (error) {
        console.error(`  ✗ ${file} -> ${storagePath}: ${error.message}`);
        totalFailed++;
      } else {
        console.log(`  ✓ ${file} -> ${storagePath}`);
        totalSuccess++;
      }
    } catch (err) {
      console.error(
        `  ✗ ${file} -> ${storagePath}: ${err instanceof Error ? err.message : String(err)}`
      );
      totalFailed++;
    }
  }
}

console.log("\nUpload Summary:");
console.log(`  Uploaded: ${totalSuccess}`);
if (totalFailed > 0) {
  console.error(`  Failed:   ${totalFailed}`);
  process.exit(1);
}
