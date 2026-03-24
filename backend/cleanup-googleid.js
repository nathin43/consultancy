/**
 * Complete fix for E11000 duplicate key error
 * Drops the problematic index and removes all documents with duplicate googleId: null
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI) || 'mongodb://localhost:27017/electric-shop');
    console.log('✓ MongoDB connected\n');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const cleanupGoogleId = async () => {
  try {
    console.log('🧹 Starting cleanup...\n');

    // Drop all indexes on users collection
    console.log('Step 1: Dropping all indexes...');
    try {
      // Force drop the problematic index
      await mongoose.connection.db.collection('users').dropIndex('googleId_1');
      console.log('  ✓ Dropped googleId_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('  ℹ googleId_1 index already removed');
      } else {
        console.log('  ℹ Error:', err.message);
      }
    }

    // Remove duplicate googleId: null entries, keeping only the first one
    console.log('\nStep 2: Cleaning up duplicate googleId: null entries...');
    const usersWithNullGoogleId = await mongoose.connection.db.collection('users').find({ googleId: null }).toArray();
    
    if (usersWithNullGoogleId.length > 1) {
      console.log(`  Found ${usersWithNullGoogleId.length} users with googleId: null`);
      const idsToRemove = usersWithNullGoogleId.slice(1).map(u => u._id);
      
      const result = await mongoose.connection.db.collection('users').deleteMany({
        _id: { $in: idsToRemove }
      });
      console.log(`  ✓ Removed ${result.deletedCount} duplicate records`);
    } else {
      console.log('  ✓ No duplicate googleId: null entries found');
    }

    // Recreate the correct index
    console.log('\nStep 3: Creating correct sparse index...');
    await mongoose.connection.db.collection('users').createIndex(
      { googleId: 1 },
      { sparse: true }
    );
    console.log('  ✓ Created sparse index on googleId');

    console.log('\n✅ Cleanup completed successfully!');
    console.log('You can now register users without errors.\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await cleanupGoogleId();
};

main();
