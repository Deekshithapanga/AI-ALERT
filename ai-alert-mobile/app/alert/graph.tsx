import { useLocalSearchParams } from "expo-router";

import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";

import { useState } from "react";

import { LineChart } from "react-native-chart-kit";

export default function GraphScreen() {

  const params = useLocalSearchParams();

  const data = params.data
    ? JSON.parse(params.data as string)
    : null;

  const [selectedSensor, setSelectedSensor] =
    useState("temp");

  if (!data || !data.history) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          No graph data available
        </Text>
      </View>
    );
  }

  // ============================================================
  // SENSOR VALUES
  // ============================================================

  const sensorData = data.history.map(
    (d: any) => d[selectedSensor]
  );

  // ============================================================
  // LABELS
  // ============================================================

  const labels = data.history.map((d: any) => {

    const date = new Date(d.timestamp);

    return (
      date.getHours() +
      ":" +
      date.getMinutes().toString().padStart(2, "0")
    );
  });

  // ============================================================
  // SENSOR TITLES
  // ============================================================

  const sensorTitles: any = {
    temp: "Temperature",
    pressure: "Pressure",
    airflow: "Airflow",
    vibration: "Vibration",
    power: "Power",
  };

  // ============================================================
  // Y AXIS
  // ============================================================

  const getSuffix = () => {

    switch (selectedSensor) {

      case "temp":
        return "°C";

      case "pressure":
        return "";

      case "airflow":
        return "";

      case "power":
        return "kW";

      default:
        return "";
    }
  };

  return (

    <View style={styles.container}>

      {/* ===================================================== */}
      {/* TITLE */}
      {/* ===================================================== */}

      <Text style={styles.title}>
        {data.unit_id} {sensorTitles[selectedSensor]} Trend
      </Text>

      {/* ===================================================== */}
      {/* SENSOR TABS */}
      {/* ===================================================== */}

      <View style={styles.tabContainer}>

        {Object.keys(sensorTitles).map((sensor) => (

          <Pressable
            key={sensor}
            onPress={() => setSelectedSensor(sensor)}
            style={[
              styles.tab,
              selectedSensor === sensor &&
                styles.activeTab,
            ]}
          >

            <Text
              style={[
                styles.tabText,
                selectedSensor === sensor &&
                  styles.activeTabText,
              ]}
            >
              {sensorTitles[sensor]}
            </Text>

          </Pressable>
        ))}

      </View>

      {/* ===================================================== */}
      {/* GRAPH */}
      {/* ===================================================== */}

      <LineChart
        data={{
          labels: labels.slice(-6),
          datasets: [
            {
              data: sensorData,
            },
          ],
        }}
        width={Dimensions.get("window").width - 20}
        height={260}
        yAxisSuffix={getSuffix()}
        chartConfig={{
          backgroundColor: "#000",
          backgroundGradientFrom: "#000",
          backgroundGradientTo: "#000",

          decimalPlaces: 2,

          color: () => "#ff4d4d",

          labelColor: () => "#ccc",

          propsForDots: {
            r: "4",
          },
        }}
        bezier
        style={{
          marginVertical: 10,
          borderRadius: 12,
        }}
      />

      {/* ===================================================== */}
      {/* ALERT CARD */}
      {/* ===================================================== */}

      <View
        style={[
          styles.alertBox,
          {
            borderColor:
              data.alert_level === "CRITICAL"
                ? "#ff4d4d"
                : "#444",
          },
        ]}
      >

        <Text
          style={[
            styles.alertTitle,
            {
              color:
                data.alert_level === "CRITICAL"
                  ? "#ff4d4d"
                  : "#ffd11a",
            },
          ]}
        >
          {data.alert_level}
        </Text>

        <Text style={styles.infoText}>
          Confidence: {(data.confidence * 100).toFixed(1)}%
        </Text>

        <Text style={styles.infoText}>
          Risk Score: {data.failure_risk}/100
        </Text>

        <Text style={styles.infoText}>
          Trend: {data.trend_status}
        </Text>

        <Text style={styles.infoText}>
          Urgency: {data.urgency}
        </Text>

      </View>

      {/* ===================================================== */}
      {/* SENSOR INSIGHTS */}
      {/* ===================================================== */}

      <View style={styles.insightBox}>

        <Text style={styles.sectionTitle}>
          Sensor Insights
        </Text>

        <Text style={styles.infoText}>
          🌡 Temperature: {data.temperature} °C
        </Text>

        <Text style={styles.infoText}>
          📉 Pressure Change: {data.pressure_change}%
        </Text>

        <Text style={styles.infoText}>
          ⚙ Vibration Change: {data.vibration_change}%
        </Text>

      </View>

      {/* ===================================================== */}
      {/* AI DIAGNOSIS */}
      {/* ===================================================== */}

      <View style={styles.insightBox}>

        <Text style={styles.sectionTitle}>
          AI Diagnosis
        </Text>

        <Text style={styles.diagnosis}>
          {data.reason}
        </Text>

      </View>

      {/* ===================================================== */}
      {/* ACTION */}
      {/* ===================================================== */}

      <View style={styles.actionBox}>

        <Text style={styles.actionTitle}>
          Recommended Technician Action
        </Text>

        <Text style={styles.actionText}>
          {data.action}
        </Text>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
  flex: 1,
  backgroundColor: "#000",
  padding: 10,
  paddingTop: 70,
},

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  // ============================================================
  // TABS
  // ============================================================

  tabContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  tab: {
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  activeTab: {
    backgroundColor: "#ff4d4d",
  },

  tabText: {
    color: "#ccc",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },

  // ============================================================
  // ALERT BOX
  // ============================================================

  alertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
  },

  alertTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  // ============================================================
  // INFO
  // ============================================================

  infoText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 8,
  },

  // ============================================================
  // SECTION
  // ============================================================

  insightBox: {
    backgroundColor: "#151515",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  sectionTitle: {
    color: "#ff944d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  diagnosis: {
    color: "white",
    fontSize: 16,
    lineHeight: 26,
  },

  // ============================================================
  // ACTION
  // ============================================================

  actionBox: {
    backgroundColor: "#2b0000",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ff4d4d",
    marginBottom: 30,
  },

  actionTitle: {
    color: "#ff4d4d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  actionText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
  },

  text: {
    color: "white",
  },
});