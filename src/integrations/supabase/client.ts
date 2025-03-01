
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://otmzmdhouybylmcafaxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXptZGhvdXlieWxtY2FmYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDUzMzQsImV4cCI6MjA1NjQyMTMzNH0.lbdd7qiISYNnuSa_ukT3SqoT9vFI8V6i9l-P8URAytI";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
