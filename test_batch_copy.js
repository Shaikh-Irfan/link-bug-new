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
  const spreadsheetId = env.SPREADSHEET_ID_ATM;
  
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false // We just need sheet ID
    });
    
    // Hardcode Irfan sheet id. Let's find it.
    const sheet = res.data.sheets.find(s => s.properties.title === 'Irfan');
    const sheetId = sheet.properties.sheetId;

    // We know 03/06/2026 is at col 441 (PZ).
    const startCol = 441;
    const endCol = startCol + 12; // 12 cols wide
    
    // We will clear whatever I messed up from 454 to end.
    // wait, it's safer to just test on a completely new column far away, e.g. 1000
    const newStartCol = 480; 
    const newEndCol = 480 + 12;

    const batchUpdateRequest = {
      requests: [
        {
          copyPaste: {
            source: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1000,
              startColumnIndex: startCol,
              endColumnIndex: endCol
            },
            destination: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1000,
              startColumnIndex: newStartCol,
              endColumnIndex: newEndCol
            },
            pasteType: "PASTE_NORMAL",
            pasteOrientation: "NORMAL"
          }
        }
      ]
    };
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: batchUpdateRequest
    });
    
    console.log("Copied formatting successfully");
  } catch(e) {
    console.error(e);
  }
}
run();
