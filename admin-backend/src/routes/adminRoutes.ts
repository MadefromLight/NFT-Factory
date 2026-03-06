import { Router } from 'express';
import { body } from 'express-validator';
import {
  adminLogin,
  adminSignup,
  createAdminUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllSubmissions,
  getSubmissionDetails,
  approveSubmission,
  rejectSubmission,
  assignDesigner,
  uploadFinalArtwork,
  generateMetadata,
  getAnalytics,
} from '../controllers/adminController';
import { testLogin, testSignup, getUserStatus } from '../controllers/testController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
// Get current user's status
router.get('/me/status', authenticate, (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        id: (req as any).user.userId,
        email: (req as any).user.email,
        role: (req as any).user.role,
        status: 'APPROVED', // Assuming approved for this route
      },
    });
  });

// Temporary route to initialize super admin (to be removed after setup)
router.post('/init-super-admin', async (req, res) => {
  try {
    const AdminUser = (await import('../models/AdminUser')).default;
    const bcrypt = (await import('bcryptjs')).default;
    
    // Check if super admin already exists
    const existingSuperAdmin = await AdminUser.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin already exists',
      });
    }
    
    // Check if user with super admin email already exists
    const existingUser = await AdminUser.findOne({ email: 'abimbola.zeuslabs@gmail.com' });
    if (existingUser) {
      // Update existing user to super admin
      existingUser.role = 'SUPER_ADMIN';
      existingUser.status = 'APPROVED';
      existingUser.isActive = true;
      await existingUser.save();
      
      return res.status(200).json({
        success: true,
        message: 'Existing user updated to Super Admin',
        data: {
          email: existingUser.email,
          role: existingUser.role,
        },
      });
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
    
    return res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      data: {
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error initializing super admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  adminLogin
);

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').optional().isIn(['ADMIN', 'DESIGNER', 'OPS']).withMessage('Valid role is required'),
  ],
  adminSignup
);

// Protected routes
router.use(authenticate);

// User management routes (Super Admin and Admin only)
router.get('/users/pending', authorize('SUPER_ADMIN', 'ADMIN'), getPendingUsers);
router.post('/users/:userId/approve', authorize('SUPER_ADMIN', 'ADMIN'), approveUser);
router.post('/users/:userId/reject', authorize('SUPER_ADMIN', 'ADMIN'), rejectUser);

// Admin only routes
router.post(
  '/users',
  authorize('SUPER_ADMIN', 'ADMIN'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'DESIGNER', 'OPS']).withMessage('Valid role is required'),
  ],
  createAdminUser
);

// Submissions
router.get('/submissions', getAllSubmissions);
router.get('/submissions/:id', getSubmissionDetails);

// Actions
router.post('/submissions/:id/approve', authorize('ADMIN', 'OPS'), approveSubmission);
router.post('/submissions/:id/reject', authorize('ADMIN', 'OPS'), rejectSubmission);
router.post('/submissions/:id/assign-designer', authorize('ADMIN', 'OPS'), assignDesigner);

// Designer actions
router.post(
  '/submissions/:id/upload-artwork',
  authorize('ADMIN', 'DESIGNER', 'OPS'),
  upload.single('artwork'),
  uploadFinalArtwork
);

router.post(
  '/submissions/:id/generate-metadata',
  authorize('ADMIN', 'DESIGNER', 'OPS'),
  generateMetadata
);

// Analytics
router.get('/analytics', authorize('ADMIN'), getAnalytics);

export default router;
