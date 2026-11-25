-- Arin's Study Diary — initial schema
-- Dates stored as calendar dates interpreted in Asia/Dhaka for user-facing logic.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (invite-only; linked to auth.users)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('arin', 'emon');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Only one Arin and one Emon account
create unique index profiles_role_unique on public.profiles (role);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Emon can read Arin profile metadata"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'emon'
    )
  );

-- ---------------------------------------------------------------------------
-- Daily plans (one confirmed plan per Arin calendar day)
-- ---------------------------------------------------------------------------
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  plan_date date not null,
  photo_path text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, plan_date)
);

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.daily_plans (id) on delete cascade,
  title text not null,
  tags text[] not null default '{}',
  is_frog boolean not null default false,
  first_five_minutes text,
  completed boolean not null default false,
  completed_at timestamptz,
  uncertain boolean not null default false,
  sort_order int not null default 0,
  carried_from_date date,
  created_at timestamptz not null default now()
);

create index study_tasks_plan_id_idx on public.study_tasks (plan_id);

-- At most one frog per plan
create unique index study_tasks_one_frog
  on public.study_tasks (plan_id)
  where is_frog;

alter table public.daily_plans enable row level security;
alter table public.study_tasks enable row level security;

-- Arin owns plans/tasks; Emon cannot select them
create policy "Arin manages own plans"
  on public.daily_plans for all
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  )
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Arin manages own tasks"
  on public.study_tasks for all
  using (
    exists (
      select 1 from public.daily_plans d
      join public.profiles p on p.id = d.owner_id
      where d.id = study_tasks.plan_id
        and d.owner_id = auth.uid()
        and p.role = 'arin'
    )
  )
  with check (
    exists (
      select 1 from public.daily_plans d
      join public.profiles p on p.id = d.owner_id
      where d.id = study_tasks.plan_id
        and d.owner_id = auth.uid()
        and p.role = 'arin'
    )
  );

-- ---------------------------------------------------------------------------
-- Daily score awards (Study Star / Full Plan) — unique per day
-- ---------------------------------------------------------------------------
create table public.daily_awards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  award_date date not null,
  score numeric(6, 3) not null default 0,
  study_star boolean not null default false,
  full_plan boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, award_date)
);

alter table public.daily_awards enable row level security;

create policy "Arin manages own awards"
  on public.daily_awards for all
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  )
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

-- Emon can see award summary (not tasks)
create policy "Emon reads award summaries"
  on public.daily_awards for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  );

-- ---------------------------------------------------------------------------
-- Weekly reward claims — one claim per Monday week start
-- ---------------------------------------------------------------------------
create type public.reward_choice as enum (
  'date_with_emon',
  'chocolate',
  'outfit',
  'cash',
  'makeup',
  'personal_gift'
);

create table public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  choice public.reward_choice not null,
  claimed_at timestamptz not null default now(),
  fulfilled boolean not null default false,
  fulfilled_at timestamptz,
  fulfilled_by uuid references public.profiles (id),
  unique (owner_id, week_start)
);

alter table public.reward_claims enable row level security;

create policy "Arin claims and reads own rewards"
  on public.reward_claims for select
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Arin inserts own reward claims"
  on public.reward_claims for insert
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Emon reads and fulfills claims"
  on public.reward_claims for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  );

create policy "Emon updates fulfillment"
  on public.reward_claims for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  );

-- ---------------------------------------------------------------------------
-- Encouragement notes from Emon
-- ---------------------------------------------------------------------------
create table public.encouragement_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.encouragement_notes enable row level security;

create policy "Arin reads notes"
  on public.encouragement_notes for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('arin', 'emon'))
  );

create policy "Emon writes notes"
  on public.encouragement_notes for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  );

create policy "Emon deletes own notes"
  on public.encouragement_notes for delete
  using (
    author_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'emon')
  );

-- ---------------------------------------------------------------------------
-- Private notebook photo storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notebook-photos',
  'notebook-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- Path convention: {arin_user_id}/{plan_date}/{filename}
create policy "Arin uploads own notebook photos"
  on storage.objects for insert
  with check (
    bucket_id = 'notebook-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Arin reads own notebook photos"
  on storage.objects for select
  using (
    bucket_id = 'notebook-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Arin updates own notebook photos"
  on storage.objects for update
  using (
    bucket_id = 'notebook-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

create policy "Arin deletes own notebook photos"
  on storage.objects for delete
  using (
    bucket_id = 'notebook-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'arin')
  );

-- Explicit denial for Emon is implied by absence of matching policies.
-- Service role (server) may create signed URLs for Arin-only flows.

-- ---------------------------------------------------------------------------
-- Helpers: recompute daily award from tasks (callable from API with user JWT)
-- ---------------------------------------------------------------------------
create or replace function public.recompute_daily_award(p_plan_date date)
returns public.daily_awards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_role public.user_role;
  v_tasks record;
  v_frog_pts numeric := 0;
  v_other_pts numeric := 0;
  v_other_each numeric := 0;
  v_total numeric := 0;
  v_frog_done boolean := false;
  v_other_count int := 0;
  v_other_done int := 0;
  v_result public.daily_awards;
begin
  select role into v_role from public.profiles where id = v_owner;
  if v_role is distinct from 'arin' then
    raise exception 'Only Arin can recompute awards';
  end if;

  select
    coalesce(bool_or(t.is_frog and t.completed), false) as frog_done,
    count(*) filter (where not t.is_frog) as other_count,
    count(*) filter (where not t.is_frog and t.completed) as other_done,
    count(*) filter (where t.is_frog) as frog_count,
    count(*) as total_count
  into v_tasks
  from public.daily_plans d
  join public.study_tasks t on t.plan_id = d.id
  where d.owner_id = v_owner and d.plan_date = p_plan_date and d.confirmed;

  if v_tasks.total_count is null or v_tasks.total_count = 0 then
    delete from public.daily_awards
    where owner_id = v_owner and award_date = p_plan_date
      and study_star = false and full_plan = false;
    -- keep claimed history via reward_claims; clear unearned award row
    delete from public.daily_awards
    where owner_id = v_owner and award_date = p_plan_date;
    return null;
  end if;

  if v_tasks.frog_count > 0 and v_tasks.other_count = 0 then
    v_frog_pts := 100;
  elsif v_tasks.frog_count > 0 then
    v_frog_pts := 50;
  end if;

  if v_tasks.other_count > 0 then
    if v_tasks.frog_count > 0 then
      v_other_each := 50.0 / v_tasks.other_count;
    else
      v_other_each := 100.0 / v_tasks.other_count;
    end if;
  end if;

  v_frog_done := v_tasks.frog_done;
  v_other_done := v_tasks.other_done;
  v_total := (case when v_frog_done then v_frog_pts else 0 end)
           + (v_other_done * v_other_each);

  insert into public.daily_awards as a (
    owner_id, award_date, score, study_star, full_plan, updated_at
  ) values (
    v_owner, p_plan_date, v_total, v_total >= 50, v_total >= 100, now()
  )
  on conflict (owner_id, award_date) do update
    set score = excluded.score,
        study_star = excluded.study_star,
        full_plan = excluded.full_plan,
        updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.recompute_daily_award(date) from public;
grant execute on function public.recompute_daily_award(date) to authenticated;
