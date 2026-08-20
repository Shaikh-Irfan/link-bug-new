const fs = require('fs');
const { google } = require('googleapis');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2].replace(/\\n/g, '\n');
});

async function run() {
  let privateKey = env.GOOGLE_PRIVATE_KEY || "";
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.trim()}\n-----END PRIVATE KEY-----\n`;
  }
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const date = "01/06/2026";
  const user = "Irfan";
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SPREADSHEET_ID_ATM,
    range: user,
  });
  const rows = response.data.values || [];
  
  const headerMapping = { "ai count": "aiCount" };
  let dateRow = -1; let dateCol = -1;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] && rows[r][c].trim() === date) { dateRow = r; dateCol = c; break; }
    }
    if (dateRow !== -1) break;
  }
  
  const headers = rows[dateRow + 1] || [];
  for (let c = dateCol; c < headers.length; c++) {
    const headerStr = (headers[c] || "").trim().toLowerCase();
    if (headerMapping[headerStr] === "aiCount") {
      const aiDate = (rows[dateRow] && rows[dateRow][c]) ? rows[dateRow][c].trim() : "";
      console.log("DEBUG_AI_DATE:", { dateRow, c, val: rows[dateRow]?.[c], aiDate });
    }
  }
}
run();
