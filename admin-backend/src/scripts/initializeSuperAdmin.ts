import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminUser from '../models/AdminUser';
import dotenv from 'dotenv';

dotenv.config();

const initializeSuperAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to database for super admin initialization');

    // Check if super admin already exists
    const existingSuperAdmin = await AdminUser.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.email);
      mongoose.connection.close();
      return;
    }

    // Check if user with this email already exists
    const existingUser = await AdminUser.findOne({ email: 'abimbola.zeuslabs@gmail.com' });
    if (existingUser) {
      console.log('User with email abimbola.zeuslabs@gmail.com already exists');
      console.log('Updating role to SUPER_ADMIN');
      
      existingUser.role = 'SUPER_ADMIN';
      existingUser.status = 'APPROVED';
      existingUser.isActive = true;
      await existingUser.save();
      
      console.log('User updated to Super Admin successfully');
      mongoose.connection.close();
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AbimbolaTheFounder18', salt);

    // Create super admin
    const superAdmin = new AdminUser({
      email: 'abimbola.zeuslabs@gmail.com',
      passwordHash,
      name: 'Abimbola James',
      role: 'SUPER_ADMIN',
      isActive: true,
      status: 'APPROVED',
      lastLogin: null,
    });

    await superAdmin.save();

    console.log('Super Admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Name:', superAdmin.name);
    console.log('Role:', superAdmin.role);
    console.log('Status:', superAdmin.status);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
};

export default initializeSuperAdmin;