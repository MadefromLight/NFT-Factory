import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminUser, { IAdminUser } from '../models/AdminUser';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI);
    console.log('Connected to database');

    // Check if super admin already exists
    const existingSuperAdmin = await AdminUser.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.email);
      console.log('Exiting without creating a new Super Admin.');
      process.exit(0);
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
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Status:', existingUser.status);
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AbimbolaTheFounder18', salt);

    // Create super admin
    const superAdmin: IAdminUser = new AdminUser({
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

    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();