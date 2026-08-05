// =============================================================================
// supabase-config.js – Inisialisasi Supabase Client
// GANTI nilai berikut sesuai project Supabase Anda:
// =============================================================================

const SUPABASE_URL      = 'https://swejahgzcazzpbezfzbd.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWphaGd6Y2F6enBiZXpmemJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTcwNDQsImV4cCI6MjEwMTQ3MzA0NH0.iUhEg2RCiI3fo8wn9008uXVJ_BAi02deS3sY_CpZ9Sg';

// Inisialisasi Supabase JS SDK v2
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export ke window scope (digunakan oleh modul lain)
window.db = supabaseClient;
