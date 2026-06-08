/**
 * Cloudflare Pages Function Proxy
 * ──────────────────────────────
 * Route: /api/live-score/[id]
 *
 * Fetches real-time match details from API-Football and caches the response
 * for 60 seconds in Cloudflare's edge cache to protect the 100 req/day quota.
 */

export async function onRequest({ request, params, env }) {
  const matchId = params.id;
  
  if (!matchId) {
    return new Response(JSON.stringify({ error: "Missing match ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = env.RAPIDAPI_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error (missing API key)" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  
  // Try to retrieve from Cloudflare Edge Cache
  let cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    // Return cached response but append a header indicating it was a cache hit
    const responseWithHeader = new Response(cachedResponse.body, cachedResponse);
    responseWithHeader.headers.set("x-cache", "HIT");
    return responseWithHeader;
  }

  // Cache miss: fetch from API-Football
  const apiUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${matchId}`;
  
  try {
    const apiResponse = await fetch(apiUrl, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: `API responded with status ${apiResponse.status}` }),
        {
          status: apiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await apiResponse.json();
    const fixtureData = data.response?.[0];

    if (!fixtureData) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build optimized, lightweight match response
    const st = fixtureData.fixture.status.short;
    const isLive = ["1H", "2H", "HT", "ET", "P", "BT", "INT"].includes(st);
    const isFinished = ["FT", "AET", "PEN"].includes(st);
    const isUpcoming = ["NS", "TBD"].includes(st);

    const matchDetails = {
      id: fixtureData.fixture.id,
      home: {
        goals: fixtureData.goals.home,
        winner: fixtureData.teams.home.winner,
      },
      away: {
        goals: fixtureData.goals.away,
        winner: fixtureData.teams.away.winner,
      },
      status: {
        short: st,
        long: fixtureData.fixture.status.long,
        elapsed: fixtureData.fixture.status.elapsed,
        isLive,
        isFinished,
        isUpcoming,
      },
      score: {
        halftime: fixtureData.score?.halftime || { home: null, away: null },
        fulltime: fixtureData.score?.fulltime || { home: null, away: null },
        extratime: fixtureData.score?.extratime || { home: null, away: null },
        penalty: fixtureData.score?.penalty || { home: null, away: null },
      },
    };

    // Set Cache-Control headers to cache on the Cloudflare Edge for 60 seconds
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
      "x-cache": "MISS",
    });

    const response = new Response(JSON.stringify(matchDetails), {
      status: 200,
      headers: responseHeaders,
    });

    // Save to cache
    await cache.put(cacheKey, response.clone());
    
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch live score: " + error.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
