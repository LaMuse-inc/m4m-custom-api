/**
 * M4M Airtable API
 * CRUD operations for Airtable database
 */

const Airtable = require('airtable');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Main API handler
 */
module.exports = async (req, res) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { table, action, recordId, fields, filterByFormula } = req.body;

    if (!table || !action) {
      res.status(400).json({ 
        error: 'Missing required parameters: table, action' 
      });
      return;
    }

    let result;

    switch (action) {
      case 'create':
        result = await createRecord(table, fields);
        break;
      case 'read':
        result = await readRecord(table, recordId);
        break;
      case 'update':
        result = await updateRecord(table, recordId, fields);
        break;
      case 'delete':
        result = await deleteRecord(table, recordId);
        break;
      case 'list':
        result = await listRecords(table, filterByFormula);
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
        return;
    }

    res.status(200).json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Airtable API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

/**
 * Create a new record
 */
async function createRecord(tableName, fields) {
  const records = await base(tableName).create([{ fields }]);
  return records[0];
}

/**
 * Read a single record
 */
async function readRecord(tableName, recordId) {
  const record = await base(tableName).find(recordId);
  return record;
}

/**
 * Update a record
 */
async function updateRecord(tableName, recordId, fields) {
  const records = await base(tableName).update([
    { id: recordId, fields }
  ]);
  return records[0];
}

/**
 * Delete a record
 */
async function deleteRecord(tableName, recordId) {
  const records = await base(tableName).destroy([recordId]);
  return records[0];
}

/**
 * List records with optional filter
 */
async function listRecords(tableName, filterByFormula = null) {
  const options = {};
  if (filterByFormula) {
    options.filterByFormula = filterByFormula;
  }

  const records = await base(tableName).select(options).all();
  return records;
}

