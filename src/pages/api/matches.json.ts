import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";

export async function GET() {
  const matchesDir = resolve(process.cwd(), "src/data/matches");
  const today = new Date().toISOString().slice(0, 10);
  let matches = [];
  let displayedDate = today;

  if (existsSync(resolve(matchesDir, `${today}.json`))) {
    try {
      matches = JSON.parse(readFileSync(resolve(matchesDir, `${today}.json`), "utf-8"));
    } catch { /* ignore */ }
  }

  // Fallback to the latest available matches file
  if (matches.length === 0 && existsSync(matchesDir)) {
    const files = readdirSync(matchesDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
      
    if (files.length > 0) {
      try {
        matches = JSON.parse(readFileSync(resolve(matchesDir, files[0]), "utf-8"));
        displayedDate = files[0].replace(".json", "");
      } catch { /* ignore */ }
    }
  }

  return new Response(JSON.stringify({
    date: displayedDate,
    matches: matches
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    }
  });
}
