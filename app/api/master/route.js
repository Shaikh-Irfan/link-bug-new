import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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

// Helper to convert column index (0-based) to A1 notation letter
function colIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    let temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user, date, metrics, additionalWork } = body;

    if (!user || !date || !metrics) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdMaster = process.env.SPREADSHEET_ID_MASTER;

    if (!spreadsheetIdMaster) {
      return NextResponse.json({ error: "Master Spreadsheet ID is not configured." }, { status: 500 });
    }

    const sheetName = "Link & Bugs"; // Exact tab name

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdMaster,
        range: `'${sheetName}'`, // Wrapped in quotes for spaces
      });
    } catch (err) {
      return NextResponse.json({ error: `Could not read sheet "${sheetName}". Ensure the tab name is exact.` }, { status: 404 });
    }

    const rows = response.data.values || [];

    // 1. Find the Date column (Dates are in row index 0)
    let dateColIndex = -1;
    for (let c = 0; c < rows[0].length; c++) {
      if (rows[0][c] && rows[0][c].trim() === date) {
        dateColIndex = c;
        break;
      }
    }

    if (dateColIndex === -1) {
      return NextResponse.json({ error: `Could not find column for date: ${date}`, isDateMissing: true }, { status: 404 });
    }

    // 2. Find the User row in Column A
    let userRowIndex = -1;
    for (let r = 0; r < rows.length; r++) {
      if (rows[r][0] && rows[r][0].trim().toLowerCase() === user.toLowerCase()) {
        userRowIndex = r;
        break;
      }
    }

    if (userRowIndex === -1) {
      return NextResponse.json({ error: `Could not find user row for: ${user} in Column A` }, { status: 404 });
    }

    // 3. Map metric labels to row indices
    const rowMapping = {};
    
    // "Availability" is typically in Column A, one row before the user's name
    if (userRowIndex > 0 && (rows[userRowIndex - 1][0] || "").trim().toLowerCase().includes("availability")) {
      rowMapping["availability"] = userRowIndex - 1;
    } else if (userRowIndex > 1 && (rows[userRowIndex - 2][0] || "").trim().toLowerCase().includes("availability")) {
      rowMapping["availability"] = userRowIndex - 2;
    }

    // Search Column B for the metrics under this user
    // The user's first metric is usually on the exact same row as their name, in Column B
    for (let r = userRowIndex; r < Math.min(rows.length, userRowIndex + 15); r++) {
      // Stop searching if we hit another user in Column A (after the starting row)
      if (r > userRowIndex && rows[r][0] && rows[r][0].trim() !== "") {
        break;
      }
      
      const label = (rows[r][1] || "").trim().toLowerCase();
      
      if (label.includes("chat count")) rowMapping["chat count"] = r;
      else if (label.includes("calls answered") || label === "calls") rowMapping["calls answered"] = r;
      else if (label.includes("calls unanswered")) rowMapping["calls unanswered"] = r;
      else if (label.includes("new issues checked") || label.includes("tech reported")) rowMapping["new issues checked"] = r;
      else if (label.includes("checked issues from other filters") || label.includes("recheck count")) rowMapping["checked issues from other filters"] = r;
      else if (label.includes("ticket created") || label.includes("ticket creared") || label.includes("tickets created")) rowMapping["tickets created/updated"] = r;
      else if (label.includes("issues solved")) rowMapping["issues solved"] = r;
      else if (label.includes("tags assigned") || label.includes("team queries")) rowMapping["tags assigned"] = r;
      else if (label.includes("additional work")) rowMapping["additional work"] = r;
    }

    // 4. Prepare batch updates
    const colLetter = colIndexToLetter(dateColIndex);
    const updateData = [];

    const addUpdate = (label, value) => {
      if (rowMapping[label] !== undefined) {
        updateData.push({
          range: `'${sheetName}'!${colLetter}${rowMapping[label] + 1}`, // +1 for 1-based indexing
          values: [[value]]
        });
      }
    };

    addUpdate("chat count", metrics.chatCount || 0);
    addUpdate("calls answered", metrics.callsAnswered || 0);
    addUpdate("calls unanswered", metrics.callsUnanswered || 0);
    addUpdate("new issues checked", metrics.newIssuesChecked || 0);
    addUpdate("checked issues from other filters", metrics.checkedIssuesOtherFilters || 0);
    addUpdate("tickets created/updated", metrics.ticketsCreatedUpdated || 0);
    addUpdate("issues solved", metrics.issuesSolved || 0);
    addUpdate("tags assigned", metrics.tagsAssigned || 0);
    addUpdate("additional work", additionalWork || "");
    addUpdate("availability", "PRESENT");

    if (updateData.length === 0) {
      return NextResponse.json({ error: "Could not find matching metric rows under your user name." }, { status: 400 });
    }

    // 5. Execute batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdMaster,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updateData
      }
    });

    return NextResponse.json({ success: true, updatedCount: updateData.length, rowMapping });

  } catch (error) {
    console.error("Error updating Master Sheet:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
