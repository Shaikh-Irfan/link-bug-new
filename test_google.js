const fs = require('fs');
const { google } = require('googleapis');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2].replace(/\\n/g, '\n');
});

async function run() {
  try {
    let privateKey = env.GOOGLE_PRIVATE_KEY || "";
    if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.trim()}\n-----END PRIVATE KEY-----\n`;
    }
    
    console.log("Email:", env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log("Key format valid:", privateKey.includes("BEGIN PRIVATE KEY"));

    const auth = new google.auth.JWT(
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log("Fetching...");
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.SPREADSHEET_ID_ATM,
      range: 'Ticket Tracker!A:E'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
