import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const getAuth = () => {
  let privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").trim();
  privateKey = privateKey.replace(/^[\"']|[\"']$/g, "");
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  } else {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim().replace(/^[\"']|[\"']$/g, "");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
};

const mapUserTab = (user) => {
  const mapping = {
    "Sneha": "Sneha ",
    "Jeffin": "Jeffin",
    "Priyal": "Priyal",
    "Irfan": "Irfan",
    "Payal": "Payal",
    "Siddhant": "Siddhant "
  };
  return mapping[user] || user;
};


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  const date = searchParams.get("date");

  if (!user || !date) {
    return NextResponse.json({ error: "Missing user or date" }, { status: 400 });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID_ATM;

    if (!spreadsheetId || spreadsheetId === "your-atm-sheet-id") {
      throw new Error("SPREADSHEET_ID_ATM is missing");
    }

    const tabName = mapUserTab(user);

    // Fetch the specific user tab entirely
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'`,
    });

    const rows = response.data.values || [];

    // Initialize empty records map
    const records = {
      chatCountUpdated: [], newIssuesChecked: [], checkedFilters: [],
      callsAnswered: [], callsUnanswered: [], issuesResolved: [],
      tagsAssigned: [], aiCount: []
    };

    // Loose matching for headers
    const headerMapping = {
      "crm chats": "chatCountUpdated",
      "issue check": "newIssuesChecked",
      "call received": "callsAnswered",
      "call not received": "callsUnanswered",
      "resolved": "issuesResolved",
      "additional work": "tagsAssigned",
      "chat count updated": "chatCountUpdated",
      "new issues checked": "newIssuesChecked",
      "checked filters": "checkedFilters",
      "checked issues from other filters": "checkedFilters",
      "checked issue": "checkedFilters",
      "calls answered": "callsAnswered",
      "calls unanswered": "callsUnanswered",
      "issues resolved": "issuesResolved",
      "tags assigned": "tagsAssigned",
      "ai count": "aiCount"
    };

    // 1. Find the Date cell
    let dateRow = -1;
    let dateCol = -1;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] && rows[r][c].trim() === date) {
          dateRow = r;
          dateCol = c;
          break;
        }
      }
      if (dateRow !== -1) break;
    }

    // 2. Parse the block if Date is found
    if (dateRow !== -1 && rows.length > dateRow + 1) {
      const headers = rows[dateRow + 1];
      const seenKeys = new Set();
      
      for (let c = dateCol; c < headers.length; c++) {
        const headerStr = (headers[c] || "").trim().toLowerCase();
        if (!headerStr) {
          continue;
        }

        let targetKey = headerMapping[headerStr];
        if (targetKey) {
          if (seenKeys.has(targetKey)) {
            // We've hit a duplicate column which means we've crossed into the next date block.
            break;
          }
          seenKeys.add(targetKey);

          if (targetKey === 'aiCount') {
            const aiDate = (rows[dateRow] && rows[dateRow][c]) ? rows[dateRow][c].trim() : "";
            records.aiDate = aiDate;
            
            const catIssues = [];
            const qcIssues = [];
            const ongoingIssues = [];
            const totalCount = [];
            
            for (let r = dateRow + 3; r < rows.length; r++) {
               if (rows[r][c]?.trim()) catIssues.push(rows[r][c].trim());
               if (rows[r][c+1]?.trim()) qcIssues.push(rows[r][c+1].trim());
               if (rows[r][c+2]?.trim()) ongoingIssues.push(rows[r][c+2].trim());
               if (rows[r][c+3]?.trim()) totalCount.push(rows[r][c+3].trim());
            }
            
            for (const id of totalCount) {
               const categories = [];
               if (catIssues.includes(id)) categories.push("Category Issues Found");
               if (qcIssues.includes(id)) categories.push("QC Issues Found");
               if (ongoingIssues.includes(id)) categories.push("Ongoing Issues Resolved");
               
               records.aiCount.push({ id, categories });
            }
          } else {
            // Read IDs going downwards
            for (let r = dateRow + 3; r < rows.length; r++) {
              const val = rows[r][c];
              if (val && val.trim() !== "") {
                records[targetKey].push(val.trim());
              }
            }
          }
        }
      }
    }

    // Find last available date
    let lastAvailableDate = "";
    if (rows[0]) {
      for (let c = rows[0].length - 1; c >= 0; c--) {
        if (rows[0][c] && rows[0][c].trim() !== "" && rows[0][c].includes('/')) {
          if (rows[1] && rows[1][c] && rows[1][c].trim().toLowerCase() === 'chat count updated') {
             lastAvailableDate = rows[0][c].trim();
             break;
          }
        }
      }
    }

    return NextResponse.json({ 
      records,
      tableExists: dateRow !== -1,
      lastAvailableDate
    });
  } catch (error) {
    console.error(`Error fetching records for ${user}:`, error);
    // Return empty state if sheet doesn't exist yet or other error
    return NextResponse.json({
      records: {
        chatCountUpdated: [], newIssuesChecked: [], checkedFilters: [],
        callsAnswered: [], callsUnanswered: [], issuesResolved: [],
        tagsAssigned: [], aiCount: []
      },
      tableExists: false,
      lastAvailableDate: "",
      error: error.message
    });
  }
}

