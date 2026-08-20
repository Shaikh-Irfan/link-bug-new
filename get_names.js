import fs from "fs";
import { google } from "googleapis";

const env = fs.readFileSync('.env.local', 'utf-8');
const processEnv = {};
env.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key) {
      let val = rest.join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
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

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdMaster,
    range: "Link & Bugs",
  });

  const rows = response.data.values || [];
  console.log("Column A values:");
  for(let i = 0; i < rows.length; i++) {
    if(rows[i][0] && rows[i][0].trim() !== '') {
      console.log(`Row ${i}: ${rows[i][0]}`);
    }
  }
}
main().catch(console.error);
