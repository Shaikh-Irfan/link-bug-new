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
      range: 'Irfan!A1:AZ5'
    });
    const rows = res.data.values;
    // Find AI Count header
    for (let r = 0; r < rows.length; r++) {
      const idx = rows[r].findIndex(cell => cell && cell.toLowerCase().includes('ai count'));
      if (idx !== -1) {
         console.log('Found AI count at row', r, 'col', idx);
         console.log('Surrounding headers:', rows[r].slice(Math.max(0, idx - 2), idx + 3));
         console.log('Data below:', rows.slice(r+1, r+4).map(row => row.slice(Math.max(0, idx - 2), idx + 3)));
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}
run();
