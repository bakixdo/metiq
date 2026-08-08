-- Migration 20260808000000_init.sql

-- 1. Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  chat_id TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  delivery_failure_count INTEGER NOT NULL DEFAULT 0
);

-- Index for searching active subscribers for broadcasting
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON subscribers (is_active) WHERE is_active = TRUE;

-- 2. Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  trigger TEXT NOT NULL, -- 'cron', 'manual'
  coins_scanned INTEGER NOT NULL DEFAULT 0,
  sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_summary TEXT,
  report_html TEXT
);

-- Index for checking latest scans and managing lock and cooldown
CREATE INDEX IF NOT EXISTS idx_scans_started_at ON scans (started_at DESC);

-- 3. Create meta_snapshots table
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  stage TEXT NOT NULL,
  volume_6h NUMERIC NOT NULL DEFAULT 0,
  liquidity NUMERIC NOT NULL DEFAULT 0,
  coin_count INTEGER NOT NULL DEFAULT 0,
  score_change INTEGER NOT NULL DEFAULT 0,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_meta_snapshots_scan_id ON meta_snapshots (scan_id);

-- 4. Create coin_snapshots table
CREATE TABLE IF NOT EXISTS coin_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  narrative TEXT NOT NULL,
  market_cap NUMERIC,
  liquidity NUMERIC,
  volume_1h NUMERIC,
  volume_6h NUMERIC,
  buys_1h INTEGER,
  sells_1h INTEGER,
  price_change_1h NUMERIC,
  price_change_6h NUMERIC,
  pair_created_at BIGINT,
  pair_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_coin_snapshots_scan_id ON coin_snapshots (scan_id);
