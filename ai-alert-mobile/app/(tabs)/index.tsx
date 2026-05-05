import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

// ✅ Proper typing
type Alert = {
  unit_id: string;
  timestamp: string;
  alert_level: string;
  confidence: number;
  reason: string;
  action: string;
};

export default function HomeScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // 🔥 Track previous alerts
  const prevAlertsRef = useRef<Record<string, Alert>>({});

  useEffect(() => {
    const fetchAlerts = () => {
      fetch("http://192.168.0.108:8000/alerts")
        .then((res) => res.json())
        .then((data: Alert[]) => {
          const latestMap: Record<string, Alert> = {};

          data.forEach((item) => {
            if (
              !latestMap[item.unit_id] ||
              new Date(item.timestamp) >
                new Date(latestMap[item.unit_id].timestamp)
            ) {
              latestMap[item.unit_id] = item;
            }
          });

          const filtered = Object.values(latestMap);

          const priority: Record<string, number> = {
            CRITICAL: 3,
            HIGH: 2,
            MEDIUM: 1,
            LOW: 0,
          };

          filtered.sort(
            (a, b) => priority[b.alert_level] - priority[a.alert_level]
          );

          // 🔥 CHANGE DETECTION
          const prev = prevAlertsRef.current;

          filtered.forEach((item) => {
            const old = prev[item.unit_id];

            if (!old || old.alert_level !== item.alert_level) {
              // 🚨 popup for CRITICAL
              if (item.alert_level === "CRITICAL") {
                alert(`🚨 CRITICAL ALERT: ${item.unit_id}`);
              }
            }
          });

          // 🔄 update reference
          const map: Record<string, Alert> = {};
          filtered.forEach((a) => (map[a.unit_id] = a));
          prevAlertsRef.current = map;

          setAlerts(filtered);
        })
        .catch((err) => console.log(err));
    };

    // 🔥 initial fetch
    fetchAlerts();

    // 🔁 auto refresh every 5 sec
    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🎨 Color mapping
  const getColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "#ff4d4d";
      case "HIGH":
        return "#ff944d";
      case "MEDIUM":
        return "#ffd11a";
      default:
        return "#4CAF50";
    }
  };

  // 📦 Card UI with highlight
  const renderItem = ({ item }: { item: Alert }) => {
    const prev = prevAlertsRef.current[item.unit_id];

    const isNew =
      !prev || prev.alert_level !== item.alert_level;

    return (
      <View
        style={[
          styles.card,
          { borderLeftColor: getColor(item.alert_level) },
          isNew && { backgroundColor: "#2a2a2a" }, // 🔥 highlight
        ]}
      >
        <Text style={styles.title}>{item.unit_id}</Text>

        <Text
          style={{
            color: getColor(item.alert_level),
            fontWeight: "bold",
          }}
        >
          {item.alert_level}
        </Text>

        <Text style={styles.text}>
          Confidence: {(item.confidence * 100).toFixed(1)}%
        </Text>

        <Text style={styles.text}>
          Time: {new Date(item.timestamp).toLocaleString()}
        </Text>

        <Text style={styles.text}>Reason: {item.reason}</Text>
        <Text style={styles.text}>Action: {item.action}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>No alerts 🚀</Text>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.unit_id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#000",
  },

  card: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 6,
  },

  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  text: {
    color: "#ccc",
    marginTop: 4,
  },

  empty: {
    color: "white",
    textAlign: "center",
    marginTop: 50,
  },
});