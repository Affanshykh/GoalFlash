import standings from "../../data/standings.json";

export async function GET() {
  return new Response(JSON.stringify(standings), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600" // Standings change slowly, cache for 1 hour
    }
  });
}
