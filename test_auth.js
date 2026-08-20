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

    const auth = new google.auth.JWT(
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    console.log("Authorizing...");
    const token = await auth.authorize();
    console.log("Token:", !!token.access_token);
  } catch (err) {
    console.error("Auth Error:", err);
  }
}
run();
