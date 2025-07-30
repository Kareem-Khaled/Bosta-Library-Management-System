const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function createDatabaseSchema() {
  try {
    console.log('Creating database schema...');
    
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    console.log('Database schema created successfully!');
    
  } catch (error) {
    console.error('Error creating database schema:', error);
    throw error;
  }
}

// Run schema creation if this file is executed directly
if (require.main === module) {
  createDatabaseSchema()
    .then(() => {
      console.log('Schema creation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createDatabaseSchema };
