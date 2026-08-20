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
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: env.SPREADSHEET_ID_ATM,
      range: 'Irfan!1:15'
    });
    const rows = res.data.values;
    
    // Find 04/06 block
    let dateCol = -1;
    for (let c = rows[0].length - 1; c >= 0; c--) {
        if (rows[0][c] === '04/06/2026') {
            dateCol = c;
            break;
        }
    }
    
    if (dateCol !== -1) {
        // the AI count block starts at dateCol + 8
        const aiCatCol = dateCol + 8;
        const aiQcCol = dateCol + 9;
        const aiOngCol = dateCol + 10;
        
        // Let's compact the Ongoing Issues Resolved column
        const ongoingColLetter = colIndexToLetter(aiOngCol);
        
        let ongoingValues = [];
        for (let r=3; r<rows.length; r++) {
            if (rows[r] && rows[r][aiOngCol] && rows[r][aiOngCol].trim() !== "") {
                ongoingValues.push([rows[r][aiOngCol]]);
            }
        }
        
        console.log("Ongoing values to compact:", ongoingValues);
        
        if (ongoingValues.length > 0) {
            // clear the column
            await sheets.spreadsheets.values.clear({
                spreadsheetId: env.SPREADSHEET_ID_ATM,
                range: `Irfan!${ongoingColLetter}4:${ongoingColLetter}1000`
            });
            
            // write compacted values
            await sheets.spreadsheets.values.update({
                spreadsheetId: env.SPREADSHEET_ID_ATM,
                range: `Irfan!${ongoingColLetter}4`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: ongoingValues }
            });
            console.log("Compacted successfully");
        }
    }
  } catch(e) {
    console.error(e);
  }
}
run();
