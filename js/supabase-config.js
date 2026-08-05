const SUPABASE_URL      = 'https://swejahgzcazzpbezfzbd.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWphaGd6Y2F6enBiZXpmemJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTcwNDQsImV4cCI6MjEwMTQ3MzA0NH0.iUhEg2RCiI3fo8wn9008uXVJ_BAi02deS3sY_CpZ9Sg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

window.db = supabaseClient;
