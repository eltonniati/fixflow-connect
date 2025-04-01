
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://otmzmdhouybylmcafaxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXptZGhvdXlieWxtY2FmYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDUzMzQsImV4cCI6MjA1NjQyMTMzNH0.lbdd7qiISYNnuSa_ukT3SqoT9vFI8V6i9l-P8URAytI";

// Generate a random alphanumeric string of specified length
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format a phone number to get last 4 digits
export const getLastFourDigits = (phone: string): string => {
  // Remove non-numeric characters and get last 4 digits
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.slice(-4);
};

// Get the first 2 characters of a string, uppercase
export const getPrefix = (str: string): string => {
  if (!str) return 'XX';
  return str.substring(0, 2).toUpperCase();
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
