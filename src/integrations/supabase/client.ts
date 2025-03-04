
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://otmzmdhouybylmcafaxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXptZGhvdXlieWxtY2FmYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDUzMzQsImV4cCI6MjA1NjQyMTMzNH0.lbdd7qiISYNnuSa_ukT3SqoT9vFI8V6i9l-P8URAytI";

// Generate a truly unique alphanumeric string using current timestamp and UUIDs
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  
  // Get timestamp with milliseconds for uniqueness
  const timestamp = Date.now();
  
  // Add microsecond precision for even more uniqueness
  const microseconds = typeof performance !== 'undefined' 
    ? Math.floor(performance.now() * 1000).toString().slice(-4) 
    : Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Generate random string with high entropy
  for (let i = 0; i < length - 4; i++) {
    // Use a combination of timestamp bits and random selection
    const randomIndex = Math.floor((timestamp % (i + 1) + Math.random()) * chars.length) % chars.length;
    result += chars.charAt(randomIndex);
  }
  
  // Append microseconds for additional uniqueness
  return result + microseconds;
};

// Format a phone number to get last 4 digits
export const getLastFourDigits = (phone: string): string => {
  // Remove non-numeric characters and get last 4 digits
  const cleanPhone = phone.replace(/\D/g, '');
  // If we don't have 4 digits, pad with zeros
  return cleanPhone.slice(-4).padStart(4, '0');
};

// Get the first 2 characters of a string, uppercase
export const getPrefix = (str: string): string => {
  if (!str || str.length < 2) return 'XX';
  // Use first letter of each word if possible to create a more meaningful prefix
  const words = str.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return str.substring(0, 2).toUpperCase();
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
