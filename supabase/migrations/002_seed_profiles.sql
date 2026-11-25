-- Run AFTER creating two invite-only auth users in the Supabase dashboard.
-- Replace the UUIDs with the auth.users ids for Arin and Emon.
--
-- Example:
--   insert into public.profiles (id, role, display_name) values
--     ('00000000-0000-0000-0000-000000000001', 'arin', 'Arin'),
--     ('00000000-0000-0000-0000-000000000002', 'emon', 'Emon');
--
-- Prefer inviting via Authentication → Users → Invite, then:
--
--   insert into public.profiles (id, role, display_name)
--   select id, 'arin', 'Arin' from auth.users where email = 'arin@example.com'
--   on conflict (id) do nothing;
--
--   insert into public.profiles (id, role, display_name)
--   select id, 'emon', 'Emon' from auth.users where email = 'emon@example.com'
--   on conflict (id) do nothing;

-- No automatic seed data — keep production free of demo fixtures.
select 1;
