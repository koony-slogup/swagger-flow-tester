# Swagger Flow Tester

멀티모듈 환경에서 API 플로우를 구성하고 자동으로 테스트하는 도구입니다.

## 시작하기

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 기능

- **모듈 관리** — 각 서비스의 Swagger Base URL 등록
- **플로우 빌더** — 드래그앤드롭으로 API 실행 순서 구성
- **응답값 연결** — 이전 API 응답값을 다음 API 파라미터로 자동 바인딩
- **플로우 저장** — localStorage에 영구 저장 (새로고침 후에도 유지)
- **실행 결과** — 각 스텝 상태코드, 응답시간, 응답 바디 확인

## 실제 API 연결

`src/components/RunPage.jsx`의 `executeApi` 함수에서 mock을 실제 fetch로 교체하세요:

```js
async function executeApi(baseUrl, api, params) {
  const isBody = ['POST', 'PUT', 'PATCH'].includes(api.method)
  const url = baseUrl + api.path.replace(/{(\w+)}/g, (_, k) => params[k] || `:${k}`)
  const res = await fetch(url, {
    method: api.method,
    headers: { 'Content-Type': 'application/json' },
    body: isBody ? JSON.stringify(params) : undefined,
  })
  const body = await res.json()
  return { ok: res.ok, status: res.status, body }
}
```

> CORS 이슈가 있을 경우 각 서비스에서 `Access-Control-Allow-Origin` 헤더를 허용하거나, Vite 프록시(`vite.config.js`)를 사용하세요.

## 프로젝트 구조

```
src/
├── store.js                  # Zustand 전역 상태 (localStorage 영구 저장)
├── App.jsx                   # 레이아웃 + 사이드바 네비게이션
├── index.css                 # 글로벌 CSS 변수 & 리셋
└── components/
    ├── ModulesPage.jsx       # 모듈 등록/관리
    ├── FlowBuilder.jsx       # 플로우 빌더 (드래그앤드롭)
    ├── SavedFlows.jsx        # 저장된 플로우 목록
    ├── RunPage.jsx           # 실행 + 결과 확인
    └── ui.jsx                # 공통 UI 컴포넌트
```
