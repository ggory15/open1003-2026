-- ============================================================
-- 미래교육2 — 인터랙티브 숙제(자동 채점) 마이그레이션
-- 사용법: Supabase 대시보드 → SQL Editor → 전체 붙여넣고 Run
-- (기존 schema.sql을 실행한 프로젝트에 추가로 실행)
-- ============================================================

-- 문제별 풀이 기록
create table if not exists public.hw_progress (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  week       int  not null check (week between 2 and 12),
  problem_id text not null,
  code       text,
  passed     boolean not null default false,
  is_late    boolean not null default false,
  passed_at  timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, week, problem_id)
);

-- 통과/지각 판정은 서버에서 (클라이언트 시계 조작 방지, 한 번 통과하면 유지)
create or replace function public.set_hw_progress_meta()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  d timestamptz;
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and old.passed then
    -- 이미 통과한 문제는 통과 상태 유지 (코드 업데이트는 허용)
    new.passed := true;
    new.passed_at := old.passed_at;
    new.is_late := old.is_late;
    return new;
  end if;
  if new.passed then
    select due_at into d from public.deadlines where week = new.week;
    new.passed_at := now();
    new.is_late := (d is not null and now() > d);
  else
    new.passed_at := null;
    new.is_late := false;
  end if;
  return new;
end;
$$;

drop trigger if exists set_hw_progress_meta on public.hw_progress;
create trigger set_hw_progress_meta
  before insert or update on public.hw_progress
  for each row execute function public.set_hw_progress_meta();

-- RLS: 본인 기록만 읽기/쓰기, 관리자는 전체 열람
alter table public.hw_progress enable row level security;

drop policy if exists "hw_select" on public.hw_progress;
create policy "hw_select" on public.hw_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "hw_insert" on public.hw_progress;
create policy "hw_insert" on public.hw_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "hw_update" on public.hw_progress;
create policy "hw_update" on public.hw_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 관리자 화면용 요약 뷰 (학생×주차별 통과 수 / 지각 여부 / 마지막 활동)
-- security_invoker: 조회하는 사람의 RLS가 그대로 적용됨
create or replace view public.hw_summary
with (security_invoker = true) as
  select user_id,
         week,
         count(*) filter (where passed)::int as passed_count,
         bool_or(is_late)                    as any_late,
         max(updated_at)                     as last_activity
  from public.hw_progress
  group by user_id, week;

-- ============================================================
-- 완료! 이후 사이트를 새로고침하면 인터랙티브 숙제가 동작합니다.
-- ============================================================
