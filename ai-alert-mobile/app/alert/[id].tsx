import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

export default function AlertDetail() {
  const params = useLocalSearchParams();

  const alert = params.data ? JSON.parse(params.data as string) : null;

  if (!alert) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{alert.unit_id}</Text>

      <Text style={styles.level}>{alert.alert_level}</Text>

      <Text style={styles.text}>
        Confidence: {(alert.confidence * 100).toFixed(1)}%
      </Text>

      <Text style={styles.text}>
        Time: {new Date(alert.timestamp).toLocaleString()}
      </Text>

      <Text style={styles.text}>Reason: {alert.reason}</Text>
      <Text style={styles.text}>Action: {alert.action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  level: {
    color: "#ff4d4d",
    fontSize: 18,
    marginVertical: 10,
  },
  text: {
    color: "#ccc",
    marginTop: 8,
  },
});