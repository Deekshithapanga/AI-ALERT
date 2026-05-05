import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";

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
  const prevAlertsRef = useRef<Record<string, Alert>>({});
  const router = useRouter();

  const playAlertSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alert.mp3")
      );
      await sound.playAsync();
    } catch (e) {
      console.log("Sound error", e);
    }
  };

  useEffect(() => {
    const fetchAlerts = () => {
      fetch("http://192.168.0.108:8000/alerts")
        .then((res) => res.json())
        .then((data: Alert[]) => {
          const latestMap: Record<string, Alert> = {};

          // keep only latest alert per unit
          data.forEach((item) => {
            if (
              !latestMap[item.unit_id] ||
              new Date(item.timestamp) >
                new Date(latestMap[item.unit_id].timestamp)
            ) {
              latestMap[item.unit_id] = item;
            }
          });

          let filtered = Object.values(latestMap);

          const priority: Record<string, number> = {
            CRITICAL: 3,
            HIGH: 2,
            MEDIUM: 1,
            LOW: 0,
          };

          // sort by severity
          filtered.sort(
            (a, b) => priority[b.alert_level] - priority[a.alert_level]
          );

          // detect new alerts
          const prev = prevAlertsRef.current;

          filtered.forEach((item) => {
            const old = prev[item.unit_id];

            if (!old || old.alert_level !== item.alert_level) {
              if (item.alert_level === "CRITICAL") {
                playAlertSound();
                alert(`🚨 CRITICAL ALERT: ${item.unit_id}`);
              }
            }
          });

          const newMap: Record<string, Alert> = {};
          filtered.forEach((a) => (newMap[a.unit_id] = a));
          prevAlertsRef.current = newMap;

          setAlerts(filtered);
        })
        .catch(console.log);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const renderItem = ({ item }: { item: Alert }) => {
    return (
      <Pressable
        onPress={() =>
          router.push({
           pathname: "/alert/graph",
           params: { data: JSON.stringify(item) },
           })
        }
      >
        <View
          style={[
            styles.card,
            { borderLeftColor: getColor(item.alert_level) },
          ]}
        >
          <Text style={styles.title}>{item.unit_id}</Text>

          <View
            style={{
              backgroundColor: getColor(item.alert_level),
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 5,
              marginBottom: 5,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              {item.alert_level}
            </Text>
          </View>

          <Text style={styles.text}>
            Confidence: {(item.confidence * 100).toFixed(1)}%
          </Text>

          <Text style={styles.text}>
            Time: {new Date(item.timestamp).toLocaleString()}
          </Text>

          <Text style={styles.text}>Reason: {item.reason}</Text>
          <Text style={styles.text}>Action: {item.action}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item, index) => item.unit_id + index} // ✅ FIXED
        renderItem={renderItem}
      />
    </View>
  );
}

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
  },
  text: {
    color: "#ccc",
    marginTop: 4,
  },
});