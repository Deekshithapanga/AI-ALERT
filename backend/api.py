from fastapi import FastAPI
import pandas as pd
import numpy as np

app = FastAPI()

# Load your dataset
df = pd.read_csv("hvac_sensor_data.csv")

df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values(['unit_id', 'timestamp'])

# ---- Minimal pipeline (reuse your logic but simplified) ----

sensor_cols = ['temp', 'pressure', 'airflow', 'vibration', 'power']

df[sensor_cols] = df.groupby('unit_id')[sensor_cols].transform(
    lambda x: x.interpolate().ffill()
)

df['temp_mean_5'] = df.groupby('unit_id')['temp'].transform(lambda x: x.rolling(5, min_periods=1).mean())
df['temp_delta'] = df['temp'] - df['temp_mean_5']

df['pressure_drop'] = df.groupby('unit_id')['pressure'].pct_change().fillna(0)
df['vibration_spike'] = df.groupby('unit_id')['vibration'].pct_change().fillna(0)

feature_cols = ['temp', 'pressure', 'airflow', 'vibration', 'power', 'temp_delta']

df[feature_cols] = df[feature_cols].fillna(0)

from sklearn.ensemble import IsolationForest

df['anomaly_score'] = 0.0

for unit in df['unit_id'].unique():
    unit_data = df[df['unit_id'] == unit]
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(unit_data[feature_cols])
    scores = model.decision_function(unit_data[feature_cols])
    df.loc[unit_data.index, 'anomaly_score'] = (scores.max() - scores)

df['anomaly_score'] = df.groupby('unit_id')['anomaly_score'].transform(
    lambda x: (x - x.min()) / (x.max() - x.min() + 1e-8)
)

df['anomaly_score_smooth'] = df.groupby('unit_id')['anomaly_score'].transform(
    lambda x: x.rolling(5, min_periods=1).mean()
)

df['anomaly_trend'] = df.groupby('unit_id')['anomaly_score_smooth'].diff().fillna(0)

def get_alert(row):
    if row['anomaly_score_smooth'] > 0.6:
        return "CRITICAL"
    elif row['anomaly_score_smooth'] > 0.45 and row['anomaly_trend'] > 0:
        return "HIGH"
    elif row['anomaly_score_smooth'] > 0.3:
        return "MEDIUM"
    else:
        return "LOW"

df['alert_level'] = df.apply(get_alert, axis=1)

def format_alert(row):
    return {
        "unit_id": row['unit_id'],
        "timestamp": row['timestamp'].isoformat(),
        "alert_level": row['alert_level'],
        "confidence": round(row['anomaly_score_smooth'], 2),
        "reason": "Auto-detected anomaly",
        "action": "Inspect system"
    }

priority_map = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 0}
df['priority_score'] = df['alert_level'].map(priority_map)

df['alert_change'] = df.groupby('unit_id')['alert_level'].shift(1)

alerts = df[
    (df['alert_level'] != "LOW") &
    (df['alert_level'] != df['alert_change']) &
    (df['anomaly_score_smooth'] > 0.35)
].sort_values(
    ['priority_score', 'anomaly_score_smooth', 'timestamp'],
    ascending=[False, False, False]
).head(10)

@app.get("/alerts")
def get_alerts():
    return alerts.apply(format_alert, axis=1).tolist()