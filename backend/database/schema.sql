-- ============================================================
-- SmartAssist AI — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Chat Sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT        NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Chats ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID        REFERENCES chat_sessions(id) ON DELETE SET NULL,
    message    TEXT        NOT NULL,
    response   TEXT        NOT NULL,
    sentiment  TEXT        NOT NULL DEFAULT 'neutral'
                           CHECK (sentiment IN ('positive','negative','neutral')),
    category   TEXT        NOT NULL DEFAULT 'general'
                           CHECK (category IN ('technology','education','health','finance','general')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chats_user_id      ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_session_id   ON chats(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id   ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_sentiment    ON chats(sentiment);
CREATE INDEX IF NOT EXISTS idx_chats_created_at   ON chats(created_at DESC);

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- NOTE: Our backend uses the service-role key which bypasses RLS.
-- Enable RLS anyway for safety.
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically, no policies needed for backend.
-- Add anon/user policies here if you use Supabase client-side auth later.
