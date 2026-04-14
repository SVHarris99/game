import dictionary from "@/lib/words/dictionary.json";
import { shuffle } from "@/lib/utils";

const categories = Object.keys(dictionary) as (keyof typeof dictionary)[];

interface WordSelection {
  category: string;
  word: string;
}

/** Pick a random category and word, avoiding previously used ones */
export function selectWord(usedWords: string[] = []): WordSelection {
  const shuffledCategories = shuffle(categories);

  for (const category of shuffledCategories) {
    const words = dictionary[category];
    const available = words.filter((w) => !usedWords.includes(w));
    if (available.length > 0) {
      const word = available[Math.floor(Math.random() * available.length)];
      return { category, word };
    }
  }

  // Fallback: all words used, reset and pick any
  const category = categories[Math.floor(Math.random() * categories.length)];
  const words = dictionary[category];
  const word = words[Math.floor(Math.random() * words.length)];
  return { category, word };
}
