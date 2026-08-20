import { google } from "googleapis";
import { NextResponse } from "next/server";

const getAuth = () => {
  let privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").trim();
  privateKey = privateKey.replace(/^[\"']|[\"']$/g, "");
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  } else {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim().replace(/^[\"']|[\"']$/g, "");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { tickets, monthsBack = 1 } = body;

    const clickupToken = process.env.CLICKUP_API_TOKEN?.replace(/^"|"$/g, '');
    if (!clickupToken) {
      return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured in .env" }, { status: 400 });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    let updatedCount = 0;
    const syncedTickets = [...tickets];

    // Process sequentially. We reverse the loop (start at the end) to change the update order.
    // If the frontend passed newest-first, looping backwards processes oldest-first, and vice versa.
    for (let i = syncedTickets.length - 1; i >= 0; i--) {
      const ticket = syncedTickets[i];
      
      const [dd, mm, yyyy] = (ticket.date || "").split('/');
      if (dd && mm && yyyy) {
        const tDate = new Date(yyyy, parseInt(mm) - 1, dd);
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
        if (tDate < cutoffDate) continue;
      }

      // We sync all tickets, even Done ones, to get their tags and priority.
      // Small sleep to prevent hitting ClickUp's 100 req/min rate limit (approx 600ms per req = 100/min max)
      await new Promise(resolve => setTimeout(resolve, 600));

      if (!ticket.clickup_url || !ticket.clickup_url.includes('/t/')) continue;
      
      const match = ticket.clickup_url.match(/\/t\/(?:[0-9]+\/)?([a-zA-Z0-9]+)/);
      if (!match) continue;
      const taskId = match[1];

      try {
        const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
          headers: { 'Authorization': clickupToken }
        });
        
        if (!res.ok) {
          console.error(`Failed to fetch ClickUp task ${taskId}: ${res.statusText}`);
          continue;
        }
        
        const data = await res.json();
        
        if (!data || !data.status) continue;

        const cuStatus = data.status.status.toLowerCase();
        const cuType = data.status.type ? data.status.type.toLowerCase() : "";
        
        let newStatus = ticket.status;
        
        if (cuType === 'open' || cuStatus === 'to do' || cuStatus === 'not started') {
          newStatus = 'Not Started';
        } else if (cuType === 'closed' || cuType === 'done' || cuStatus === 'complete' || cuStatus === 'done' || cuStatus === 'resolved') {
          newStatus = 'Done';
        } else {
          newStatus = 'Active'; // Catch-all for in-progress/active
        }

        const newTitle = data.name || ticket.title;
        
        const newPriority = data.priority ? { name: data.priority.priority, color: data.priority.color } : null;
        const newTags = data.tags ? data.tags.map(t => ({ name: t.name, bg: t.tag_bg, fg: t.tag_fg })) : [];

        const priorityChanged = JSON.stringify(newPriority) !== JSON.stringify(ticket.priority);
        const tagsChanged = JSON.stringify(newTags) !== JSON.stringify(ticket.tags);

        if (newStatus !== ticket.status || newTitle !== ticket.title || priorityChanged || tagsChanged) {
           // Update Google Sheet
           const rowNum = ticket.id + 2;
           await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `Ticket Tracker!C${rowNum}:H${rowNum}`, // Columns: Title (C), URL (D), Status (E), Comment (F), Priority (G), Tags (H)
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[newTitle, ticket.clickup_url, newStatus, ticket.comment || "", newPriority ? JSON.stringify(newPriority) : "", newTags.length ? JSON.stringify(newTags) : ""]]
              }
           });
           
           syncedTickets[i] = { ...ticket, status: newStatus, title: newTitle, priority: newPriority, tags: newTags };
           updatedCount++;
        }
      } catch (err) {
        console.error(`Error syncing task ${taskId}:`, err);
      }
    }

    return NextResponse.json({ tickets: syncedTickets, updatedCount });
  } catch (error) {
    console.error("Error in ClickUp sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
