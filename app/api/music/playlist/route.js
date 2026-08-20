import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("listId");

  if (!playlistId || !playlistId.trim()) {
    return NextResponse.json({ results: [] });
  }

  const cleanId = playlistId.trim();
  const url = `https://www.youtube.com/playlist?list=${cleanId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const html = await res.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/window\["ytInitialData"\] = ({.*?});/);

    if (!jsonMatch) {
      return NextResponse.json({ results: [], error: "No ytInitialData found" });
    }

    const data = JSON.parse(jsonMatch[1]);
    const results = [];

    function findPlaylistVideos(obj) {
      if (!obj || typeof obj !== "object") return;

      if (obj.playlistVideoRenderer) {
        const vr = obj.playlistVideoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
        const channel = vr.shortBylineText?.runs?.[0]?.text || "";
        const duration = vr.lengthText?.simpleText || "";
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        if (videoId && title) {
          results.push({
            type: "video",
            videoId,
            title,
            channel,
            duration,
            thumbnail
          });
        }
        return;
      }

      for (const k of Object.keys(obj)) {
        findPlaylistVideos(obj[k]);
      }
    }

    findPlaylistVideos(data);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to parse playlist details:", error);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
