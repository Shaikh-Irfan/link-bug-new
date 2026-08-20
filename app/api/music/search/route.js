import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const trimmedQuery = query.trim();

  // Check if it is a direct video + playlist URL (e.g. Mix or shared queue)
  let directVidMatch = trimmedQuery.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  const directListMatch = trimmedQuery.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  
  if (directVidMatch && directListMatch) {
    const vid = directVidMatch[1];
    const listId = directListMatch[1];
    return NextResponse.json({
      results: [
        {
          type: "playlist",
          playlistId: listId,
          videoId: vid,
          query: trimmedQuery,
          title: `Direct Playlist (${listId})`,
          channel: "Custom Playlist",
          videoCount: "Full Playlist",
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
        }
      ]
    });
  }

  // Check if it is a direct playlist URL only
  if (directListMatch) {
    const listId = directListMatch[1];
    return NextResponse.json({
      results: [
        {
          type: "playlist",
          playlistId: listId,
          title: `Direct Playlist (${listId})`,
          channel: "Custom Playlist",
          videoCount: "Full Playlist",
          thumbnail: `https://i.ytimg.com/vi/default/hqdefault.jpg`
        }
      ]
    });
  }

  // Check if it is a direct video URL
  directVidMatch = trimmedQuery.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (directVidMatch && !trimmedQuery.includes("list=")) {
    const vid = directVidMatch[1];
    return NextResponse.json({
      results: [
        {
          type: "video",
          videoId: vid,
          title: `Direct Video (${vid})`,
          channel: "YouTube Video",
          duration: "",
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
        }
      ]
    });
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmedQuery)}`;
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
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);

    if (!match) {
      return NextResponse.json({ results: [] });
    }

    const data = JSON.parse(match[1]);
    const sectionList = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    const results = [];

    for (const section of sectionList) {
      const contents = section?.itemSectionRenderer?.contents || [];
      for (const item of contents) {
        // 1. Standard Video Renderer
        if (item?.videoRenderer) {
          const vr = item.videoRenderer;
          const videoId = vr.videoId;
          const title = vr?.title?.runs?.[0]?.text || vr?.title?.simpleText || "";
          const channel = vr?.ownerText?.runs?.[0]?.text || vr?.shortBylineText?.runs?.[0]?.text || "";
          const duration = vr?.lengthText?.simpleText || "";
          const thumbnail = vr?.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

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
        }
        // 2. Playlist Renderer
        else if (item?.playlistRenderer) {
          const pr = item.playlistRenderer;
          const playlistId = pr.playlistId;
          const title = pr?.title?.simpleText || pr?.title?.runs?.[0]?.text || "";
          const channel = pr?.shortBylineText?.runs?.[0]?.text || pr?.ownerText?.runs?.[0]?.text || "Playlist";
          const videoCount = pr?.videoCount || "";
          const thumbnail = pr?.thumbnails?.[0]?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/default/hqdefault.jpg`;

          if (playlistId && title) {
            results.push({
              type: "playlist",
              playlistId,
              title,
              channel,
              videoCount: `${videoCount} tracks`,
              thumbnail
            });
          }
        }
        // 3. Modern lockupViewModel (Playlists, Albums, Shelves)
        else if (item?.lockupViewModel) {
          const lvm = item.lockupViewModel;
          const contentId = lvm.contentId;
          const contentType = lvm.contentType || "";
          const title = lvm?.metadata?.lockupMetadataViewModel?.title?.content || "";
          
          let thumbnail = "";
          const contentImage = lvm?.contentImage || {};
          if (contentImage?.collectionThumbnailViewModel) {
            const sources = contentImage.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources || [];
            if (sources.length > 0) thumbnail = sources[0].url;
          } else if (contentImage?.thumbnailViewModel) {
            const sources = contentImage.thumbnailViewModel?.image?.sources || [];
            if (sources.length > 0) thumbnail = sources[0].url;
          }

          const isPlaylist = contentType.includes("PLAYLIST") || contentType.includes("ALBUM") || (contentId && (contentId.startsWith("PL") || contentId.startsWith("OLAK")));

          if (contentId && title) {
            if (isPlaylist) {
              results.push({
                type: "playlist",
                playlistId: contentId,
                title,
                channel: "Playlist / Album",
                videoCount: "Album / Playlist",
                thumbnail: thumbnail || `https://i.ytimg.com/vi/default/hqdefault.jpg`
              });
            } else {
              results.push({
                type: "video",
                videoId: contentId,
                title,
                channel: "YouTube Video",
                duration: "",
                thumbnail: thumbnail || `https://i.ytimg.com/vi/${contentId}/hqdefault.jpg`
              });
            }
          }
        }

        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to search YouTube music/videos:", error);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
