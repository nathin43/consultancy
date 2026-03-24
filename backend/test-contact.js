/**
 * Test script to verify Contact Message functionality
 * Run with: node test-contact.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Contact = require('./models/Contact');

async function testContactSystem() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI));
    console.log('✅ MongoDB Connected!\n');

    // Test 1: Create a test contact message
    console.log('📝 Test 1: Creating test contact message...');
    const testContact = await Contact.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      message: 'This is a test message to verify the contact system is working.',
      inquiryType: 'general-question',
      subject: 'general-question',
      status: 'new'
    });
    console.log('✅ Test contact created:', testContact._id);
    console.log('   Name:', testContact.name);
    console.log('   Email:', testContact.email);
    console.log('   Status:', testContact.status);
    console.log('   Created At:', testContact.createdAt);

    // Test 2: Fetch all contacts
    console.log('\n📋 Test 2: Fetching all contact messages...');
    const allContacts = await Contact.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${allContacts.length} total contact messages`);
    
    if (allContacts.length > 0) {
      console.log('\n📊 Recent messages:');
      allContacts.slice(0, 5).forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} - ${contact.email} - ${contact.status}`);
      });
    }

    // Test 3: Count by status
    console.log('\n📊 Test 3: Message statistics...');
    const newCount = await Contact.countDocuments({ status: 'new' });
    const readCount = await Contact.countDocuments({ status: 'read' });
    const repliedCount = await Contact.countDocuments({ status: 'replied' });
    const resolvedCount = await Contact.countDocuments({ status: 'resolved' });
    console.log(`   New: ${newCount}`);
    console.log(`   Read: ${readCount}`);
    console.log(`   Replied: ${repliedCount}`);
    console.log(`   Resolved: ${resolvedCount}`);

    // Test 4: Update status
    console.log('\n✏️  Test 4: Updating test message status...');
    testContact.status = 'read';
    await testContact.save();
    console.log('✅ Status updated to:', testContact.status);

    // Test 5: Delete test message
    console.log('\n🗑️  Test 5: Cleaning up test message...');
    await Contact.findByIdAndDelete(testContact._id);
    console.log('✅ Test message deleted');

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('🎉 Contact Message system is working correctly!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit();
  }
}

// Run tests
testContactSystem();
