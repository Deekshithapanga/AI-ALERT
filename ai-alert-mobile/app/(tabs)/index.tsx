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

import * as Notifications from "expo-notifications";

// ============================================================
// NOTIFICATION CONFIG
// ============================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Alert = {
  unit_id: string;
  timestamp: string;
  alert_level: string;
  confidence: number;
  reason: string;
  action: string;

  failure_risk: number;
  trend_status: string;
  urgency: string;
};

export default function HomeScreen() {

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const prevAlertsRef = useRef<Record<string, Alert>>({});
  const router = useRouter();

  const [topAlert, setTopAlert] = useState<Alert | null>(null);

  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  // ============================================================
  // ALERT SOUND
  // ============================================================

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

  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  const sendNotification = async (
    title: string,
    body: string
  ) => {

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  };

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  useEffect(() => {

    // ASK NOTIFICATION PERMISSION

    Notifications.requestPermissionsAsync();

    const fetchAlerts = () => {

      fetch("http://192.168.31.207:8000/alerts")

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

          let filtered = Object.values(latestMap);

          // ============================================================
          // STATS
          // ============================================================

          const newStats = {

            critical: filtered.filter(
              (a) => a.alert_level === "CRITICAL"
            ).length,

            high: filtered.filter(
              (a) => a.alert_level === "HIGH"
            ).length,

            medium: filtered.filter(
              (a) => a.alert_level === "MEDIUM"
            ).length,

            low: filtered.filter(
              (a) => a.alert_level === "LOW"
            ).length,
          };

          setStats(newStats);

          // ============================================================
          // SORT BY FAILURE RISK
          // ============================================================

          filtered.sort(
            (a, b) => b.failure_risk - a.failure_risk
          );

          // ============================================================
          // TOP ALERT
          // ============================================================

          setTopAlert(filtered[0] || null);

          // ============================================================
          // NEW ALERT DETECTION
          // ============================================================

          const prev = prevAlertsRef.current;

          filtered.forEach((item) => {

            const old = prev[item.unit_id];

            if (!old || old.alert_level !== item.alert_level) {

              if (item.alert_level === "CRITICAL") {

                // PLAY SOUND

                playAlertSound();

                // PUSH NOTIFICATION

                sendNotification(
                  "🚨 CRITICAL HVAC ALERT",
                  `${item.unit_id} requires immediate inspection`
                );
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

  // ============================================================
  // COLORS
  // ============================================================

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

  // ============================================================
  // CARD RENDER
  // ============================================================

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
            {
              borderLeftColor: getColor(item.alert_level),
            },
          ]}
        >

          <Text style={styles.title}>
            {item.unit_id}
          </Text>

          <View
            style={[
              styles.levelBadge,
              {
                backgroundColor: getColor(item.alert_level),
              },
            ]}
          >

            <Text style={styles.levelText}>
              {item.alert_level}
            </Text>

          </View>

          <Text style={styles.riskText}>
            Risk Score: {item.failure_risk}/100
          </Text>

          <Text style={styles.trendText}>
            Trend: {item.trend_status}
          </Text>

          <Text style={styles.urgencyText}>
            ⏱ {item.urgency}
          </Text>

          <Text style={styles.text}>
            Confidence: {(item.confidence * 100).toFixed(1)}%
          </Text>

          <Text style={styles.text}>
            Time: {new Date(item.timestamp).toLocaleString()}
          </Text>

          <Text style={styles.reasonText}>
            Reason: {item.reason}
          </Text>

          <View style={styles.actionBox}>

            <Text style={styles.actionTitle}>
              Recommended Action
            </Text>

            <Text style={styles.actionText}>
              {item.action}
            </Text>

          </View>

        </View>

      </Pressable>
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (

    <View style={styles.container}>

      <Text style={styles.header}>
        HVAC Predictive Maintenance
      </Text>

      <Text style={styles.subHeader}>
        AI-powered technician alert system
      </Text>

      {/* ===================================================== */}
      {/* STATS */}
      {/* ===================================================== */}

      <View style={styles.statsContainer}>

        <View
          style={[
            styles.statCard,
            { backgroundColor: "#ff4d4d" },
          ]}
        >
          <Text style={styles.statNumber}>
            {stats.critical}
          </Text>

          <Text style={styles.statLabel}>
            CRITICAL
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: "#ff944d" },
          ]}
        >
          <Text style={styles.statNumber}>
            {stats.high}
          </Text>

          <Text style={styles.statLabel}>
            HIGH
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: "#ffd11a" },
          ]}
        >
          <Text style={styles.statNumber}>
            {stats.medium}
          </Text>

          <Text style={styles.statLabel}>
            MEDIUM
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: "#4CAF50" },
          ]}
        >
          <Text style={styles.statNumber}>
            {stats.low}
          </Text>

          <Text style={styles.statLabel}>
            LOW
          </Text>
        </View>

      </View>

      {/* ===================================================== */}
      {/* PRIORITY BANNER */}
      {/* ===================================================== */}

      {topAlert && (

        <View style={styles.priorityBanner}>

          <Text style={styles.priorityTitle}>
            🚨 PRIORITY RESPONSE
          </Text>

          <Text style={styles.priorityUnit}>
            {topAlert.unit_id}
          </Text>

          <Text style={styles.priorityText}>
            Alert Level: {topAlert.alert_level}
          </Text>

          <Text style={styles.priorityText}>
            Risk Score: {topAlert.failure_risk}/100
          </Text>

          <Text style={styles.priorityText}>
            Immediate Action:
          </Text>

          <Text style={styles.priorityAction}>
            {topAlert.action}
          </Text>

        </View>
      )}

      {/* ===================================================== */}
      {/* ALERT LIST */}
      {/* ===================================================== */}

      <FlatList
        data={alerts}
        keyExtractor={(item, index) =>
          item.unit_id + index
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 80,
    backgroundColor: "#000",
  },

  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  subHeader: {
    color: "#888",
    marginBottom: 15,
  },

  priorityBanner: {
    backgroundColor: "#2b0000",
    borderWidth: 1,
    borderColor: "#ff4d4d",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  priorityTitle: {
    color: "#ff4d4d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  priorityUnit: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },

  priorityText: {
    color: "#ddd",
    marginTop: 4,
  },

  priorityAction: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 5,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statCard: {
    flex: 1,
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  statNumber: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },

  statLabel: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderLeftWidth: 8,
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },

  levelText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },

  riskText: {
    color: "#ff6666",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },

  trendText: {
    color: "#ffd11a",
    fontSize: 15,
    marginBottom: 4,
  },

  urgencyText: {
    color: "#4CAF50",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  text: {
    color: "#ccc",
    marginTop: 4,
    fontSize: 14,
  },

  reasonText: {
    color: "#fff",
    marginTop: 10,
    lineHeight: 22,
    fontSize: 15,
  },

  actionBox: {
    marginTop: 14,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  actionTitle: {
    color: "#ff944d",
    fontWeight: "bold",
    marginBottom: 5,
  },

  actionText: {
    color: "#fff",
    lineHeight: 22,
  },
});