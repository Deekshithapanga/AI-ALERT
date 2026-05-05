import { useLocalSearchParams } from "expo-router";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function GraphScreen() {
  const params = useLocalSearchParams();
  const data = params.data ? JSON.parse(params.data as string) : null;

  if (!data || !data.history) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No graph data available</Text>
      </View>
    );
  }

  // 🔥 Extract values
  const temps = data.history.map((d: any) => d.temp);

  // 🔥 Extract time labels (last 5 only for clarity)
  const labels = data.history.map((d: any) =>
    new Date(d.timestamp).getHours() + ":" +
    new Date(d.timestamp).getMinutes().toString().padStart(2, "0")
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data.unit_id} Temperature Trend</Text>

      <LineChart
        data={{
          labels: labels.slice(-6), // show last few labels
          datasets: [
            {
              data: temps,
            },
          ],
        }}
        width={Dimensions.get("window").width - 20}
        height={220}
        yAxisSuffix="°C"
        chartConfig={{
          backgroundColor: "#000",
          backgroundGradientFrom: "#000",
          backgroundGradientTo: "#000",
          decimalPlaces: 1,
          color: () => "#ff4d4d",
          labelColor: () => "#ccc",
          propsForDots: {
            r: "3",
          },
        }}
        bezier
        style={{
          marginVertical: 10,
          borderRadius: 10,
        }}
      />

      <Text style={styles.text}>
        Current Alert: {data.alert_level}
      </Text>

      <Text style={styles.text}>
        Confidence: {(data.confidence * 100).toFixed(1)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#000",
  },
  title: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    color: "#ccc",
    marginTop: 8,
  },
});