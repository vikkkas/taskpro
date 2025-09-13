const Task = require('../models/Task');

/**
 * Migrate existing tasks to support multiple assignees
 * This script converts single assignee field to assignees array for backward compatibility
 */
const migrateTaskAssignees = async () => {
  try {
    console.log('Starting task assignee migration...');
    
    // Find all tasks that have assignee but no assignees array
    const tasksToMigrate = await Task.find({
      assignee: { $exists: true, $ne: null },
      $or: [
        { assignees: { $exists: false } },
        { assignees: { $size: 0 } }
      ]
    });

    console.log(`Found ${tasksToMigrate.length} tasks to migrate`);

    let migratedCount = 0;
    
    for (const task of tasksToMigrate) {
      try {
        // Add the single assignee to the assignees array
        task.assignees = [task.assignee];
        await task.save();
        migratedCount++;
        
        console.log(`Migrated task: ${task.title} (${task._id})`);
      } catch (error) {
        console.error(`Failed to migrate task ${task._id}:`, error.message);
      }
    }

    console.log(`Migration completed. Successfully migrated ${migratedCount} tasks.`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up duplicate assignees in existing tasks
 * This ensures no user is assigned twice to the same task
 */
const cleanupDuplicateAssignees = async () => {
  try {
    console.log('Starting cleanup of duplicate assignees...');
    
    const tasks = await Task.find({ assignees: { $exists: true, $ne: [] } });
    
    let cleanedCount = 0;
    
    for (const task of tasks) {
      const originalLength = task.assignees.length;
      
      // Remove duplicates while preserving order
      const uniqueAssignees = [...new Set(task.assignees.map(id => id.toString()))];
      
      if (uniqueAssignees.length !== originalLength) {
        task.assignees = uniqueAssignees;
        await task.save();
        cleanedCount++;
        
        console.log(`Cleaned duplicates in task: ${task.title} (${task._id})`);
      }
    }

    console.log(`Cleanup completed. Cleaned ${cleanedCount} tasks.`);
    return { success: true, cleanedCount };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate data integrity after migration
 */
const validateMigration = async () => {
  try {
    console.log('Validating migration...');
    
    // Check for tasks with assignee but empty assignees
    const inconsistentTasks = await Task.find({
      assignee: { $exists: true, $ne: null },
      $or: [
        { assignees: { $exists: false } },
        { assignees: { $size: 0 } }
      ]
    });

    if (inconsistentTasks.length > 0) {
      console.warn(`Found ${inconsistentTasks.length} tasks with inconsistent assignee data`);
      return { success: false, inconsistentTasks: inconsistentTasks.length };
    }

    // Check total task counts
    const totalTasks = await Task.countDocuments();
    const tasksWithAssignees = await Task.countDocuments({ assignees: { $exists: true, $ne: [] } });
    const tasksWithSingleAssignee = await Task.countDocuments({ assignee: { $exists: true, $ne: null } });

    console.log(`Validation results:
    - Total tasks: ${totalTasks}
    - Tasks with assignees array: ${tasksWithAssignees}
    - Tasks with single assignee: ${tasksWithSingleAssignee}`);

    return { 
      success: true, 
      stats: { 
        totalTasks, 
        tasksWithAssignees, 
        tasksWithSingleAssignee 
      } 
    };
  } catch (error) {
    console.error('Validation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Run complete migration process
 */
const runMigration = async () => {
  console.log('=== Task Assignee Migration Started ===');
  
  // Step 1: Migrate single assignees to assignees array
  const migrationResult = await migrateTaskAssignees();
  if (!migrationResult.success) {
    console.error('Migration failed, aborting...');
    return migrationResult;
  }

  // Step 2: Clean up any duplicate assignees
  const cleanupResult = await cleanupDuplicateAssignees();
  if (!cleanupResult.success) {
    console.error('Cleanup failed, but migration was successful');
  }

  // Step 3: Validate the migration
  const validationResult = await validateMigration();
  if (!validationResult.success) {
    console.error('Validation failed, please check data integrity');
  }

  console.log('=== Task Assignee Migration Completed ===');
  
  return {
    success: true,
    migrationResult,
    cleanupResult,
    validationResult
  };
};

module.exports = {
  migrateTaskAssignees,
  cleanupDuplicateAssignees,
  validateMigration,
  runMigration
};
