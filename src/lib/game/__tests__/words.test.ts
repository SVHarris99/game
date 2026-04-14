import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// @ts-expect-error - .ts extension required for Node --experimental-strip-types
import { getCategoryEmoji } from "../words.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictionaryPath = resolve(__dirname, "../../words/dictionary.json");
const dictionary = JSON.parse(readFileSync(dictionaryPath, "utf8")) as Record<
  string,
  { emoji: string; words: string[] }
>;

test("dictionary has exactly 12 categories", () => {
  assert.equal(Object.keys(dictionary).length, 12);
});

test("every category has a non-empty emoji string", () => {
  for (const [name, entry] of Object.entries(dictionary)) {
    assert.equal(typeof entry.emoji, "string", `${name} emoji is string`);
    assert.ok(entry.emoji.length > 0, `${name} emoji non-empty`);
  }
});

test("every category has exactly 30 words", () => {
  for (const [name, entry] of Object.entries(dictionary)) {
    assert.ok(Array.isArray(entry.words), `${name} has words array`);
    assert.equal(entry.words.length, 30, `${name} has 30 words`);
  }
});

test("words within each category are unique", () => {
  for (const [name, entry] of Object.entries(dictionary)) {
    const set = new Set(entry.words);
    assert.equal(
      set.size,
      entry.words.length,
      `${name} has duplicate words`,
    );
  }
});

test("getCategoryEmoji returns correct emoji for Animals", () => {
  assert.equal(getCategoryEmoji("Animals"), "🦁");
});

test("getCategoryEmoji returns empty string for unknown category", () => {
  assert.equal(getCategoryEmoji("NopeNotReal"), "");
});
