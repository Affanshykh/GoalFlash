/**
 * fetch-scores.js
 * ────────────────────────────────────────────────────────────────
 * Multi-tournament data fetcher for GoalFlash pSEO.
 *
 * Stored by date under: src/data/matches/YYYY-MM-DD.json
 * ────────────────────────────────────────────────────────────────
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../src/data");
const MATCHES_DIR = resolve(DATA_DIR, "matches");

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

const API_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = "api-football-v1.p.rapidapi.com";
const BASE = `https://${API_HOST}/v3`;

/**
 * League registry.
 * priority: 1 = always fetch, 2 = fetch if budget allows, 3 = low priority
 * calendarYear: true if league runs on single calendar year (e.g. World Cup)
 */
const LEAGUES = [
  // ── Tier 1: Always fetch ──────────────────────────────────────
  { id: 1,   name: "FIFA World Cup",          nameAR: "كأس العالم",                      priority: 1, season: 2026, calendarYear: true },
  { id: 307, name: "Saudi Pro League",         nameAR: "دوري روشن السعودي للمحترفين",     priority: 1 },

  // ── Tier 2: Major European leagues ────────────────────────────
  { id: 2,   name: "UEFA Champions League",    nameAR: "دوري أبطال أوروبا",               priority: 2 },
  { id: 39,  name: "Premier League",           nameAR: "الدوري الإنجليزي الممتاز",        priority: 2 },
  { id: 140, name: "La Liga",                  nameAR: "الدوري الإسباني",                 priority: 2 },

  // ── Tier 3: Secondary leagues ─────────────────────────────────
  { id: 135, name: "Serie A",                  nameAR: "الدوري الإيطالي",                 priority: 3 },
  { id: 78,  name: "Bundesliga",               nameAR: "الدوري الألماني",                 priority: 3 },
  { id: 61,  name: "Ligue 1",                  nameAR: "الدوري الفرنسي",                  priority: 3 },
  { id: 3,   name: "UEFA Europa League",       nameAR: "الدوري الأوروبي",                 priority: 3 },
  { id: 848, name: "AFC Champions League",     nameAR: "دوري أبطال آسيا",                 priority: 2 },
];

// ═══════════════════════════════════════════════════════════════
//  BILINGUAL TEAM NAME DICTIONARY
// ═══════════════════════════════════════════════════════════════

