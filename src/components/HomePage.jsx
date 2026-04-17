import styles from './HomePage.module.css'

export default function HomePage({ onNavigate }) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.hero_icon}>
          <LogoIcon />
        </div>
        <h1 className={styles.hero_title}>Flow Tester</h1>
        <p className={styles.hero_sub}>Swagger 기반 API 플로우 자동화 테스트 도구 · 슬로그업</p>
      </div>

      <div className={styles.steps}>
        <Step
          num="1"
          icon={<GridIcon />}
          title="모듈 등록"
          desc="Swagger URL을 등록하면 API 목록이 자동으로 불러와집니다."
          action="모듈 관리 열기"
          onClick={() => onNavigate('modules')}
        />
        <Arrow />
        <Step
          num="2"
          icon={<FlowIcon />}
          title="플로우 빌더"
          desc="API를 드래그해 순서대로 연결하고, 이전 응답 값을 다음 요청에 바인딩합니다."
          action="플로우 빌더 열기"
          onClick={() => onNavigate('flow')}
        />
        <Arrow />
        <Step
          num="3"
          icon={<PlayIcon />}
          title="실행 & 확인"
          desc="플로우를 실행하면 각 스텝의 요청·응답·상태코드를 한눈에 확인할 수 있습니다."
          action="실행 결과 열기"
          onClick={() => onNavigate('run')}
        />
      </div>

      <div className={styles.cards}>
        <InfoCard icon={<SaveIcon />} title="플로우 저장">
          <p>빌더에서 <Kbd>⌘S</Kbd> 또는 저장 버튼으로 플로우를 저장합니다.</p>
          <p>저장된 플로우는 언제든 불러오거나 바로 실행할 수 있습니다.</p>
        </InfoCard>

        <InfoCard icon={<EnvIcon />} title="환경변수">
          <p>URL에 <code className={styles.code}>{'{{API_HOST}}'}</code> 형식으로 변수를 사용합니다.</p>
          <p>환경별로 값을 다르게 설정해 개발/스테이징/운영을 전환하세요.</p>
        </InfoCard>

        <InfoCard icon={<BindIcon />} title="응답 바인딩">
          <p>이전 스텝 응답의 필드를 <code className={styles.code}>{'{{login.token}}'}</code> 형식으로 다음 스텝 헤더·바디에 주입합니다.</p>
        </InfoCard>

        <InfoCard icon={<ImportIcon />} title="플로우 가져오기">
          <p>JSON으로 플로우를 빠르게 정의할 수 있습니다.</p>
          <pre className={styles.code_block}>{`{
  "flow": [
    { "api": "로그인", "save": { "token": "token" } },
    { "api": "내 정보 조회",
      "use": { "Authorization": "Bearer {{token}}" } }
  ]
}`}</pre>
        </InfoCard>

        <InfoCard icon={<CollectionIcon />} title="컬렉션">
          <p>왼쪽 상단의 컬렉션 선택기로 프로젝트를 분리합니다.</p>
          <p>모듈·환경·플로우가 컬렉션별로 독립적으로 관리됩니다.</p>
        </InfoCard>

        <InfoCard icon={<CloudIcon />} title="Supabase 동기화">
          <p>Supabase가 연결되면 데이터가 자동으로 클라우드에 저장됩니다.</p>
          <p>팀원과 같은 컬렉션을 공유해 함께 사용할 수 있습니다.</p>
        </InfoCard>
      </div>
    </div>
  )
}

function Step({ num, icon, title, desc, action, onClick }) {
  return (
    <div className={styles.step}>
      <div className={styles.step_num}>{num}</div>
      <div className={styles.step_icon}>{icon}</div>
      <div className={styles.step_title}>{title}</div>
      <div className={styles.step_desc}>{desc}</div>
      <button className={styles.step_btn} onClick={onClick}>{action} →</button>
    </div>
  )
}

function Arrow() {
  return (
    <div className={styles.arrow}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    </div>
  )
}

function InfoCard({ icon, title, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.card_header}>
        <span className={styles.card_icon}>{icon}</span>
        <span className={styles.card_title}>{title}</span>
      </div>
      <div className={styles.card_body}>{children}</div>
    </div>
  )
}

function Kbd({ children }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="2.5"/>
      <circle cx="4.5" cy="19" r="2.5"/>
      <circle cx="19.5" cy="19" r="2.5"/>
      <line x1="12" y1="7.5" x2="4.5" y2="16.5"/>
      <line x1="12" y1="7.5" x2="19.5" y2="16.5"/>
    </svg>
  )
}
function GridIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function FlowIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/></svg>
}
function PlayIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
}
function EnvIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
}
function BindIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
}
function ImportIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
}
function CollectionIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
}
function CloudIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
}
