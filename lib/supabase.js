import { createClient } from '@supabase/supabase-js';

// These would typically come from environment variables
// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;