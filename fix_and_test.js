const fs = require('fs');
const { google } = require('googleapis');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2].replace(/\\n/g, '\n');
});

function colIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    let temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

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
  const spreadsheetIdAtm = env.SPREADSHEET_ID_ATM;
  const user = 'Irfan';
  
  try {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdAtm,
        range: `${user}!1:3`
    });
    const rows = res.data.values;
    
    // find the 03/06 date col (which we know is at PZ)
    let lastDateCol = -1;
    let lastDate = "";
    for (let c = rows[0].length - 1; c >= 0; c--) {
        if (rows[0][c] && rows[0][c].trim() !== "" && rows[0][c].includes('/')) {
          if (rows[1] && rows[1][c] && rows[1][c].trim().toLowerCase() === 'chat count updated') {
             // We want the original 03/06 block
             if (rows[0][c].includes('03/06')) {
                 lastDateCol = c;
                 lastDate = rows[0][c];
                 break;
             }
          }
        }
    }
    
    console.log("Found 03/06 at", lastDateCol, colIndexToLetter(lastDateCol));
    
    const nextDateStr = "04/06/2026";
    const newStartCol = lastDateCol + 13;
    const colLetterStart = colIndexToLetter(newStartCol);
    const colLetterEnd = colIndexToLetter(newStartCol + 12);
    
    // Get sheetId
    const sheetRes = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetIdAtm,
        includeGridData: false
    });
    const sheetId = sheetRes.data.sheets.find(s => s.properties.title === user).properties.sheetId;

    // 1. First, clear EVERYTHING from newStartCol to the end of the sheet to wipe out the bad block
    await sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetIdAtm,
        range: `${user}!${colLetterStart}1:ZZ1000` // ZZ is far enough
    });

    // 2. batchUpdate to copyPaste
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetIdAtm,
        requestBody: {
            requests: [
                {
                    copyPaste: {
                        source: { sheetId, startColumnIndex: lastDateCol, endColumnIndex: lastDateCol + 12 },
                        destination: { sheetId, startColumnIndex: newStartCol, endColumnIndex: newStartCol + 12 },
                        pasteType: "PASTE_NORMAL",
                        pasteOrientation: "NORMAL"
                    }
                }
            ]
        }
    });
    
    // 3. Clear data below row 3
    await sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetIdAtm,
        range: `${user}!${colLetterStart}4:${colLetterEnd}1000`
    });
    
    // 4. Update the dates
    const dateUpdates = [
        [nextDateStr, "", "", "", "", "", "", "", "", "", "", ""]
    ];
    await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdAtm,
        range: `${user}!${colLetterStart}1:${colLetterEnd}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: dateUpdates }
    });
    
    console.log("Successfully created fixed block at", colLetterStart);
  } catch(e) {
    console.error(e);
  }
}
run();
