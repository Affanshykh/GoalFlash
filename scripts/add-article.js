/**
 * scripts/add-article.js
 * ────────────────────────────────────────────────────────────────
 * CLI content authoring utility for GoalFlash.
 *
 * Helps you easily add new news and editorial coverage articles
 * to `src/data/news.json` in both English and Arabic.
 *
 * Usage:
 *   node scripts/add-article.js
 * ────────────────────────────────────────────────────────────────
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_FILE = resolve(__dirname, "../src/data/news.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question, defaultValue = "") {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log(`\n📝  GoalFlash Content Creator — Add News Article`);
  console.log(`${"─".repeat(50)}`);

  // Load existing articles
  let newsList = [];
  if (existsSync(NEWS_FILE)) {
    try {
      newsList = JSON.parse(readFileSync(NEWS_FILE, "utf-8"));
    } catch {
      console.warn("   ⚠️  Could not read existing news.json — creating new database.");
    }
  }

  const nextId = newsList.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;

  // Ask article details
  const titleEN = await ask("Article Title (EN)");
  const titleAR = await ask("Article Title (AR)");
  
  const summaryEN = await ask("Summary/Excerpt (EN)");
  const summaryAR = await ask("Summary/Excerpt (AR)");
  
  const dateToday = new Date().toISOString().slice(0, 10);
  const date = await ask("Publish Date (YYYY-MM-DD)", dateToday);
  
  const linkEN = await ask("Link URL (EN) — e.g. /match/al-hilal-vs-al-nassr-live-score/", "/");
  const linkAR = await ask("Link URL (AR) — e.g. /ar/match/al-hilal-vs-al-nassr-live-score/", "/ar/");
  
  const categoryEN = await ask("Category (EN)", "Saudi Pro League");
  const categoryAR = await ask("Category (AR)", "دوري روشن");

  const newArticle = {
    id: nextId,
    title: titleEN,
    titleAR,
    summary: summaryEN,
    summaryAR,
    date,
    linkEN,
    linkAR,
    category: categoryEN,
    categoryAR
  };

  // Confirm and write
  console.log(`\n🔎  Draft Preview:`);
  console.log(JSON.stringify(newArticle, null, 2));
  
  const confirm = await ask("\nDo you want to save this article? (y/n)", "y");
  
  if (confirm.toLowerCase() === "y" || confirm.toLowerCase() === "yes") {
    newsList.unshift(newArticle); // Prepend to show latest first
    writeFileSync(NEWS_FILE, JSON.stringify(newsList, null, 2), "utf-8");
    console.log(`\n✅  Successfully saved article to: ${NEWS_FILE}\n`);
  } else {
    console.log(`\n❌  Action cancelled. Article was not saved.\n`);
  }

  rl.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  rl.close();
  process.exit(1);
});
