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
    const { id, escalated } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    const rowNum = id + 2;

    // 1. Get the sheetId for "Ticket Tracker" tab
    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    });
    
    const targetSheet = sheetRes.data.sheets.find(s => s.properties.title.trim().toLowerCase() === "ticket tracker");
    if (!targetSheet) {
      const titles = sheetRes.data.sheets.map(s => `'${s.properties.title}'`).join(", ");
      throw new Error(`Ticket Tracker tab not found. Available: ${titles}`);
    }
    const sheetId = targetSheet.properties.sheetId;

    // 2. Prepare the background color format for Column C (index 2)
    const colorFormat = escalated ? {
      red: 243 / 255.0,
      green: 156 / 255.0,
      blue: 18 / 255.0,
      alpha: 1.0
    } : {
      red: 1.0,
      green: 1.0,
      blue: 1.0,
      alpha: 1.0
    };

    const requests = [
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowNum - 1,
            endRowIndex: rowNum,
            startColumnIndex: 2,
            endColumnIndex: 3
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: colorFormat
            }
          },
          fields: "userEnteredFormat.backgroundColor"
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });

    // 3. Update the boolean flag in Column I
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Ticket Tracker!I${rowNum}:I${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[escalated ? "TRUE" : "FALSE"]]
      }
    });

    return NextResponse.json({ success: true, escalated });
  } catch (error) {
    console.error("Error escalating ticket:", error);
    return NextResponse.json({ error: error.stack }, { status: 500 });
  }
}
