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
      range: 'Irfan'
    });
    const rows = res.data.values;
    // Find all occurrences of "ai count" or "Total count"
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] && rows[r][c].toLowerCase().includes('total count')) {
           console.log(`Row: ${r}, Col: ${c}, Value: "${rows[r][c]}"`);
           console.log(`  Row above: ${rows[r-1]?.[c-1]} | ${rows[r-1]?.[c]} | ${rows[r-1]?.[c+1]}`);
           console.log(`  Adjacent: ${rows[r][c-1]} | ${rows[r][c]} | ${rows[r][c+1]}`);
           console.log(`  Below 1: ${rows[r+1]?.[c-1]} | ${rows[r+1]?.[c]} | ${rows[r+1]?.[c+1]}`);
           console.log(`  Below 2: ${rows[r+2]?.[c-1]} | ${rows[r+2]?.[c]} | ${rows[r+2]?.[c+1]}`);
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}
run();
