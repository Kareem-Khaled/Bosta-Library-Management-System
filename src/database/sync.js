const sequelize = require('./sequelize');
const { Book, Borrower, Borrowing } = require('../models');

const syncDatabase = async () => {
  try {
    console.log(' Starting database synchronization...');
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ 
      force: false, // Set to true to drop and recreate tables
      alter: true   // Update existing tables to match model definitions
    });
    
    console.log(' Database synchronized successfully!');
    console.log(' Models synced:');
    console.log('   - Books');
    console.log('   - Borrowers');
    console.log('   - Borrowings');
    
  } catch (error) {
    console.error(' Database sync failed:', error.message);
    throw error;
  }
};

// Run sync if this file is executed directly
if (require.main === module) {
  syncDatabase()
    .then(() => {
      console.log(' Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(' Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = syncDatabase;
