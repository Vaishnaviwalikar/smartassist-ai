"""
Supabase client singleton — reuse one connection across the app.
"""

from supabase import create_client, Client
from app.config import settings

# Anon client (for user-facing operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Service-role client (admin operations, bypasses RLS)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    return supabase


def get_supabase_admin() -> Client:
    return supabase_admin
