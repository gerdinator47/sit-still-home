const fs = require('fs');
const https = require('https');

// Spreadsheet details
const SPREADSHEET_ID = '1H9mOOrw0qTF4P6XWlDpIlVGLlF3SEcmVOdiWmtxWHjI';
const SHEET_NAME = 'Sheet1';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// Function to fetch CSV data
function fetchCSV() {
  return new Promise((resolve, reject) => {
    https.get(CSV_URL, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
      
      response.on('error', (error) => {
        reject(error);
      });
    });
  });
}

// Function to parse CSV and convert to JSON
function parseCSV(csvText) {
  const rows = csvText.split('\n').slice(1); // Skip header row
  
  return rows
    .map(row => {
      // Split the row by commas, but respect quoted values
      const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!values || values.length < 1) return null;
      
      // Clean up the values (remove quotes)
      const cleanValues = values.map(val => val.replace(/^"|"$/g, '').trim());
      
      return {
        imageUrl: cleanValues[0],
        title: cleanValues.length > 1 ? cleanValues[1] : '',
        description: cleanValues.length > 2 ? cleanValues[2] : ''
      };
    })
    .filter(item => item !== null && item.imageUrl && item.imageUrl.trim() !== '');
}

// Main function
async function main() {
  try {
    console.log('Fetching spreadsheet data...');
    const csvData = await fetchCSV();
    
    console.log('Parsing CSV data...');
    const galleryData = parseCSV(csvData);
    
    console.log(`Successfully parsed ${galleryData.length} images.`);
    
    // Add a timestamp
    const result = {
      lastUpdated: new Date().toISOString(),
      images: galleryData
    };
    
    // Write the result to a JSON file
    fs.writeFileSync('gallery-data.json', JSON.stringify(result, null, 2));
    console.log('Data written to gallery-data.json');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
