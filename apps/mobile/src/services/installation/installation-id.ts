import { installationIdSchema } from "@anlat-hoca/contracts";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const INSTALLATION_ID_KEY = "anlat-hoca.installation-id";

let webInstallationId: string | null = null;

function createInstallationId() {
  return Crypto.randomUUID();
}

export async function getOrCreateInstallationId(): Promise<string> {
  if (Platform.OS === "web") {
    webInstallationId ??= createInstallationId();
    return webInstallationId;
  }

  const storedValue = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  const storedInstallationId = installationIdSchema.safeParse(storedValue);

  if (storedInstallationId.success) {
    return storedInstallationId.data;
  }

  const installationId = createInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId);
  return installationId;
}
