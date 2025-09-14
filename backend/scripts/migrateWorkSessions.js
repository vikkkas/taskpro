const mongoose = require('mongoose');
const Task = require('../models/Task');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Migrate work sessions to add startedBy field
const migrateWorkSessions = async () => {
  try {
    console.log('Starting work sessions migration...');
    
    // Find all tasks with work sessions that don't have startedBy
    const tasks = await Task.find({
      'workSessions.startedBy': { $exists: false }
    });
    
    console.log(`Found ${tasks.length} tasks with work sessions to migrate`);
    
    let updatedCount = 0;
    
    for (const task of tasks) {
      let needsUpdate = false;
      
      for (const session of task.workSessions) {
        if (!session.startedBy && session.userId) {
          // Set startedBy to userId for backward compatibility
          session.startedBy = session.userId;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await task.save();
        updatedCount++;
        console.log(`Updated task: ${task.title} (${task._id})`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} tasks.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateWorkSessions();
};

runMigration();