const TEAM_AR = {
  // ── Saudi Pro League clubs ────────────────────────────────────
  "Al Hilal":        "الهلال",
  "Al Nassr":        "النصر",
  "Al Ahli":         "الأهلي",
  "Al Ittihad":      "الاتحاد",
  "Al Shabab":       "الشباب",
  "Al Fateh":        "الفتح",
  "Al Taawoun":      "التعاون",
  "Al Feiha":        "الفيحاء",
  "Al Raed":         "الرائد",
  "Al Ettifaq":      "الاتفاق",
  "Al Khaleej":      "الخليج",
  "Al Riyadh":       "الرياض",
  "Al Akhdoud":      "الأخدود",
  "Al Wehda":        "الوحدة",
  "Abha":            "أبها",
  "Damac":           "ضمك",
  "Al Hazem":        "الحزم",
  "Al Tai":          "الطائي",
  "Al Qadisiyah":    "القادسية",
  "Al Okhdood":      "الأخدود",

  // ── World Cup 2026 national teams (all 48 qualified) ──────────
  "Saudi Arabia":    "السعودية",
  "Qatar":           "قطر",
  "Japan":           "اليابان",
  "South Korea":     "كوريا الجنوبية",
  "Australia":       "أستراليا",
  "Iran":            "إيران",
  "Iraq":            "العراق",
  "Uzbekistan":      "أوزبكستان",
  "Jordan":          "الأردن",
  "Palestine":       "فلسطين",
  "Bahrain":         "البحرين",
  "Indonesia":       "إندونيسيا",

  "USA":             "أمريكا",
  "Mexico":          "المكسيك",
  "Canada":          "كندا",
  "Jamaica":         "جامايكا",
  "Honduras":        "هندوراس",
  "Panama":          "بنما",
  "Costa Rica":      "كوستاريكا",
  "Trinidad and Tobago": "ترينيداد وتوباغو",

  "Argentina":       "الأرجنتين",
  "Brazil":          "البرازيل",
  "Uruguay":         "أوروغواي",
  "Colombia":        "كولومبيا",
  "Ecuador":         "الإكوادور",
  "Venezuela":       "فنزويلا",
  "Paraguay":        "باراغواي",
  "Chile":           "تشيلي",
  "Bolivia":         "بوليفيا",
  "Peru":            "بيرو",

  "Germany":         "ألمانيا",
  "Spain":           "إسبانيا",
  "France":          "فرنسا",
  "England":         "إنجلترا",
  "Portugal":        "البرتغال",
  "Netherlands":     "هولندا",
  "Belgium":         "بلجيكا",
  "Italy":           "إيطاليا",
  "Croatia":         "كرواتيا",
  "Switzerland":     "سويسرا",
  "Denmark":         "الدنمارك",
  "Austria":         "النمسا",
  "Serbia":          "صربيا",
  "Poland":          "بولندا",
  "Scotland":        "اسكتلندا",
  "Turkey":          "تركيا",
  "Wales":           "ويلز",
  "Slovenia":        "سلوفينيا",
  "Albania":         "ألبانيا",
  "Ukraine":         "أوكرانيا",
  "Hungary":         "المجر",
  "Georgia":         "جورجيا",
  "Romania":         "رومانيا",
  "Slovakia":        "سلوفاكيا",
  "Czech Republic":  "التشيك",
  "Greece":          "اليونان",

  "Morocco":         "المغرب",
  "Senegal":         "السنغال",
  "Nigeria":         "نيجيريا",
  "Egypt":           "مصر",
  "Cameroon":        "الكاميرون",
  "Tunisia":         "تونس",
  "Algeria":         "الجزائر",
  "Ghana":           "غانا",
  "Ivory Coast":     "ساحل العاج",
  "South Africa":    "جنوب أفريقيا",
  "Mali":            "مالي",
  "DR Congo":        "الكونغو",
  "Burkina Faso":    "بوركينا فاسو",
  "Tanzania":        "تنزانيا",
  "Mozambique":      "موزمبيق",
  "Benin":           "بنين",
  "Uganda":          "أوغندا",
  "Kenya":           "كينيا",

  "New Zealand":     "نيوزيلندا",

  // ── Major European clubs ──────────────────────────────────────
  "Real Madrid":       "ريال مدريد",
  "Barcelona":         "برشلونة",
  "Manchester City":   "مانشستر سيتي",
  "Manchester United": "مانشستر يونايتد",
  "Liverpool":         "ليفربول",
  "Arsenal":           "أرسنال",
  "Chelsea":           "تشيلسي",
  "Bayern Munich":     "بايرن ميونخ",
  "Paris Saint Germain": "باريس سان جيرمان",
  "PSG":               "باريس سان جيرمان",
  "Juventus":          "يوفنتوس",
  "Inter":             "إنتر ميلان",
  "AC Milan":          "إيه سي ميلان",
  "Tottenham":         "توتنهام",
  "Borussia Dortmund": "بوروسيا دورتموند",
  "Atletico Madrid":   "أتلتيكو مدريد",
  "Napoli":            "نابولي",
  "Newcastle":         "نيوكاسل",
  "Aston Villa":       "أستون فيلا",
  "Benfica":           "بنفيكا",
  "Porto":             "بورتو",
  "Ajax":              "أياكس",
};

// ═══════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getDatesWindow() {
  const dates = [];
  for (let i = -1; i <= 1; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")   // keep Arabic chars
    .replace(/(^-|-$)/g, "");
}

