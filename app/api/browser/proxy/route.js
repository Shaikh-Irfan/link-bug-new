import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    let urlToFetch = targetUrl;
    if (!urlToFetch.startsWith("http://") && !urlToFetch.startsWith("https://")) {
      urlToFetch = "https://" + urlToFetch;
    }

    const res = await fetch(urlToFetch, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const contentType = res.headers.get("content-type") || "text/html";

    // If binary / non-HTML, pipe directly
    if (!contentType.includes("text/html")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    let html = await res.text();
    const origin = new URL(urlToFetch).origin;

    // Inject <base> tag so relative links and assets resolve properly
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${origin}/">`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD><base href="${origin}/">`);
    } else {
      html = `<base href="${origin}/">` + html;
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Access-Control-Allow-Origin", "*");
    // Explicitly do NOT set X-Frame-Options or Content-Security-Policy

    return new NextResponse(html, {
      status: res.status,
      headers
    });
  } catch (err) {
    return new NextResponse(`
      <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #64748b;">
        <h3 style="color: #ef4444;">Unable to load page via proxy</h3>
        <p>${err.message}</p>
        <a href="${targetUrl}" target="_blank" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #10b981; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">Open in New Tab</a>
      </div>
    `, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
