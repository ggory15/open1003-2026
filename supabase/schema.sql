-- ============================================================
-- 미래교육2 (OPEN 1003-00) 과제 제출 사이트 — Supabase 스키마
-- 사용법: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run
-- ============================================================

-- ── 1. 테이블 ───────────────────────────────────────────────

-- 학생 프로필 (가입 시 트리거로 자동 생성)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  student_id text not null default '',
  name       text not null default '',
  created_at timestamptz not null default now()
);

-- 과제 제출 기록 (파일 실물은 Storage의 submissions 버킷에 저장)
create table if not exists public.submissions (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  week              int  not null check (week between 2 and 12),
  file_path         text not null,
  original_filename text,
  submitted_at      timestamptz not null default now(),
  is_late           boolean not null default false,
  unique (user_id, week)
);

-- 주차별 마감일 (null = 마감 없음)
create table if not exists public.deadlines (
  week   int primary key check (week between 2 and 12),
  due_at timestamptz
);

-- 관리자(교수/조교) 이메일 목록
create table if not exists public.admins (
  email text primary key
);

-- ★ 관리자 이메일 등록 (필요 시 조교 이메일을 추가하세요)
insert into public.admins (email) values ('kim87@khu.ac.kr')
  on conflict (email) do nothing;

-- 2026년 2학기 과제 마감일 (매주 금요일 23:59, 한국 시간)
insert into public.deadlines (week, due_at)
  values
    (2,  timestamptz '2026-09-18 23:59:00+09'),
    (3,  timestamptz '2026-09-25 23:59:00+09'),
    (4,  timestamptz '2026-10-02 23:59:00+09'),
    (5,  timestamptz '2026-10-09 23:59:00+09'),
    (6,  timestamptz '2026-10-16 23:59:00+09'),
    (7,  timestamptz '2026-10-23 23:59:00+09'),
    (8,  timestamptz '2026-10-30 23:59:00+09'),
    (9,  timestamptz '2026-11-06 23:59:00+09'),
    (10, timestamptz '2026-11-13 23:59:00+09'),
    (11, timestamptz '2026-11-20 23:59:00+09'),
    (12, timestamptz '2026-11-27 23:59:00+09')
  on conflict (week) do nothing;

-- ── 2. 함수 ─────────────────────────────────────────────────

-- 현재 로그인한 사용자가 관리자인지 확인
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 가입 시 프로필 자동 생성 (회원가입 폼의 학번/이름 메타데이터 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, student_id, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'student_id', ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 학교 이메일(@khu.ac.kr)만 가입 허용
-- (주의: 대시보드에서 직접 초대하는 계정도 이 규칙의 적용을 받습니다)
create or replace function public.enforce_school_email()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if lower(new.email) not like '%@khu.ac.kr' then
    raise exception 'khu.ac.kr 이메일만 가입할 수 있습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_school_email on auth.users;
create trigger enforce_school_email
  before insert on auth.users
  for each row execute function public.enforce_school_email();

-- 제출 시각/지각 여부를 서버에서 판정 (클라이언트 시계 조작 방지)
create or replace function public.set_submission_meta()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  d timestamptz;
begin
  select due_at into d from public.deadlines where week = new.week;
  new.submitted_at := now();
  new.is_late := (d is not null and now() > d);
  return new;
end;
$$;

drop trigger if exists set_submission_meta on public.submissions;
create trigger set_submission_meta
  before insert or update on public.submissions
  for each row execute function public.set_submission_meta();

-- ── 3. RLS (행 수준 보안) ───────────────────────────────────

alter table public.profiles    enable row level security;
alter table public.submissions enable row level security;
alter table public.deadlines   enable row level security;
alter table public.admins      enable row level security;

-- profiles: 본인 것만 읽기/쓰기, 관리자는 전체 열람
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- submissions: 본인 것만 제출/수정/열람, 관리자는 전체 열람
drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select" on public.submissions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "submissions_update" on public.submissions;
create policy "submissions_update" on public.submissions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- deadlines: 누구나 조회 가능(홈 화면 표시용), 변경은 관리자만
drop policy if exists "deadlines_select" on public.deadlines;
create policy "deadlines_select" on public.deadlines
  for select to anon, authenticated
  using (true);

drop policy if exists "deadlines_write" on public.deadlines;
create policy "deadlines_write" on public.deadlines
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admins: 관리자만 목록 조회 가능
drop policy if exists "admins_select" on public.admins;
create policy "admins_select" on public.admins
  for select to authenticated
  using (public.is_admin());

-- ── 4. Storage (제출 파일 버킷) ──────────────────────────────

insert into storage.buckets (id, name, public)
  values ('submissions', 'submissions', false)
  on conflict (id) do nothing;

-- 학생은 자기 폴더({본인 user_id}/...)에만 업로드/수정 가능
drop policy if exists "sub_upload_own" on storage.objects;
create policy "sub_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "sub_update_own" on storage.objects;
create policy "sub_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 열람은 본인 파일 또는 관리자
drop policy if exists "sub_read_own_or_admin" on storage.objects;
create policy "sub_read_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================
-- 완료! 이제 사이트의 js/config.js에 프로젝트 URL과 anon key를
-- 입력하면 됩니다. 자세한 순서는 README.md를 참고하세요.
-- ============================================================
