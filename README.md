# 미래교육2 (OPEN 1003-00) — 인터랙티브 파이썬 숙제 사이트

학생이 **설치 없이 브라우저에서 바로 파이썬 문제를 풀고 자동 채점**받는 사이트입니다.
파이썬 실행은 Pyodide(WebAssembly)로 학생의 브라우저 안에서 이루어지고,
채점 기록은 Supabase에 저장됩니다. 서버 비용 없이 GitHub Pages + Supabase 무료 플랜으로 동작합니다.

- 배포 주소: https://ggory15.github.io/open1003-2026/
- 저장소: https://github.com/ggory15/open1003-2026

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 홈 — 주차별 자료 다운로드 + 내 풀이 진행률 |
| `hw.html` | **문제 풀이 페이지** — 코드 에디터, 실행(▶), 채점, 자동 기록 |
| `login.html` | 학교 이메일(@khu.ac.kr) 회원가입/로그인/비밀번호 재설정 |
| `viewer.html` | .ipynb 브라우저 미리보기 (자료실 노트북 열람용) |
| `admin.html` | **관리자 전용** — 주차·학생별 통과 현황, 학생 코드 열람, 코드 ZIP, 마감일 설정 |
| `js/pyrunner.js` | 브라우저 파이썬 실행기 (웹워커, 8초 타임아웃으로 무한 루프 보호) |
| `problems/weekN.json` | 주차별 문제 데이터 (문제 설명 + 기대 출력. **답안 코드는 미포함**) |
| `js/config.js` | ★ 사이트 설정 (Supabase 키, 주차별 자료 목록) |
| `supabase/schema.sql` | DB 스키마 1 (가입/프로필/마감일) |
| `supabase/schema2_interactive.sql` | DB 스키마 2 (문제별 풀이 기록) |
| `materials/` | 주차별 PDF·숙제 노트북 (답안 `_ANS` 파일은 **절대 넣지 말 것**) |

문제 데이터는 상위 폴더의 `tools/convert_hw.py`가 숙제/답안 노트북 쌍에서 자동 생성합니다
(답안 노트북과 변환 도구는 저장소·사이트에 포함되지 않음).

## 채점 방식

- 각 문제는 노트북 셀처럼 위→아래로 이어지는 맥락에서 실행됩니다 (앞 문제의 변수 사용 가능).
- "채점"을 누르면 학생 코드의 출력을 기대 출력과 비교합니다.
  - 마지막 줄이 표현식이면 노트북처럼 값이 출력된 것으로 처리 (`print()`를 쓴 경우도 정답 인정)
  - `input()` 문제는 정해진 입력값을 자동 공급 (학생은 실행 시 입력값을 바꿔볼 수 있음)
  - `random` 등 결과가 매번 다른 문제는 패턴 검사
  - 일부러 오류를 관찰하는 문제는 오류 메시지가 곧 정답
- 통과 즉시 Supabase에 기록되므로 **별도 제출이 없습니다.** 마감 후 통과는 "지각"으로 표시됩니다.
- 한 번 통과한 문제는 이후 다시 채점해 틀려도 통과 상태가 유지됩니다.

## 처음 설정 (Supabase)

1. https://supabase.com 무료 프로젝트 생성 → Settings → API의 URL/anon key를 [js/config.js](js/config.js)에 입력
2. SQL Editor에서 [supabase/schema.sql](supabase/schema.sql) 실행 → 이어서 [supabase/schema2_interactive.sql](supabase/schema2_interactive.sql) 실행
3. Authentication → URL Configuration: `Site URL`과 `Redirect URLs`에 배포 주소 입력
4. **이메일 발송 설정 (개강 전 필수)**: Supabase 기본 메일러는 발송 한도가 매우 낮습니다.
   - (권장) [Resend](https://resend.com) 무료 SMTP를 Authentication → Emails → SMTP Settings에 연결, 또는
   - (간편) Authentication → Sign In / Providers → Email에서 `Confirm email` 끄기
5. 관리자 추가: `insert into public.admins (email) values ('조교이메일@khu.ac.kr');`

## 학기 중 운영

- **마감일 설정**: 관리자 페이지 → 마감일 관리
- **현황 확인**: 관리자 페이지에서 주차 선택 → 학생별 통과 수·지각·마지막 활동, "코드 보기"로 개별 코드 열람
- **코드 수합**: "학생 코드 ZIP 다운로드" → `N주차_이름_학번.py` 형식으로 저장
- **문제 수정**: 원본 숙제/답안 노트북 수정 후 `tools/convert_hw.py` 재실행 → `tools/test_grading.py`로 전체 통과 확인 → `site` 커밋·푸시
- **새 학기 초기화**: SQL Editor에서 `delete from public.hw_progress;`

## 로컬에서 미리 보기

```
cd site
python -m http.server 8000   # http://localhost:8000
```

## 보안 관련 메모

- 답안 노트북(`_ANS.ipynb`)과 변환 도구는 site/에 넣지 마세요. 문제 JSON에는 기대 출력만 들어 있습니다.
- 학생은 자기 기록만 읽고 쓸 수 있으며, 전체 현황은 관리자만 볼 수 있습니다 (RLS로 강제).
- 채점은 학생 브라우저에서 수행되므로 마음먹은 학생은 결과를 조작할 수 있습니다.
  제출된 코드가 함께 저장되므로 표본 검사로 보완하세요 (교양 수업 수준에서는 충분).
- 무료 용량: DB 500MB — 문제당 코드 몇 줄 수준이라 수백 명 규모도 여유 있습니다.
