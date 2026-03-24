const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Load environment variables
dotenv.config();

const updateHeaterCategory = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI));
    console.log('✅ Connected to MongoDB');

    // Update all products with "Water Heater" category to "Heater"
    const result = await Product.updateMany(
      { category: 'Water Heater' },
      { $set: { category: 'Heater' } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} product(s)`);
    console.log('   Changed "Water Heater" category to "Heater"\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateHeaterCategory();
