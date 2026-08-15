# 미래교육2 (OPEN 1003-00) — 과제 제출 사이트

주차별 강의자료 배포 + Jupyter 노트북(.ipynb) 과제 제출을 위한 정적 웹사이트입니다.
서버 없이 **GitHub Pages(무료 호스팅) + Supabase(무료 백엔드)** 조합으로 동작합니다.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 홈 — 주차별 자료 다운로드 + 내 제출 현황 |
| `login.html` | 학교 이메일(@khu.ac.kr) 회원가입/로그인/비밀번호 재설정 |
| `submit.html` | 과제 업로드 (드래그앤드롭, 재제출 가능, 지각 자동 표시) |
| `viewer.html` | .ipynb 브라우저 미리보기 (자료실 파일 + 제출본) |
| `admin.html` | **관리자 전용** — 제출 현황/미제출자/ZIP 일괄 다운로드/마감일 설정/수강생 목록 |
| `js/config.js` | ★ 사이트 설정 (Supabase 키, 주차별 자료 목록) |
| `supabase/schema.sql` | ★ Supabase에서 1회 실행할 DB 스키마 |
| `materials/` | 주차별 PDF·숙제 노트북 (답안 `_ANS` 파일은 **절대 넣지 말 것**) |

## 처음 설정 (약 20분, 1회만)

### 1단계. Supabase 프로젝트 만들기

1. https://supabase.com 에서 가입 후 **New project** (Free 플랜, 리전은 Northeast Asia(Seoul) 권장).
2. 생성 후 **Settings → API**에서 두 값을 복사:
   - `Project URL` (https://xxxx.supabase.co)
   - `anon public` 키
3. 이 두 값을 [js/config.js](js/config.js) 맨 위의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 붙여넣기.
   - anon 키는 공개되어도 되는 키입니다. 실제 보안(누가 무엇을 읽고 쓰는지)은 아래 SQL의 RLS 정책이 담당합니다.

### 2단계. 데이터베이스 스키마 실행

1. Supabase 대시보드 → **SQL Editor** → New query.
2. [supabase/schema.sql](supabase/schema.sql) 내용 전체를 붙여넣고 **Run**.
3. 이것으로 테이블, 보안 정책, 제출 파일 저장소(버킷)까지 모두 만들어집니다.
   - 관리자로 `kim87@khu.ac.kr`이 미리 등록되어 있습니다. 조교를 추가하려면:
     `insert into public.admins (email) values ('조교이메일@khu.ac.kr');`

### 3단계. 인증(로그인) 설정

Supabase 대시보드 → **Authentication**:

1. **URL Configuration**에서
   - `Site URL`: 배포할 사이트 주소 (예: `https://아이디.github.io/저장소명/`)
   - `Redirect URLs`에 같은 주소 추가 (`https://.../**` 형태 권장).
2. **Sign In / Providers → Email**: 기본값(Email 활성, Confirm email 켜짐) 그대로 두면 됩니다.

> ⚠️ **중요 — 이메일 발송 한도**
> Supabase 기본 메일러는 시간당 발송 수가 매우 적어(테스트용), 수강생 수십 명이
> 같은 시기에 가입하면 인증 메일이 발송되지 않습니다. 개강 전에 둘 중 하나를 선택하세요.
>
> - **(권장) 무료 SMTP 연결**: [Resend](https://resend.com) 가입(무료: 하루 100통) 후
>   Supabase → Authentication → Emails → SMTP Settings에 입력. 10분 정도 걸립니다.
> - **(간편) 이메일 확인 끄기**: Authentication → Sign In / Providers → Email에서
>   `Confirm email`을 끄면 인증 메일 없이 즉시 가입됩니다.
>   이 경우에도 khu.ac.kr 도메인 제한은 DB에서 강제되지만,
>   "그 메일함의 실제 주인"인지까지는 확인하지 못합니다.

### 4단계. 사이트 배포

**방법 A — GitHub Pages (권장, 주소가 고정됨)**

1. GitHub에 새 저장소를 만들고 `site` 폴더 내용물을 업로드
   (저장소 웹페이지에서 "uploading an existing file"로 끌어다 놓아도 됩니다).
2. 저장소 **Settings → Pages** → Branch를 `main`으로 설정 → Save.
3. 몇 분 후 `https://아이디.github.io/저장소명/`으로 접속 가능.

**방법 B — Netlify Drop (가장 간단, 계정만 있으면 끌어놓기 한 번)**

1. https://app.netlify.com/drop 에 `site` 폴더를 통째로 끌어다 놓기.

배포 후 그 주소를 3단계의 `Site URL`에 넣는 것을 잊지 마세요.

### 5단계. 동작 확인

1. 배포된 사이트에서 본인 이메일로 회원가입 → 로그인.
2. 아무 주차나 테스트 파일 제출 → 관리자 이메일로 로그인하면 상단에 **관리자** 메뉴가 나타남.
3. 관리자 페이지에서 제출 확인, ZIP 다운로드, 마감일 설정 테스트.

## 학기 중 운영

- **마감일 설정**: 관리자 페이지 → 마감일 관리. 마감 후 제출은 차단하지 않고 "지각"으로만 표시됩니다.
- **과제 수합**: 관리자 페이지에서 주차 선택 → "전체 ZIP 다운로드" → `학번_이름.ipynb` 형식으로 저장됩니다.
- **채점**: 제출 목록의 "미리보기"로 브라우저에서 바로 노트북을 열람할 수 있습니다 (Jupyter 실행 불필요).
- **자료 추가/교체**: `materials/weekN/`에 파일을 넣고 `js/config.js`의 `WEEKS` 목록을 수정한 뒤 다시 배포.
- **새 학기 초기화**: Supabase SQL Editor에서
  `delete from public.submissions;` 실행 + Storage → submissions 버킷 비우기.

## 로컬에서 미리 보기

브라우저 보안 정책 때문에 파일을 더블클릭하면 일부 기능이 동작하지 않습니다.
`site` 폴더에서 간단한 로컬 서버를 띄워 확인하세요.

```
cd site
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 보안 관련 메모

- 답안 노트북(`_ANS.ipynb`)은 **절대 이 폴더(site/)에 넣지 마세요.** 정적 사이트의 모든 파일은 학생이 내려받을 수 있습니다.
- 학생은 자기 제출물만 읽고 쓸 수 있으며, 다른 학생의 제출물·명단은 관리자만 볼 수 있습니다 (RLS로 강제).
- 학생 미리보기 시 노트북의 마크다운은 정화(DOMPurify) 후 표시되고, HTML 출력은 렌더링하지 않습니다.
- 무료 용량: DB 500MB / 저장소 1GB — 노트북이 개당 ~15KB이므로 수백 명 규모도 여유 있습니다.