// Helper to convert column index (0-based) to A1 notation letter (A, B, C, ..., Z, AA, AB...)
function colIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    let temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user, date, columnKey, items, categories, action, newDate } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdAtm = process.env.SPREADSHEET_ID_ATM;

    const tabName = mapUserTab(user);

    // Fetch the specific user tab to map where to write
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdAtm,
      range: `'${tabName}'`,
    });

    const rows = response.data.values || [];
    
    const headerMapping = {
      "crm chats": "chatCountUpdated",
      "issue check": "newIssuesChecked",
      "call received": "callsAnswered",
      "call not received": "callsUnanswered",
      "resolved": "issuesResolved",
      "additional work": "tagsAssigned",
      "chat count updated": "chatCountUpdated",
      "new issues checked": "newIssuesChecked",
      "checked filters": "checkedFilters",
      "checked issues from other filters": "checkedFilters",
      "checked issue": "checkedFilters",
      "calls answered": "callsAnswered",
      "calls unanswered": "callsUnanswered",
      "issues resolved": "issuesResolved",
      "tags assigned": "tagsAssigned",
      "ai count": "aiCount"
    };

    if (action === 'createNewBlock') {
      let lastDateCol = -1;
      let lastDate = "";
      for (let c = rows[0].length - 1; c >= 0; c--) {
        if (rows[0][c] && rows[0][c].trim() !== "" && rows[0][c].includes('/')) {
          if (rows[1] && rows[1][c] && rows[1][c].trim().toLowerCase() === 'chat count updated') {
             lastDateCol = c;
             lastDate = rows[0][c];
             break;
          }
        }
      }
      
      if (lastDateCol === -1) throw new Error("Could not find the last date block.");
      
      const nextDateStr = date;
      
      const newStartCol = lastDateCol + 13;
      const colLetterStart = colIndexToLetter(newStartCol);
      const colLetterEnd = colIndexToLetter(newStartCol + 12);
      
      const sheetRes = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetIdAtm,
        includeGridData: false
      });
      const targetSheet = sheetRes.data.sheets.find(s => s.properties.title === tabName);
      if (!targetSheet) {
        throw new Error(`Sheet tab not found for user: ${tabName}`);
      }
      const sheetId = targetSheet.properties.sheetId;
      const currentCols = targetSheet.properties.gridProperties.columnCount;
      
      const requiredCols = newStartCol + 13;
      const requests = [];
      
      if (currentCols < requiredCols) {
        requests.push({
          appendDimension: {
            sheetId: sheetId,
            dimension: "COLUMNS",
            length: requiredCols - currentCols + 10 // Add a few extra to be safe
          }
        });
      }

      requests.push({
        copyPaste: {
          source: { sheetId, startColumnIndex: lastDateCol, endColumnIndex: lastDateCol + 12 },
          destination: { sheetId, startColumnIndex: newStartCol, endColumnIndex: newStartCol + 12 },
          pasteType: "PASTE_NORMAL",
          pasteOrientation: "NORMAL"
        }
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetIdAtm,
        requestBody: { requests }
      });
      
      await sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetIdAtm,
        range: `'${tabName}'!${colLetterStart}4:${colLetterEnd}1000`
      });
      
      const dateUpdates = [
        [nextDateStr, "", "", "", "", "", "", "", "", "", "", ""]
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdAtm,
        range: `'${tabName}'!${colLetterStart}1:${colLetterEnd}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: dateUpdates }
      });
      
      return NextResponse.json({ success: true, newDate: nextDateStr });
    }

    // 1. Find the Date cell
    let dateRow = -1;
    let dateCol = -1;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] && rows[r][c].trim() === date) {
          dateRow = r;
          dateCol = c;
          break;
        }
      }
      if (dateRow !== -1) break;
    }

    if (dateRow === -1) {
      throw new Error(`Date block for ${date} not found in the sheet.`);
    }

    // 2. Find the column matching the target columnKey
    let baseTargetCol = -1;
    const headers = rows[dateRow + 1] || [];
    for (let c = dateCol; c < headers.length; c++) {
      const headerStr = (headers[c] || "").trim().toLowerCase();
      if (headerMapping[headerStr] === columnKey) {
        baseTargetCol = c;
        break;
      }
    }

    if (baseTargetCol === -1) {
      throw new Error(`Target column for ${columnKey} not found under date ${date}.`);
    }

    // Handle updateAiDate action specifically
    if (action === 'updateAiDate' && columnKey === 'aiCount') {
      const colLetter = colIndexToLetter(baseTargetCol);
      const rangeToUpdate = `'${tabName}'!${colLetter}${dateRow + 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdAtm,
        range: rangeToUpdate,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newDate]] }
      });
      return NextResponse.json({ success: true });
    }

    // For appending items, calculate the exact target column
    const targetCol = columnKey === 'aiCount' ? baseTargetCol + 3 : baseTargetCol;

    // 3. Find the first empty cell in this column
    // Data for all columns starts at dateRow+3 (row index 3) because row 1 and 2 are headers/subheaders
    let insertRowIndex = dateRow + 3;
    while (insertRowIndex < rows.length) {
      const rowArr = rows[insertRowIndex] || [];
      const val = rowArr[targetCol];
      if (!val || val.trim() === "") {
        break; // found the first empty cell
      }
      insertRowIndex++;
    }

    // 4. Calculate A1 notation and update Total count
    const colLetter = colIndexToLetter(targetCol);
    const rangeToUpdate = `'${tabName}'!${colLetter}${insertRowIndex + 1}`;

    // We update with the array of items arranged vertically
    const appendValues = items.map(id => [id]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdAtm,
      range: rangeToUpdate,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: appendValues
      }
    });

    // 5. If aiCount and we have selected categories, update them as well
    if (columnKey === 'aiCount' && categories && categories.length > 0) {
      const updateCategoryCol = async (catIndexOffset) => {
        const catTargetCol = baseTargetCol + catIndexOffset;
        let catInsertRowIndex = dateRow + 3;
        while (catInsertRowIndex < rows.length) {
          const val = rows[catInsertRowIndex] && rows[catInsertRowIndex][catTargetCol];
          if (!val || val.trim() === "") break;
          catInsertRowIndex++;
        }
        
        const catColLetter = colIndexToLetter(catTargetCol);
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetIdAtm,
          range: `'${tabName}'!${catColLetter}${catInsertRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: appendValues }
        });
      };

      if (categories.includes("Category Issues Found")) {
        await updateCategoryCol(0);
      }
      if (categories.includes("QC Issues Found")) {
        await updateCategoryCol(1);
      }
      if (categories.includes("Ongoing Issues Resolved")) {
        await updateCategoryCol(2);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error appending record:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { user, date, columnKey, indexToEdit, newValue } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdAtm = process.env.SPREADSHEET_ID_ATM;

    const tabName = mapUserTab(user);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdAtm,
      range: `'${tabName}'`,
    });

    const rows = response.data.values || [];
    
    const headerMapping = {
      "crm chats": "chatCountUpdated",
      "issue check": "newIssuesChecked",
      "call received": "callsAnswered",
      "call not received": "callsUnanswered",
      "resolved": "issuesResolved",
      "additional work": "tagsAssigned",
      "chat count updated": "chatCountUpdated",
      "new issues checked": "newIssuesChecked",
      "checked filters": "checkedFilters",
      "checked issues from other filters": "checkedFilters",
      "checked issue": "checkedFilters",
      "calls answered": "callsAnswered",
      "calls unanswered": "callsUnanswered",
      "issues resolved": "issuesResolved",
      "tags assigned": "tagsAssigned",
      "ai count": "aiCount"
    };

    let dateRow = -1;
    let baseTargetCol = -1;

    for (let r = 0; r < rows.length; r++) {
      if (rows[r]) {
        for (let c = 0; c < rows[r].length; c++) {
          if (rows[r][c] && rows[r][c].trim() === date) {
            const subRow = rows[r + 1];
            if (subRow) {
              for (let scanC = c; scanC < subRow.length && scanC < c + 15; scanC++) {
                const headerText = subRow[scanC] ? subRow[scanC].trim().toLowerCase() : "";
                for (const [key, val] of Object.entries(headerMapping)) {
                  if (headerText.includes(key) && val === columnKey) {
                    dateRow = r;
                    baseTargetCol = scanC;
                    break;
                  }
                }
                if (dateRow !== -1) break;
              }
            }
          }
          if (dateRow !== -1) break;
        }
      }
      if (dateRow !== -1) break;
    }

    if (dateRow === -1 || baseTargetCol === -1) {
      return NextResponse.json({ error: "Date block or column not found" }, { status: 404 });
    }

    const targetCol = columnKey === 'aiCount' ? baseTargetCol + 3 : baseTargetCol;
    
    // Calculate the precise cell row corresponding to the index
    const exactRowIndex = dateRow + 3 + indexToEdit;
    
    const colLetter = colIndexToLetter(targetCol);
    const rangeToUpdate = `'${tabName}'!${colLetter}${exactRowIndex + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetIdAtm,
      range: rangeToUpdate,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newValue]]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error editing record:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { user, date, columnKey, indicesToDelete } = body;

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetIdAtm = process.env.SPREADSHEET_ID_ATM;

    const tabName = mapUserTab(user);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdAtm,
      range: `'${tabName}'`,
    });

    const rows = response.data.values || [];
    
    const headerMapping = {
      "crm chats": "chatCountUpdated",
      "issue check": "newIssuesChecked",
      "call received": "callsAnswered",
      "call not received": "callsUnanswered",
      "resolved": "issuesResolved",
      "additional work": "tagsAssigned",
      "chat count updated": "chatCountUpdated",
      "new issues checked": "newIssuesChecked",
      "checked filters": "checkedFilters",
      "checked issues from other filters": "checkedFilters",
      "checked issue": "checkedFilters",
      "calls answered": "callsAnswered",
      "calls unanswered": "callsUnanswered",
      "issues resolved": "issuesResolved",
      "tags assigned": "tagsAssigned",
      "ai count": "aiCount"
    };

    // Find date cell
    let dateRow = -1;
    let dateCol = -1;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] && rows[r][c].trim() === date) {
          dateRow = r;
          dateCol = c;
          break;
        }
      }
      if (dateRow !== -1) break;
    }

    if (dateRow === -1) throw new Error(`Date block not found.`);

    // Find target column
    let baseTargetCol = -1;
    const headers = rows[dateRow + 1] || [];
    for (let c = dateCol; c < headers.length; c++) {
      const headerStr = (headers[c] || "").trim().toLowerCase();
      if (headerMapping[headerStr] === columnKey) {
        baseTargetCol = c;
        break;
      }
    }

    if (baseTargetCol === -1) throw new Error(`Target column not found.`);
    
    if (columnKey === 'aiCount') {
      // Clean up all 4 columns for AI Count
      for (let offset = 0; offset <= 3; offset++) {
        const col = baseTargetCol + offset;
        const oldItems = [];
        let rIdx = dateRow + 3; // sub-headers are at dateRow+2
        while (rIdx < rows.length) {
          const val = rows[rIdx][col];
          if (!val || val.trim() === "") break;
          oldItems.push(val.trim());
          rIdx++;
        }

        const newItems = oldItems.filter((_, idx) => !indicesToDelete.includes(idx));
        const updateValues = [];
        for (let i = 0; i < oldItems.length; i++) {
          if (i < newItems.length) {
            updateValues.push([newItems[i]]);
          } else {
            updateValues.push([""]);
          }
        }

        if (updateValues.length > 0) {
          const colLetter = colIndexToLetter(col);
          const rangeToUpdate = `'${tabName}'!${colLetter}${dateRow + 4}`; // 1-indexed
          await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetIdAtm,
            range: rangeToUpdate,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: updateValues }
          });
        }
      }
    } else {
      // Standard cleanup for other columns
      const oldItems = [];
      let rIdx = dateRow + 3;
      while (rIdx < rows.length) {
        const rowArr = rows[rIdx] || [];
        const val = rowArr[baseTargetCol];
        if (!val || val.trim() === "") break;
        oldItems.push(val.trim());
        rIdx++;
      }

      const newItems = oldItems.filter((_, idx) => !indicesToDelete.includes(idx));
      
      const updateValues = [];
      for (let i = 0; i < oldItems.length; i++) {
        if (i < newItems.length) {
          updateValues.push([newItems[i]]);
        } else {
          updateValues.push([""]); // Pad to clear
        }
      }

      if (updateValues.length > 0) {
        const colLetter = colIndexToLetter(baseTargetCol);
        const rangeToUpdate = `'${tabName}'!${colLetter}${dateRow + 4}`;
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetIdAtm,
          range: rangeToUpdate,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: updateValues }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting records:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
