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

export async function GET(request) {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Ticket Tracker!A:I`, 
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    // Assume row 1 is header: [ Date, Created_By, Ticket_Title, ClickUp_URL, Optional_Status ]
    // Skip header row
    const tickets = rows.slice(1).map((row, index) => ({
      id: index,
      date: row[0] || "",
      created_by: row[1] || "",
      title: row[2] || "",
      clickup_url: row[3] || "",
      status: row[4] || "Not Started",
      comment: row[5] || "",
      priority: (() => { try { return row[6] ? JSON.parse(row[6]) : null; } catch (e) { return { name: row[6], color: "#9ca3af" }; } })(),
      tags: (() => { try { return row[7] ? JSON.parse(row[7]) : []; } catch (e) { return typeof row[7] === 'string' && row[7] ? [{ name: row[7] }] : []; } })(),
      escalated: row[8] === "TRUE" || row[8] === "true"
    })).reverse(); // Reverse so newest is first

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { created_by, title, clickup_url, status, date, comment, priority, tags } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `Ticket Tracker!A:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [date, created_by, title, clickup_url, status, comment || "", priority ? JSON.stringify(priority) : "", tags ? JSON.stringify(tags) : "", "FALSE"]
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error appending ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, created_by, title, clickup_url, status, date, comment, priority, tags } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    // id is the index from slice(1). So row index = id + 2
    const rowNum = id + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Ticket Tracker!A${rowNum}:I${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [date, created_by, title, clickup_url, status, comment || "", priority ? JSON.stringify(priority) : "", tags ? JSON.stringify(tags) : "", String(body.escalated || false).toUpperCase()]
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get("id"), 10);
    if (isNaN(id)) throw new Error("Invalid ticket ID");

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    });
    
    const targetSheet = sheetRes.data.sheets.find(s => s.properties.title.toLowerCase() === 'ticket tracker');
    if (!targetSheet) throw new Error("Ticket tracker sheet not found");
    
    const sheetId = targetSheet.properties.sheetId;
    const rowNum = id + 2;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowNum - 1, // 0-indexed, inclusive
                endIndex: rowNum // 0-indexed, exclusive
              }
            }
          }
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
