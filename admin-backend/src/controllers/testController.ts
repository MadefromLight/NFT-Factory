import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

// Simple test login endpoint
export const testLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }
    
    // Create new connection for this request
    const connection = await mongoose.createConnection(mongoURI);
    
    // Define schema and model
    const adminUserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'DESIGNER', 'OPS'], default: 'OPS' },
      name: { type: String, required: true },
      isActive: { type: Boolean, default: false },
      status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' },
      lastLogin: { type: Date, default: null },
    }, { timestamps: true });
    
    const AdminUser = connection.model('AdminUser', adminUserSchema);
    
    // Find user
    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      connection.close();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    // Check if user is approved
    if (admin.status === 'PENDING') {
      connection.close();
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an administrator to approve your account.',
        status: 'PENDING',
      });
    }
    
    if (admin.status === 'REJECTED') {
      connection.close();
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected. Please contact support for more information.',
        status: 'REJECTED',
        rejectionReason: (admin as any).rejectionReason,
      });
    }
    
    if (admin.status === 'SUSPENDED' || !(admin as any).isActive) {
      connection.close();
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        status: 'SUSPENDED',
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, (admin as any).passwordHash);
    
    if (!isMatch) {
      connection.close();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    // Update last login
    (admin as any).lastLogin = new Date();
    await (admin as any).save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: (admin as any).role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );
    
    connection.close();
    
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: admin._id,
          email: admin.email,
          name: (admin as any).name,
          role: (admin as any).role,
          status: (admin as any).status,
        },
      },
    });
  } catch (error) {
    logger.error('Error in test login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Simple test signup endpoint
export const testSignup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'OPS' } = req.body;
    
    console.log('Signup attempt for:', email);
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }
    
    // Create new connection for this request
    const connection = await mongoose.createConnection(mongoURI);
    
    // Define schema and model
    const adminUserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'DESIGNER', 'OPS'], default: 'OPS' },
      name: { type: String, required: true },
      isActive: { type: Boolean, default: false },
      status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' },
      lastLogin: { type: Date, default: null },
    }, { timestamps: true });
    
    const AdminUser = connection.model('AdminUser', adminUserSchema);
    
    // Check if user exists
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      connection.close();
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const admin = new AdminUser({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      isActive: false, // Pending approval
      status: 'PENDING',
    });
    
    await admin.save();
    
    connection.close();
    
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Waiting for admin approval.',
      data: {
        id: admin._id,
        email: admin.email,
        name: (admin as any).name,
        role: (admin as any).role,
        status: (admin as any).status,
      },
    });
  } catch (error) {
    logger.error('Error in test signup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};