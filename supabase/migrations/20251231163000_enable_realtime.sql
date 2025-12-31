-- Enable Realtime for donations and postcards tables
-- This ensures that INSERT, UPDATE, DELETE events are broadcast to connected clients

DO $$
BEGIN
  -- Add donations table to publication if not exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE donations;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
    RAISE NOTICE 'Table donations is already in supabase_realtime publication';
  END;

  -- Add postcards table to publication if not exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE postcards;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
    RAISE NOTICE 'Table postcards is already in supabase_realtime publication';
  END;
END
$$;
