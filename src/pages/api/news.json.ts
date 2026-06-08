import news from "../../data/news.json";

export async function GET() {
  return new Response(JSON.stringify(news), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=1800" // Cache for 30 minutes
    }
  });
}
