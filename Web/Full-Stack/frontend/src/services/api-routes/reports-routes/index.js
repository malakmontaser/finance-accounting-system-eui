/**
 * ================================================================================
 * REPORTS ROUTES INDEX
 * ================================================================================
 * Central export point for all reports-related API routes and services.
 * Import from this file to access any reports routes or services.
 * 
 * Usage:
 *   // Import routes
 *   import { reportsRoutes } from '../services/api-routes/reports-routes';
 *   import { GENERATE_REPORT_ROUTE } from '../services/api-routes/reports-routes/reportsRoutes';
 * 
 *   // Import service
 *   import { reportsService } from '../services/api-routes/reports-routes';
 * ================================================================================
 */

// Reports Page Routes
export * from './reportsRoutes';
export { default as reportsRoutes } from './reportsRoutes';

// Reports Page Service
export { default as reportsService } from './reportsService';

