import type { LibraryResponse } from "@anlat-hoca/contracts";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { ApiClientError, getLibrary } from "@/api";
import { getOrCreateInstallationId } from "@/services/installation/installation-id";

interface UseLibraryDataOptions {
  lessonLimit: number;
  documentLimit: number;
}

export function useLibraryData({
  lessonLimit,
  documentLimit,
}: UseLibraryDataOptions) {
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestSequence = useRef(0);

  const load = useCallback(
    async (refresh: boolean) => {
      const sequence = ++requestSequence.current;

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const installationId = await getOrCreateInstallationId();
        const response = await getLibrary({
          installationId,
          lessonLimit,
          documentLimit,
        });

        if (sequence === requestSequence.current) {
          setData(response);
        }
      } catch (caught: unknown) {
        if (sequence === requestSequence.current) {
          setError(getLibraryErrorMessage(caught));
        }
      } finally {
        if (sequence === requestSequence.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [documentLimit, lessonLimit],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);

      return () => {
        requestSequence.current += 1;
      };
    }, [load]),
  );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh: () => load(true),
    retry: () => load(false),
  };
}

function getLibraryErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "Çalışma geçmişin şu anda yüklenemiyor.";
  }

  if (error.kind === "network") {
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
  }

  if (error.kind === "timeout") {
    return "Çalışma geçmişinin yüklenmesi beklenenden uzun sürdü.";
  }

  if (error.kind === "configuration") {
    return "Sunucu adresi yapılandırılmamış.";
  }

  return "Çalışma geçmişin şu anda yüklenemiyor.";
}
