import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type RouteValue = { path: string; params: Record<string, any> };
type NavApi = {
  route: RouteValue;
  replace: (target: any) => void;
  push: (target: any) => void;
  back: () => void;
  forward: () => void;
};

const NavigationContext = createContext<NavApi | null>(null);
let externalNav: Pick<NavApi, 'replace' | 'push' | 'back' | 'forward'> | null = null;

function normalizeTarget(target: any): RouteValue {
  if (typeof target === 'string') return { path: target, params: {} };
  if (target && typeof target === 'object') {
    return { path: String(target.pathname || '/home'), params: target.params || {} };
  }
  return { path: '/home', params: {} };
}

export const router = {
  replace(target: any) { externalNav?.replace(target); },
  push(target: any) { externalNav?.push(target); },
  back() { externalNav?.back(); },
  forward() { externalNav?.forward(); },
};

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<RouteValue>({ path: '/', params: {} });
  const history = useRef<RouteValue[]>([]);
  const forwardHistory = useRef<RouteValue[]>([]);

  const api = useMemo<NavApi>(() => ({
    route,
    replace(target: any) {
      const next = normalizeTarget(target);
      history.current = [];
      forwardHistory.current = [];
      setRoute(next);
    },
    push(target: any) {
      const next = normalizeTarget(target);
      history.current.push(route);
      forwardHistory.current = [];
      setRoute(next);
    },
    back() {
      const previous = history.current.pop();
      if (previous) {
        forwardHistory.current.push(route);
        setRoute(previous);
        return;
      }
      if (route.path !== '/home' && route.path !== '/') setRoute({ path: '/home', params: {} });
    },
    forward() {
      const next = forwardHistory.current.pop();
      if (next) {
        history.current.push(route);
        setRoute(next);
      }
    },
  }), [route]);

  useEffect(() => {
    externalNav = { replace: api.replace, push: api.push, back: api.back, forward: api.forward };
    return () => { externalNav = null; };
  }, [api]);

  return <NavigationContext.Provider value={api}>{children}</NavigationContext.Provider>;
}

export function useCurrentRoute() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('NavigationProvider is missing');
  return ctx.route;
}

export function useLocalSearchParams<T extends Record<string, any> = Record<string, any>>(): T {
  return useCurrentRoute().params as T;
}

export function useFocusEffect(effect: () => void | (() => void)) {
  const route = useCurrentRoute();
  useEffect(() => effect(), [route.path, JSON.stringify(route.params)]);
}
