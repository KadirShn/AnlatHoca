import type { GuestSessionResponse } from "@anlat-hoca/contracts";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiClientError, bootstrapGuestSession, getHealth } from "@/api";
import { getApiConfiguration } from "@/config/api";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";

export type AppBootstrapState =
  | { status: "initializing" }
  | { status: "ready"; session: GuestSessionResponse }
  | { status: "offline"; reason: "network" | "timeout" }
  | { status: "configurationError"; reason: "missing" | "invalid" }
  | { status: "error" };

interface AppBootstrapContextValue {
  state: AppBootstrapState;
  retry: () => void;
}

const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null);

async function resolveBootstrapState(): Promise<AppBootstrapState> {
  try {
    const installationId = await getOrCreateInstallationId();
    const configuration = getApiConfiguration();

    if (configuration.status !== "configured") {
      return {
        status: "configurationError",
        reason: configuration.status,
      };
    }

    await getHealth();
    const session = await bootstrapGuestSession({ installationId });
    return { status: "ready", session };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.kind === "configuration") {
        return { status: "configurationError", reason: "invalid" };
      }

      if (error.kind === "network" || error.kind === "timeout") {
        return { status: "offline", reason: error.kind };
      }
    }

    if (__DEV__) {
      console.warn("Uygulama başlatma işlemi tamamlanamadı.");
    }
    return { status: "error" };
  }
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppBootstrapState>({
    status: "initializing",
  });
  const attemptRef = useRef(0);

  const retry = useCallback(() => {
    const attempt = ++attemptRef.current;
    setState({ status: "initializing" });

    void resolveBootstrapState().then((nextState) => {
      if (attempt === attemptRef.current) {
        setState(nextState);
      }
    });
  }, []);

  useEffect(() => {
    const attempt = ++attemptRef.current;

    void resolveBootstrapState().then((nextState) => {
      if (attempt === attemptRef.current) {
        setState(nextState);
      }
    });

    return () => {
      attemptRef.current += 1;
    };
  }, []);

  const value = useMemo(() => ({ state, retry }), [retry, state]);

  return (
    <AppBootstrapContext.Provider value={value}>
      {children}
    </AppBootstrapContext.Provider>
  );
}

export function useAppBootstrap() {
  const context = useContext(AppBootstrapContext);

  if (!context) {
    throw new Error("useAppBootstrap must be used inside AppBootstrapProvider.");
  }

  return context;
}
