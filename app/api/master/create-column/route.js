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
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "Missing required 'date' field" }, { status: 400 });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdMaster = process.env.SPREADSHEET_ID_MASTER;

    if (!spreadsheetIdMaster) {
      return NextResponse.json({ error: "Master Spreadsheet ID is not configured." }, { status: 500 });
    }

    const sheetName = "Link & Bugs";

    // 1. Fetch the first row to determine the last used column
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdMaster,
        range: `'${sheetName}'!1:1`, // Fetch only Row 1
      });
    } catch (err) {
      return NextResponse.json({ error: `Could not read sheet "${sheetName}". Ensure the tab name is exact.` }, { status: 404 });
    }

    const row1 = (response.data.values && response.data.values[0]) || [];

    // Find the last non-empty column index
    let lastColIndex = row1.length - 1;
    while (lastColIndex >= 0 && (!row1[lastColIndex] || row1[lastColIndex].trim() === "")) {
      lastColIndex--;
    }

    const lastDateStr = lastColIndex >= 0 ? row1[lastColIndex].trim() : "";

    function parseDateStr(str) {
      if (!str) return null;
      const parts = str.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          // ensure valid 4-digit year
          const year = y < 100 ? 2000 + y : y;
          return new Date(year, m, d);
        }
      }
      return null;
    }

    const lastDateObj = parseDateStr(lastDateStr);
    const targetDateObj = parseDateStr(date);

    const datesToAdd = [];
    if (lastDateObj && targetDateObj && lastDateObj < targetDateObj) {
      let curr = new Date(lastDateObj);
      curr.setDate(curr.getDate() + 1);
      // Cap at 100 columns to prevent infinite loops from bad inputs
      let maxCols = 100; 
      while (curr <= targetDateObj && maxCols > 0) {
        const dd = String(curr.getDate()).padStart(2, '0');
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const yyyy = curr.getFullYear();
        datesToAdd.push(`${dd}/${mm}/${yyyy}`);
        curr.setDate(curr.getDate() + 1);
        maxCols--;
      }
    } else {
      datesToAdd.push(date);
    }

    const dataUpdates = [];
    for (let i = 0; i < datesToAdd.length; i++) {
      const newColIndex = lastColIndex + 1 + i;
      const newColLetter = colIndexToLetter(newColIndex);
      dataUpdates.push({
        range: `'${sheetName}'!${newColLetter}1`,
        values: [[datesToAdd[i]]]
      });
    }

    // 2. Write the date strings to the top row
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetIdMaster,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: dataUpdates
      }
    });

    return NextResponse.json({ success: true, colsInserted: datesToAdd.length, lastDate: lastDateStr, targetDate: date });

  } catch (error) {
    console.error("Error creating Master Sheet column:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
