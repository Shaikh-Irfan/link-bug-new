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
      range: 'Irfan!1:15'
    });
    const rows = res.data.values;
    
    // Find 04/06 block
    let dateCol = -1;
    for (let c = rows[0].length - 1; c >= 0; c--) {
        if (rows[0][c] === '04/06/2026') {
            dateCol = c;
            break;
        }
    }
    
    if (dateCol !== -1) {
        console.log("Found 04/06 at column index:", dateCol);
        for(let r=0; r<10; r++) {
            if (rows[r]) {
                console.log(`Row ${r}:`, rows[r].slice(dateCol, dateCol + 13));
            }
        }
    } else {
        console.log("04/06 not found!");
    }
  } catch(e) {
    console.error(e);
  }
}
run();
