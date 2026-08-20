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
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.SPREADSHEET_ID_ATM,
      range: 'Irfan!1:3' // Fetch first 3 rows
    });
    
    const rows = res.data.values;
    // We want to find the width of the last block.
    // Let's find the last date in row 0
    let lastDateCol = -1;
    let lastDate = "";
    for (let c = rows[0].length - 1; c >= 0; c--) {
      if (rows[0][c] && rows[0][c].trim() !== "" && rows[0][c].includes('/')) {
        lastDateCol = c;
        lastDate = rows[0][c];
        // Wait, AI date is also a date!
        // The main block date is usually followed by a specific header in Row 1.
        if (rows[1][c] && rows[1][c].trim().toLowerCase() === 'chat count updated') {
           break;
        }
      }
    }
    
    console.log("Last Block Start Col:", lastDateCol, "Date:", lastDate);
    // Find where the next block starts (if any, but there isn't one, so let's find the width).
    // The width is from `lastDateCol` until we hit the end of the array, or a maximum of 15 columns.
    for (let r=0; r<3; r++) {
       console.log(`Row ${r}:`, rows[r]?.slice(lastDateCol, lastDateCol + 15));
    }
    
  } catch (err) {
    console.error(err.message);
  }
}
run();
