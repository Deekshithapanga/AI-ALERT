# %%
import pandas as pd
from sklearn.ensemble import IsolationForest

# =========================
# LOAD DATA
# =========================
df = pd.read_csv("hvac_sensor_data.csv")

# Convert timestamp
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values(['unit_id', 'timestamp'])

# =========================
# HANDLE MISSING VALUES
# =========================
sensor_cols = ['temp', 'pressure', 'airflow', 'vibration', 'power']

# Interpolation
df[sensor_cols] = df.groupby('unit_id')[sensor_cols].transform(
    lambda x: x.interpolate(method='linear')
)

# Forward fill
df[sensor_cols] = df.groupby('unit_id')[sensor_cols].transform(
    lambda x: x.ffill()
)

# Feature-based filling
df['temp_pressure_ratio'] = df['temp'] / (df['pressure'] + 1e-5)

df['temp'] = df['temp'].fillna(
    df['pressure'] * df.groupby('unit_id')['temp_pressure_ratio']
    .transform(lambda x: x.rolling(5).mean())
)

# Final fallback
df[sensor_cols] = df[sensor_cols].fillna(df[sensor_cols].median())

# =========================
# FEATURE ENGINEERING
# =========================

# Rolling means
df['temp_mean_5'] = df.groupby('unit_id')['temp'].transform(lambda x: x.rolling(5).mean())
df['pressure_mean_5'] = df.groupby('unit_id')['pressure'].transform(lambda x: x.rolling(5).mean())
df['vibration_mean_5'] = df.groupby('unit_id')['vibration'].transform(lambda x: x.rolling(5).mean())

# Deviations
df['temp_delta'] = df['temp'] - df['temp_mean_5']
df['pressure_delta'] = df['pressure'] - df['pressure_mean_5']
df['vibration_delta'] = df['vibration'] - df['vibration_mean_5']

# Rate of change
df['temp_rate'] = df.groupby('unit_id')['temp'].diff()
df['pressure_rate'] = df.groupby('unit_id')['pressure'].diff()
df['vibration_rate'] = df.groupby('unit_id')['vibration'].diff()

# Percentage change
df['pressure_drop'] = df.groupby('unit_id')['pressure'].pct_change()
df['airflow_drop'] = df.groupby('unit_id')['airflow'].pct_change()
df['vibration_spike'] = df.groupby('unit_id')['vibration'].pct_change()

# Cross features
df['temp_airflow_ratio'] = df['temp'] / (df['airflow'] + 1e-5)
df['temp_pressure_ratio'] = df['temp'] / (df['pressure'] + 1e-5)

# Fill remaining NaNs
df = df.fillna(0)

# =========================
# ANOMALY DETECTION
# =========================

feature_cols = [
    'temp', 'pressure', 'airflow', 'vibration', 'power',
    'temp_delta', 'pressure_delta', 'vibration_delta',
    'temp_rate', 'pressure_rate', 'vibration_rate',
    'pressure_drop', 'airflow_drop', 'vibration_spike',
    'temp_airflow_ratio', 'temp_pressure_ratio'
]

models = {}
df['anomaly_score'] = 0.0

for unit in df['unit_id'].unique():
    unit_data = df[df['unit_id'] == unit]
    
    X = unit_data[feature_cols]
    
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    scores = model.decision_function(X)
    
    df.loc[unit_data.index, 'anomaly_score'] = (scores.max() - scores)
    
    models[unit] = model

# Normalize per unit
df['anomaly_score'] = df.groupby('unit_id')['anomaly_score'].transform(
    lambda x: (x - x.min()) / (x.max() - x.min())
)

# =========================
# SMOOTHING + TREND
# =========================

df['anomaly_score_smooth'] = df.groupby('unit_id')['anomaly_score'] \
    .transform(lambda x: x.rolling(5, min_periods=1).mean())

df['anomaly_trend'] = df.groupby('unit_id')['anomaly_score_smooth'].diff()

# =========================
# ALERT LOGIC
# =========================

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

# =========================
# EXPLANATION
# =========================

temp_thresh = df['temp_delta'].abs().quantile(0.9)
pressure_thresh = df['pressure_drop'].quantile(0.1)
vibration_thresh = df['vibration_spike'].quantile(0.9)

def explain_alert(row):
    reasons = []
    
    if abs(row['temp_delta']) > temp_thresh:
        reasons.append("Temperature deviation")
        
    if row['pressure_drop'] < pressure_thresh:
        reasons.append("Pressure drop")
        
    if row['vibration_spike'] > vibration_thresh:
        reasons.append("Vibration spike")
    
    if row['anomaly_trend'] > 0.02:
        reasons.append("Anomaly increasing")
    
    if row['anomaly_score_smooth'] > 0.35:
        reasons.append("Sustained abnormal behavior")
    
    if not reasons:
        if row['alert_level'] == "LOW":
            return "Normal system behavior"
        elif row['anomaly_score_smooth'] > 0.3:
            return "Unusual behavior detected (low signal confidence)"
        else:
            return "Minor deviation observed"
    
    return ", ".join(reasons[:2])

df['alert_reason'] = df.apply(explain_alert, axis=1)

# =========================
# ACTION RECOMMENDATION
# =========================

def get_action(reason):
    if "Pressure drop" in reason:
        return "Check for leaks or blockage"
    if "Vibration spike" in reason:
        return "Inspect motor/compressor"
    if "Temperature deviation" in reason:
        return "Check cooling system"
    if "Sustained abnormal behavior" in reason:
        return "Perform full system inspection"
    if "Anomaly increasing" in reason:
        return "Monitor closely for escalation"
    
    return "Monitor system"

df['recommended_action'] = df['alert_reason'].apply(get_action)

# =========================
# FINAL OUTPUT
# =========================

def format_alert(row):
    return {
        "unit_id": row['unit_id'],
        "timestamp": str(row['timestamp']),
        "alert_level": row['alert_level'],
        "confidence": round(row['anomaly_score_smooth'], 2),
        "reason": row['alert_reason'],
        "action": row['recommended_action']
    }

alerts = df[df['alert_level'] != "LOW"].tail(10).apply(format_alert, axis=1).tolist()

# View alerts
print(alerts)