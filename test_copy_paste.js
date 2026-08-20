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
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: ['Irfan!1:3']
    });
    
    const sheet = res.data.sheets[0];
    const sheetId = sheet.properties.sheetId;
    const rowData = sheet.data[0].rowData;
    
    // row 0 has the main date. row 1 has 'Chat count updated'
    let lastDateCol = -1;
    let lastDate = "";
    const firstRowVals = rowData[0]?.values || [];
    const secondRowVals = rowData[1]?.values || [];
    
    for (let c = firstRowVals.length - 1; c >= 0; c--) {
      const val0 = firstRowVals[c]?.formattedValue;
      const val1 = secondRowVals[c]?.formattedValue;
      
      if (val0 && val0.trim() !== "" && val0.includes('/')) {
        if (val1 && val1.trim().toLowerCase() === 'chat count updated') {
           lastDateCol = c;
           lastDate = val0;
           break;
        }
      }
    }
    
    console.log("Last date col:", lastDateCol, "Date:", lastDate, "Sheet ID:", sheetId);
    
    // We assume the block is 12 columns wide.
    const startCol = lastDateCol;
    const endCol = startCol + 12; // 12 columns wide
    
    // User wants ONE empty column gap. So new block starts at endCol + 1.
    const newStartCol = endCol + 1;
    const newEndCol = newStartCol + 12;
    
    console.log(`Copying from ${startCol}-${endCol} to ${newStartCol}-${newEndCol}`);
  } catch(e) {
    console.error(e);
  }
}
run();
