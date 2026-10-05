// 연결 상태: NetInfo를 TanStack Query의 onlineManager에 연결한다.
// 오프라인이면 조회를 멈췄다가 다시 연결되면 자동으로 새로 불러온다.
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

let started = false;

export function startNetworkWatch() {
  if (started) return;
  started = true;
  // 인터넷 도달성 확인은 NetInfo가 외부 주소(구글)로 요청을 보내는 방식이라 끈다.
  // 막힌 네트워크를 오프라인으로 잘못 판단하는 일도 없도록 연결 여부만 본다.
  NetInfo.configure({ reachabilityShouldRun: () => false });
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)));
}

export function useOnline(): boolean {
  return useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline(), () => true);
}
