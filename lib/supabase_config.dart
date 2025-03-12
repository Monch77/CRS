import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseClient supabase = SupabaseClient(
    'https://pnjjeaunetajaybpxzly.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuamplYXVuZXRhamF5YnB4emx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODYxNzgsImV4cCI6MjA1NjU2MjE3OH0.tPLzvc9uUkdlm4HaTPvTrevicAoX76anw3DEq2Dm8KE',
  );
}