function slugifyEN(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getArabic(enName) {
  if (TEAM_AR[enName]) return TEAM_AR[enName];
  for (const [key, val] of Object.entries(TEAM_AR)) {
    if (enName.includes(key) || key.includes(enName)) return val;
  }
  return enName;
}

function getTournamentBadge(league) {
  const badges = {
    1:   { en: "World Cup 2026",          ar: "كأس العالم ٢٠٢٦",       color: "#d4af37" },
    307: { en: "Saudi Pro League",         ar: "دوري روشن",              color: "#00843d" },
    2:   { en: "Champions League",         ar: "دوري أبطال أوروبا",       color: "#0a1f8f" },
    39:  { en: "Premier League",           ar: "الدوري الإنجليزي",        color: "#38003c" },
    140: { en: "La Liga",                  ar: "الدوري الإسباني",         color: "#ee8707" },
    135: { en: "Serie A",                  ar: "الدوري الإيطالي",         color: "#024494" },
    78:  { en: "Bundesliga",               ar: "الدوري الألماني",         color: "#d20515" },
    61:  { en: "Ligue 1",                  ar: "الدوري الفرنسي",          color: "#091c3e" },
    3:   { en: "Europa League",            ar: "الدوري الأوروبي",         color: "#f37021" },
    848: { en: "AFC Champions League",     ar: "دوري أبطال آسيا",         color: "#00529b" },
  };
  return badges[league.id] || { en: league.name, ar: league.nameAR, color: "#666" };
}

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const remaining = res.headers.get("x-ratelimit-requests-remaining");
  if (remaining) console.log(`   📊  API quota remaining: ${remaining}`);

  return json.response || [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldFetchDate(dateStr) {
  const today = todayISO();
  if (dateStr === today) return true; // Always fetch today's games for live scores

  const filePath = resolve(MATCHES_DIR, `${dateStr}.json`);
  if (!existsSync(filePath)) return true;

  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    if (data.length === 0) return true;
    
    // If we already fetched it today, skip it to conserve API quota
    const lastFetched = data[0].fetchedAt.slice(0, 10);
    if (lastFetched !== today) return true;
  } catch {
    return true; // Corrupt file
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════

async function main() {
  if (!API_KEY) {
    console.error("❌  RAPIDAPI_KEY environment variable is not set.");
    process.exit(1);
  }

  if (!existsSync(MATCHES_DIR)) mkdirSync(MATCHES_DIR, { recursive: true });

  const datesToFetch = getDatesWindow();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  console.log(`\n🏟️  GoalFlash Multi-Day Fetch — Starting`);
  console.log(`${"─".repeat(50)}`);

  let requestCount = 0;
  const maxRequests = 15; // Budget ceiling per script execution

  for (const dateStr of datesToFetch) {
    if (!shouldFetchDate(dateStr)) {
      console.log(`\n⏭️  Skipping API fetch for ${dateStr} (already fetched today)`);
      continue;
    }

    console.log(`\n📅  Fetching matches for date: ${dateStr}`);
    let dateMatches = [];

    // Sort leagues by priority so tier-1 gets fetched first
    const sorted = [...LEAGUES].sort((a, b) => a.priority - b.priority);

    for (const league of sorted) {
      if (requestCount >= maxRequests) {
        console.log(`   ⏸️  Skipping ${league.name} — request budget hit (${maxRequests})`);
        continue;
      }

      // Calculate correct season based on league type and date month
      // For autumn-to-spring leagues, if date month is Jan-Jun, the season ID is currentYear - 1
      const defaultSeason = league.calendarYear 
        ? currentYear 
        : (currentMonth < 7 ? currentYear - 1 : currentYear);
      const season = league.season || defaultSeason;

      try {
        console.log(`⚽  ${league.name} (ID ${league.id}, season ${season})…`);
        const fixtures = await apiFetch("fixtures", {
          league: league.id,
          season,
          date: dateStr,
        });
        requestCount++;
        console.log(`   📋  ${fixtures.length} fixture(s) found`);

        const badge = getTournamentBadge(league);

        for (const f of fixtures) {
          const homeEN = f.teams.home.name;
          const awayEN = f.teams.away.name;
          const homeAR = getArabic(homeEN);
          const awayAR = getArabic(awayEN);

          const slugEN = `${slugifyEN(homeEN)}-vs-${slugifyEN(awayEN)}-live-score`;
          const slugAR = `مباراة-${slugify(homeAR)}-ضد-${slugify(awayAR)}`;

          const st = f.fixture.status.short;
          const isLive = ["1H", "2H", "HT", "ET", "P", "BT", "INT"].includes(st);
          const isFinished = ["FT", "AET", "PEN"].includes(st);
          const isUpcoming = ["NS", "TBD"].includes(st);

          const isWorldCup = league.id === 1;
          const isSaudiLeague = league.id === 307;

          dateMatches.push({
            id: f.fixture.id,
            slugEN,
            slugAR,
            league: {
              id: league.id,
              name: league.name,
              nameAR: league.nameAR,
              season,
              logo: f.league.logo || "",
              round: f.league.round || "",
            },
            badge,
            isWorldCup,
            isSaudiLeague,
            home: {
              name: homeEN,
              nameAR: homeAR,
              logo: f.teams.home.logo || "",
              goals: f.goals.home,
              winner: f.teams.home.winner,
            },
            away: {
              name: awayEN,
              nameAR: awayAR,
              logo: f.teams.away.logo || "",
              goals: f.goals.away,
              winner: f.teams.away.winner,
            },
            status: {
              short: st,
              long: f.fixture.status.long,
              elapsed: f.fixture.status.elapsed,
              isLive,
              isFinished,
              isUpcoming,
            },
            score: {
              halftime: f.score?.halftime || { home: null, away: null },
              fulltime: f.score?.fulltime || { home: null, away: null },
              extratime: f.score?.extratime || { home: null, away: null },
              penalty: f.score?.penalty || { home: null, away: null },
            },
            venue: {
              name: f.fixture.venue?.name || "",
              city: f.fixture.venue?.city || "",
            },
            date: f.fixture.date,
            timestamp: f.fixture.timestamp,
            fetchedAt: new Date().toISOString(),
          });
        }

        await sleep(1100);
      } catch (err) {
        console.warn(`   ⚠️  ${league.name} failed: ${err.message}`);
      }
    }

    // Merge new fixtures with existing date file to prevent data loss
    const filePath = resolve(MATCHES_DIR, `${dateStr}.json`);
    let existingMatches = [];
    if (existsSync(filePath)) {
      try {
        existingMatches = JSON.parse(readFileSync(filePath, "utf-8"));
      } catch { /* ignore corrupt */ }
    }

    const freshIds = new Set(dateMatches.map((m) => m.id));
    const retainedMatches = existingMatches.filter((m) => !freshIds.has(m.id));
    const mergedMatches = [...dateMatches, ...retainedMatches];

    // Sort: live → upcoming → finished, then priority
    mergedMatches.sort((a, b) => {
      const liveOrder = (m) => (m.status.isLive ? 0 : m.status.isUpcoming ? 1 : 2);
      const diff = liveOrder(a) - liveOrder(b);
      if (diff !== 0) return diff;
      const prio = (m) => (m.isWorldCup ? 0 : m.isSaudiLeague ? 1 : 2);
      return prio(a) - prio(b) || a.timestamp - b.timestamp;
    });

    writeFileSync(filePath, JSON.stringify(mergedMatches, null, 2), "utf-8");
    console.log(`✅  Saved ${mergedMatches.length} matches to ${filePath}`);
  }

  console.log(`\n🏁  Fetch pipeline finished. Total API calls: ${requestCount}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
