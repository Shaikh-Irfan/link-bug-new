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

export async function GET(request) {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdMaster = process.env.SPREADSHEET_ID_MASTER;

    const metadata = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetIdMaster });
    const tabNames = metadata.data.sheets.map(s => s.properties.title);

    let rowsData = [];
    if (tabNames.includes("Link & Bugs")) {
       const response = await sheets.spreadsheets.values.get({
         spreadsheetId: spreadsheetIdMaster,
         range: "'Link & Bugs'", // Add quotes around the tab name just in case
       });
       const rows = response.data.values || [];
       rowsData = rows.map((r, idx) => ({
         index: idx,
         colA: r[0] || "",
         colB: r[1] || ""
       }));
    }

    return NextResponse.json({ rowsData });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
