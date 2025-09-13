#!/usr/bin/env node

/**
 * Data Migration Script
 * Run this script to migrate existing task data to support multiple assignees
 */

const mongoose = require('mongoose');
const { runMigration } = require('../utils/dataMigration');

// Load environment variables
require('dotenv').config();

const runMigrationScript = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB successfully');

    // Run the migration
    const result = await runMigration();
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('Summary:', {
        migrated: result.migrationResult?.migratedCount || 0,
        cleaned: result.cleanupResult?.cleanedCount || 0,
        validated: result.validationResult?.success || false
      });
    } else {
      console.error('\n❌ Migration failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the script
runMigrationScript();
