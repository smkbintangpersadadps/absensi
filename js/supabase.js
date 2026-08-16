// =====================================
// SETUP DATABASE
// =====================================
const SUPABASE_URL = 'https://ehwbwgxalifcsasuwsvt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVod2J3Z3hhbGlmY3Nhc3V3c3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTg4ODIsImV4cCI6MjEwMjM5NDg4Mn0.0yjDhpnMYSy50cg14HPgG4OMNVQDuA-8Rh6hlL5dX3U';
        window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
        );
