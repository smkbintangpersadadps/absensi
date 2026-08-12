// supabase.js
        const SUPABASE_URL = 'https://wcqtnhudoyuqqfiyqlmp.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcXRuaHVkb3l1cXFmaXlxbG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTU5NDMsImV4cCI6MjEwMjA5MTk0M30.ClFQ--9wJjcNdxFadbEqJXmKBy08GjxHfcg6mkUWUFI';

        window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
        );
