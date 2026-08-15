// ─────────────────────────────────────────────────────────────
// 과목/사이트 설정
// Supabase 프로젝트 생성 후 아래 SUPABASE_URL, SUPABASE_ANON_KEY 두 값을
// 본인 프로젝트 값으로 바꿔주세요. (Supabase 대시보드 → Settings → API)
// anon key는 공개되어도 되는 키입니다. 실제 보안은 RLS 정책이 담당합니다.
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL: "https://gblkqqdazvpsogmetqza.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_shxwl1BXHMvAc7r2gn94xg_mZQBiL7S",

  COURSE_CODE: "OPEN 1003-00",
  COURSE_NAME: "미래교육2",
  EMAIL_DOMAIN: "khu.ac.kr",

  // 주차별 자료 및 과제. homework가 null이면 그 주는 제출 과제가 없습니다.
  WEEKS: [
    {
      week: 1, title: "Orientation & Python 소개",
      materials: [{ label: "강의자료 (PDF)", file: "materials/week1/01_Intro.pdf" }],
      homework: null,
    },
    {
      week: 2, title: "Variables",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week2/02_Variables.pdf" },
        { label: "숙제 노트북", file: "materials/week2/02_Variables.ipynb" },
      ],
      homework: "materials/week2/02_Variables.ipynb",
    },
    {
      week: 3, title: "String",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week3/03_String.pdf" },
        { label: "숙제 노트북", file: "materials/week3/03_String.ipynb" },
      ],
      homework: "materials/week3/03_String.ipynb",
    },
    {
      week: 4, title: "String & Boolean",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week4/04_String_Boolean.pdf" },
        { label: "숙제 노트북", file: "materials/week4/04_String_Boolean.ipynb" },
      ],
      homework: "materials/week4/04_String_Boolean.ipynb",
    },
    {
      week: 5, title: "Data Types Ⅰ",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week5/05_Data_types.pdf" },
        { label: "숙제 노트북", file: "materials/week5/05_Data_types.ipynb" },
      ],
      homework: "materials/week5/05_Data_types.ipynb",
    },
    {
      week: 6, title: "Data Types Ⅱ",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week6/06_Data_types.pdf" },
        { label: "숙제 노트북", file: "materials/week6/06_Data_types.ipynb" },
      ],
      homework: "materials/week6/06_Data_types.ipynb",
    },
    {
      week: 7, title: "Conditional Statement",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week7/07_Conditional_Statement.pdf" },
        { label: "숙제 노트북", file: "materials/week7/07_Conditional_Statement.ipynb" },
      ],
      homework: "materials/week7/07_Conditional_Statement.ipynb",
    },
    {
      week: 8, title: "Loop (While)",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week8/08_Loop.pdf" },
        { label: "숙제 노트북", file: "materials/week8/08_While_Loop.ipynb" },
      ],
      homework: "materials/week8/08_While_Loop.ipynb",
    },
    {
      week: 9, title: "Loop (For)",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week9/09_Loop.pdf" },
        { label: "숙제 노트북", file: "materials/week9/09_For_Loop.ipynb" },
      ],
      homework: "materials/week9/09_For_Loop.ipynb",
    },
    {
      week: 10, title: "Function",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week10/10_Function.pdf" },
        { label: "숙제 노트북", file: "materials/week10/10_Function.ipynb" },
      ],
      homework: "materials/week10/10_Function.ipynb",
    },
    {
      week: 11, title: "Class & Modules",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week11/11_Class_Modules.pdf" },
        { label: "숙제 노트북", file: "materials/week11/11_Class_Modules.ipynb" },
      ],
      homework: "materials/week11/11_Class_Modules.ipynb",
    },
    {
      week: 12, title: "Class",
      materials: [
        { label: "강의자료 (PDF)", file: "materials/week12/12_Class.pdf" },
        { label: "숙제 노트북", file: "materials/week12/12_Class.ipynb" },
      ],
      homework: "materials/week12/12_Class.ipynb",
    },
  ],
};
