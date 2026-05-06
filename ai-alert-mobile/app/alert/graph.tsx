import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";

import { LineChart } from "react-native-chart-kit";

export default function GraphScreen() {

  const params = useLocalSearchParams();

  const data = params.data
    ? JSON.parse(params.data as string)
    : null;

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
  // GRAPH DATA
  // ============================================================

  const temps = data.history.map((d: any) => d.temp);

  const labels = data.history.map((d: any) =>
    new Date(d.timestamp).getHours() +
    ":" +
    new Date(d.timestamp)
      .getMinutes()
      .toString()
      .padStart(2, "0")
  );

  // ============================================================
  // COLOR
  // ============================================================

  const getColor = () => {

    switch (data.alert_level) {

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

  return (

    <ScrollView style={styles.container}>

      {/* ===================================================== */}
      {/* TITLE */}
      {/* ===================================================== */}

      <Text style={styles.title}>
        {data.unit_id} Temperature Trend
      </Text>

      {/* ===================================================== */}
      {/* GRAPH */}
      {/* ===================================================== */}

      <LineChart
        data={{
          labels: labels.slice(-6),
          datasets: [
            {
              data: temps,
            },
          ],
        }}
        width={Dimensions.get("window").width - 20}
        height={240}
        yAxisSuffix="°C"
        chartConfig={{
          backgroundColor: "#000",
          backgroundGradientFrom: "#000",
          backgroundGradientTo: "#000",
          decimalPlaces: 1,

          color: () => getColor(),

          labelColor: () => "#ccc",

          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: getColor(),
          },
        }}
        bezier
        style={{
          marginVertical: 10,
          borderRadius: 12,
        }}
      />

      {/* ===================================================== */}
      {/* ALERT STATUS */}
      {/* ===================================================== */}

      <View
        style={[
          styles.alertBox,
          {
            borderColor: getColor(),
          },
        ]}
      >

        <Text
          style={[
            styles.alertLevel,
            {
              color: getColor(),
            },
          ]}
        >
          {data.alert_level}
        </Text>

        <Text style={styles.text}>
          Confidence:
          {" "}
          {(data.confidence * 100).toFixed(1)}%
        </Text>

        <Text style={styles.text}>
          Risk Score:
          {" "}
          {data.failure_risk}/100
        </Text>

        <Text style={styles.text}>
          Trend:
          {" "}
          {data.trend_status}
        </Text>

        <Text style={styles.text}>
          Urgency:
          {" "}
          {data.urgency}
        </Text>

      </View>

      {/* ===================================================== */}
      {/* SENSOR INSIGHTS */}
      {/* ===================================================== */}

      <View style={styles.infoCard}>

        <Text style={styles.cardTitle}>
          Sensor Insights
        </Text>

        <Text style={styles.infoText}>
          🌡 Temperature:
          {" "}
          {data.temperature} °C
        </Text>

        <Text style={styles.infoText}>
          📉 Pressure Change:
          {" "}
          {data.pressure_change}%
        </Text>

        <Text style={styles.infoText}>
          ⚙ Vibration Change:
          {" "}
          {data.vibration_change}%
        </Text>

      </View>

      {/* ===================================================== */}
      {/* AI EXPLANATION */}
      {/* ===================================================== */}

      <View style={styles.infoCard}>

        <Text style={styles.cardTitle}>
          AI Diagnosis
        </Text>

        <Text style={styles.infoText}>
          {data.reason}
        </Text>

      </View>

      {/* ===================================================== */}
      {/* ACTION */}
      {/* ===================================================== */}

      <View style={styles.actionCard}>

        <Text style={styles.actionTitle}>
          Recommended Technician Action
        </Text>

        <Text style={styles.actionText}>
          {data.action}
        </Text>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  alertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: "#111",
  },

  alertLevel: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  text: {
    color: "#ccc",
    marginTop: 6,
    fontSize: 15,
  },

  infoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  cardTitle: {
    color: "#ff944d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  infoText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 24,
  },

  actionCard: {
    backgroundColor: "#2b0000",
    borderWidth: 1,
    borderColor: "#ff4d4d",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },

  actionTitle: {
    color: "#ff4d4d",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  actionText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
  },
});