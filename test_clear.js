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
    // let's clear the dummy column we created at 480
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Irfan!RB4:RM1000' // RB is 480 (480 = 18*26 + 12 = R L? Wait. let's just use col letters)
    });
    console.log("Cleared values");
  } catch(e) {
    console.error(e);
  }
}
run();
