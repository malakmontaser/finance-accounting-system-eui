/**
 * ================================================================================
 * DASHBOARD ROUTES INDEX
 * ================================================================================
 * Central export point for all dashboard-related API routes and services.
 * Import from this file to access any dashboard routes or services.
 * 
 * Usage:
 *   // Import routes
 *   import { financeRoutes } from './api-routes/dashboard-routes';
 *   import { DUES_ROUTE, SUMMARY_ROUTE } from './api-routes/dashboard-routes/financeRoutes';
 * 
 *   // Import service
 *   import { financeService } from './api-routes/dashboard-routes';
 * ================================================================================
 */

// Finance Dashboard Routes
export * from './financeRoutes';
export { default as financeRoutes } from './financeRoutes';

// Finance Dashboard Service
export { default as financeService } from './financeService';

// Future dashboard routes can be added here:
// export * from './studentDashboardRoutes';
// export * from './adminDashboardRoutes';

