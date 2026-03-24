const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const ReportMessage = require('./models/ReportMessage');
require('dotenv').config();

const testUserReportsAPI = async () => {
  try {
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI));
    console.log('✅ Connected to MongoDB\n');

    // Check if ReportMessage collection exists and has data
    const totalMessages = await ReportMessage.countDocuments();
    console.log(`📊 Total Report Messages in DB: ${totalMessages}\n`);

    if (totalMessages === 0) {
      console.log('⚠️  NO REPORT MESSAGES FOUND IN DATABASE');
      console.log('This is why reports are not showing up.\n');
      
      // Check if there are users
      const users = await User.find({}).limit(5);
      console.log(`👥 Available Users: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n📋 Sample Users:');
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
        });
        
        console.log('\n💡 SOLUTION: You need to send report messages from admin panel');
        console.log('   Go to: Admin Dashboard → Reports → Send Report Message');
      }
    } else {
      // Show sample messages
      const messages = await ReportMessage.find({})
        .populate('userId', 'name email')
        .populate('sentBy', 'name email')
        .limit(5)
        .sort({ createdAt: -1 });

      console.log('📨 Sample Report Messages:\n');
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. To: ${msg.userId?.name || msg.userId} (${msg.userId?.email || 'N/A'})`);
        console.log(`   From: ${msg.sentBy?.name || 'Admin'}`);
        console.log(`   Subject: ${msg.subject}`);
        console.log(`   Status: ${msg.status}`);
        console.log(`   Read: ${msg.isRead ? 'Yes' : 'No'}`);
        console.log(`   Date: ${msg.createdAt.toISOString()}`);
        console.log('');
      });

      // Group by user
      const messagesByUser = await ReportMessage.aggregate([
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]);

      console.log('📊 Messages per User:');
      messagesByUser.forEach(item => {
        const userName = item.user[0]?.name || 'Unknown User';
        console.log(`  ${userName}: ${item.count} messages (${item.unreadCount} unread)`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testUserReportsAPI();
