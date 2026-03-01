import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminUser from '../models/AdminUser';
import dotenv from 'dotenv';

dotenv.config();

const testLogin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to database');
    
    // Test user exists
    const user = await AdminUser.findOne({ email: 'abimbola.zeuslabs@gmail.com' });
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:');
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Role:', user.role);
      console.log('- Status:', user.status);
      console.log('- IsActive:', user.isActive);
      
      // Test password
      const isMatch = await bcrypt.compare('AbimbolaTheFounder18', user.passwordHash);
      console.log('Password match:', isMatch);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();