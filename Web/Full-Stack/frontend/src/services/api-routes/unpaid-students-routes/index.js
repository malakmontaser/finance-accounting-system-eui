/**
 * ================================================================================
 * UNPAID STUDENTS ROUTES INDEX
 * ================================================================================
 * Central export point for all unpaid students-related API routes and services.
 * Import from this file to access any unpaid students routes or services.
 * 
 * Usage:
 *   // Import routes
 *   import { unpaidStudentsRoutes } from '../services/api-routes/unpaid-students-routes';
 *   import { DUES_ROUTE } from '../services/api-routes/unpaid-students-routes/unpaidStudentsRoutes';
 * 
 *   // Import service
 *   import { unpaidStudentsService } from '../services/api-routes/unpaid-students-routes';
 * ================================================================================
 */

// Unpaid Students Page Routes
export * from './unpaidStudentsRoutes';
export { default as unpaidStudentsRoutes } from './unpaidStudentsRoutes';

// Unpaid Students Page Service
export { default as unpaidStudentsService } from './unpaidStudentsService';

