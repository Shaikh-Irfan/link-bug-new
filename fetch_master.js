import { google } from "googleapis";
import fs from "fs";

const env = fs.readFileSync('.env.local', 'utf-8');
const processEnv = {};
env.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key) {
      let val = rest.join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      processEnv[key] = val;
    }
  }
});

const getAuth = () => {
  let privateKey = processEnv.GOOGLE_PRIVATE_KEY || "";
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.trim()}\n-----END PRIVATE KEY-----\n`;
  } else {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return new google.auth.JWT({
    email: processEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
};

async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetIdMaster = processEnv.SPREADSHEET_ID_MASTER;

  const metadata = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetIdMaster });
  console.log("Tabs in Master Sheet:");
  metadata.data.sheets.forEach(s => console.log(s.properties.title));

  const tabName = metadata.data.sheets[0].properties.title;
  console.log(`\nFetching tab: ${tabName}...`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdMaster,
    range: tabName,
  });

  const rows = response.data.values || [];
  for (let r = 0; r < Math.min(30, rows.length); r++) {
    const rowContent = rows[r].map(c => c ? c.substring(0, 15) : '').slice(0, 10).join(" | ");
    console.log(`Row ${r}: ${rowContent}`);
  }
}

main().catch(console.error);
