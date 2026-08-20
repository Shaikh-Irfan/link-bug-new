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
    // Inspect around column 411
    console.log("Header row:");
    console.log(rows[1].slice(410, 415));
    console.log("Data row 1:");
    console.log(rows[2].slice(410, 415));
    console.log("Data row 2:");
    console.log(rows[3]?.slice(410, 415));
  } catch (err) {
    console.error(err.message);
  }
}
run();
