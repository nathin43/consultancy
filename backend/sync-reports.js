/**
 * Sync Reports Script
 * Run this to populate the reports collection with user summary data
 * 
 * Usage: node sync-reports.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { upsertUserReportSummariesBulk } = require('./services/userReportSummaryService');

const syncReports = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI));
    console.log('✅ Connected to MongoDB');

    console.log('📊 Fetching all users...');
    const users = await User.find({}, 'name email');
    console.log(`✅ Found ${users.length} users`);

    console.log('💾 Syncing user summary reports...');
    const result = await upsertUserReportSummariesBulk(users);
    
    console.log('\n✅ Sync completed successfully!');
    console.log(`   Matched: ${result.matchedCount || 0}`);
    console.log(`   Modified: ${result.modifiedCount || 0}`);
    console.log(`   Upserted: ${result.upsertedCount || 0}`);
    console.log(`   Total operations: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing reports:', error.message);
    console.error(error);
    process.exit(1);
  }
};

syncReports();
