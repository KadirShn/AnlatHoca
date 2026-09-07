import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Anlat Hoca</Text>
        <Text style={styles.subtitle}>AI destekli çalışma asistanı</Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 17,
    marginTop: 8,
    textAlign: "center",
  },
});
