// URLs of data sources:
const DATA_SOURCE_URLS = {
  NMDC_DATA_PORTAL_STATS: "https://data.microbiomedata.org/api/stats",
  NMDC_RUNTIME_SCHEMA_COLLECTION_STATS: "https://api.microbiomedata.org/nmdcschema/collection_stats",
  NMDC_EDGE_PROJECTS: "https://flask.nmdc-edge.org/projects",
  NMDC_EDGE_USERS: "https://flask.nmdc-edge.org/users",
};

// Identifiers of Google Sheets elements.
const GOOGLE_SHEETS_IDENTIFIERS = {
  DOCUMENT_URL: config.GOOGLE_SHEETS_DOCUMENT_URL,
  HEADER_ROW_NUMBER: 1, // note: row numbers are 1-based (so are column numbers)
};

/** 
 * Helper function that returns an array of headers of data (i.e. non-timestamp) columns.
 * 
 * References:
 * - https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow,-column,-numrows,-numcolumns
 * - https://developers.google.com/apps-script/reference/spreadsheet/range#getValues()
 */
function getDataHeadersFromSheet(sheet) {
  const rowNumOfHeader = GOOGLE_SHEETS_IDENTIFIERS.HEADER_ROW_NUMBER;
  const colNumAfterTimestamp = 2; // we will omit the columns to the left of this one
  const dataHeaderRange = sheet.getRange(rowNumOfHeader, colNumAfterTimestamp, 1, sheet.getLastColumn());
  const dataHeaderRangeValues = dataHeaderRange.getValues(); // returns a grid (i.e. multi-dimensional array) of cell values
  const dataHeaders = dataHeaderRangeValues[0]; // gets the first row (in this case, it's the only row) of cell values
  return dataHeaders;
}

/** 
 * Helper function that returns a copy of the specified array, with a timestamp as its first element.
 */
function prependTimestampToDataRow(dataRow) {
  const timestamp = new Date();
  return [timestamp, ...dataRow];
}

/**
 * Helper function that appends a timestamped data row to the specified Google Sheets sheet,
 * and returns the sheet (useful for method chaining).
 * 
 * Reference: https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendRow(Object)
 */
function appendRowtoSheet(row, sheet) {
  Logger.log(`Appending this row to the sheet: ${row}`);
  return sheet.appendRow(row);
}

/** 
 * Helper function that fetches data from a URL and parses it as JSON, returning the parsed value.
 *
 * Reference: https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetch(String) 
 */
function fetchAsJSON(url) {
  const response = UrlFetchApp.fetch(url);
  const jsonStr = response.getContentText();
  Logger.log(`Fetched data: ${jsonStr}`);

  return JSON.parse(jsonStr);
}

function fetchNMDCDataPortalStats(spreadsheet, sheetName) {
  // Fetch stats data from the data portal API.
  const obj = fetchAsJSON(DATA_SOURCE_URLS.NMDC_DATA_PORTAL_STATS);

  // Get the headers of the data (i.e. non-timestamp) columns from the Google Sheets sheet.
  // Reference: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#getsheetbynamename
  const sheet = spreadsheet.getSheetByName(sheetName);
  const dataHeaders = getDataHeadersFromSheet(sheet);

  // Arrange the stat data into an array, so each value aligns with the header matching the value's key.
  //
  // Note: If a header exists for the value, the value will be stored at that header's index.
  //       If no header exists for a value, the value will be discarded (i.e. not stored).
  //       If no value exists for a header, that "cell" will remain empty.
  //
  const dataRow = [];
  for (const [key, value] of Object.entries(obj)) {
    const colIndex = dataHeaders.indexOf(key);
    if (colIndex !== -1) {
      dataRow[colIndex] = value;
    } else {
      Logger.log(`Column "${key}" not found in sheet. Skipping storing value "${value}".`);
    }
  }

  // Append a timestamped version of the data row to the Google Sheets sheet.
  appendRowtoSheet(prependTimestampToDataRow(dataRow), sheet);
}

function fetchNMDCRuntimeStats(spreadsheet, sheetName) {
  // Fetch stats data from the runtime API.
  const arr = fetchAsJSON(DATA_SOURCE_URLS.NMDC_RUNTIME_SCHEMA_COLLECTION_STATS);

  // Get the headers of the data (i.e. non-timestamp) columns from the Google Sheets sheet.
  const sheet = spreadsheet.getSheetByName(sheetName);
  const dataHeaders = getDataHeadersFromSheet(sheet);

  // Arrange the stat data into an array, so each value aligns with the correct header.
  const dataRow = [];
  for (const obj of arr) {
    // Extract values from this object.
    const { ns, storageStats: { count } } = obj;

    const targetDataHeader = ns.replace(/^nmdc\.(.+)$/, "$1_count"); // replace "nmdc.foo" with "foo_count"
    Logger.log(`key: ${ns} -> targetDataHeader: ${targetDataHeader}`);

    const colIndex = dataHeaders.indexOf(targetDataHeader);
    if (colIndex !== -1) {
      dataRow[colIndex] = count;
    } else {
      Logger.log(`Column "${targetDataHeader}" not found in sheet. Skipping storing value "${count}".`);
    }
  }

  // Append a timestamped version of the data row to the Google Sheets sheet.
  appendRowtoSheet(prependTimestampToDataRow(dataRow), sheet);
}

function fetchNMDCEDGEStats(spreadsheet, sheetName) {
  // Fetch data from the NMDC EDGE API.
  const projectsObj = fetchAsJSON(DATA_SOURCE_URLS.NMDC_EDGE_PROJECTS);
  const usersObj = fetchAsJSON(DATA_SOURCE_URLS.NMDC_EDGE_USERS);

  // Get the headers of the data (i.e. non-timestamp) columns from the Google Sheets sheet.
  const sheet = spreadsheet.getSheetByName(sheetName);
  const dataHeaders = getDataHeadersFromSheet(sheet);

  // Arrange the stat data into an array, so each value aligns with the correct header.
  const dataRow = [];
  const headerOfNumProjectsCol = "num_projects";
  const indexOfNumProjectsCol = dataHeaders.indexOf(headerOfNumProjectsCol);
  if (indexOfNumProjectsCol !== -1) {
    dataRow[indexOfNumProjectsCol] = projectsObj.num_projects;
  } else {
    Logger.log(`Column "${headerOfNumProjectsCol}" not found in sheet. Skipping storing value "${projectsObj.num_projects}".`);
  }
  const headerOfNumUsersCol = "num_users";
  const indexOfNumUsersCol = dataHeaders.indexOf(headerOfNumUsersCol);
  if (indexOfNumUsersCol !== -1) {
    dataRow[indexOfNumUsersCol] = usersObj.num_users;
  } else {
    Logger.log(`Column "${headerOfNumUsersCol}" not found in sheet. Skipping storing value "${usersObj.num_users}".`);
  }

  // Append a timestamped version of the data row to the Google Sheets sheet.
  appendRowtoSheet(prependTimestampToDataRow(dataRow), sheet);
}

function main() {
  // Get the Google Sheets spreadsheet in which we will store the metrics.
  // Reference: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openbyurlurl
  const spreadsheet = SpreadsheetApp.openByUrl(GOOGLE_SHEETS_IDENTIFIERS.DOCUMENT_URL);

  // Fetch metrics from the data sources.
  fetchNMDCDataPortalStats(spreadsheet, "data.NMDC_DATA_PORTAL_STATS");
  fetchNMDCRuntimeStats(spreadsheet, "data.NMDC_RUNTIME_STATS");
  fetchNMDCEDGEStats(spreadsheet, "data.NMDC_EDGE_STATS");
}
