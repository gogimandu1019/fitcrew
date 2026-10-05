// 분석 이벤트 (계획안 5절). 이름은 지표와 1:1로 맞춘다.
//   크루 합류율 = signup_complete → group_join / group_create
//   주간 기록 사용자, 4주 리텐션 = workout_logged
// 목표 달성률·일간 참여율·리텐션 수치는 서버 뷰(supabase/migrations/..0500, metrics_*)가 원본이다.
// 이벤트 수집 서비스는 아직 정하지 않았다: setAnalyticsSink 로 연결하기 전까지 개발 중 콘솔에만 남는다.
// 개인정보 원칙: 닉네임·신체 정보·메모 같은 내용은 이벤트에 넣지 않는다.

export type AnalyticsEvent =
  | { name: 'signup_complete'; props: { sports: number } }
  | { name: 'group_create'; props?: undefined }
  | { name: 'group_join'; props?: undefined }
  | { name: 'workout_logged'; props: { duration_min: number; edited: boolean } };

type Sink = (event: AnalyticsEvent) => void;

let sink: Sink | null = null;

export function setAnalyticsSink(next: Sink | null) {
  sink = next;
}

export function track(event: AnalyticsEvent) {
  try {
    if (sink) sink(event);
    else if (__DEV__) console.debug('[analytics]', event.name, event.props ?? '');
  } catch {
    // 분석이 앱 동작을 막으면 안 된다.
  }
}
