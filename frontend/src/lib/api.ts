/**
 * API Service Layer - Re-export for backward compatibility
 * @deprecated Use @/services directly (import { get, post } from '@/services')
 * @module lib/api
 */

import apiClient from "@/services/api";

// 為了向後相容，重新 export axios instance
export default apiClient;
