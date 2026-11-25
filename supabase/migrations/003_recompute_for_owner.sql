-- Allow Lambda (service role) to recompute awards for a specific owner.
-- The original recompute_daily_award(date) still uses auth.uid() for browser JWT callers.

create or replace function public.recompute_daily_award_for(
  p_owner_id uuid,
  p_plan_date date
)
returns public.daily_awards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tasks record;
  v_frog_pts numeric := 0;
  v_other_each numeric := 0;
  v_total numeric := 0;
  v_frog_done boolean := false;
  v_other_done int := 0;
  v_result public.daily_awards;
begin
  if p_owner_id is null then
    raise exception 'owner required';
  end if;

  -- Only service role or the owner may call this
  if auth.role() is distinct from 'service_role' and auth.uid() is distinct from p_owner_id then
    raise exception 'Forbidden';
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
  where d.owner_id = p_owner_id and d.plan_date = p_plan_date and d.confirmed;

  if v_tasks.total_count is null or v_tasks.total_count = 0 then
    delete from public.daily_awards
    where owner_id = p_owner_id and award_date = p_plan_date;
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
    p_owner_id, p_plan_date, v_total, v_total >= 50, v_total >= 100, now()
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

revoke all on function public.recompute_daily_award_for(uuid, date) from public;
grant execute on function public.recompute_daily_award_for(uuid, date) to service_role;
grant execute on function public.recompute_daily_award_for(uuid, date) to authenticated;
