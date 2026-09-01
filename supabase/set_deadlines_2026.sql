-- 미래교육2 2026년 2학기 과제 마감일 일괄 설정
-- Supabase 대시보드 → SQL Editor에서 이 파일 전체를 실행하세요.
-- 마감 이후에도 제출/풀이 저장은 허용되며, DB 트리거가 자동으로 지각 처리합니다.

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
on conflict (week) do update
set due_at = excluded.due_at;
