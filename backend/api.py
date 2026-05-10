from fastapi import FastAPI
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

app = FastAPI()

# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv("hvac_sensor_data.csv")

df['timestamp'] = pd.to_datetime(df['timestamp'])

df = df.sort_values(['unit_id', 'timestamp'])

# ============================================================
# DATA CLEANING
# ============================================================

sensor_cols = ['temp', 'pressure', 'airflow', 'vibration', 'power']

df[sensor_cols] = df.groupby('unit_id')[sensor_cols].transform(
    lambda x: x.interpolate().ffill()
)

# ============================================================
# FEATURE ENGINEERING
# ============================================================

df['temp_mean_5'] = df.groupby('unit_id')['temp'].transform(
    lambda x: x.rolling(5, min_periods=1).mean()
)

df['temp_delta'] = df['temp'] - df['temp_mean_5']

df['pressure_drop'] = df.groupby('unit_id')['pressure'].pct_change().fillna(0)

df['vibration_spike'] = df.groupby('unit_id')['vibration'].pct_change().fillna(0)

feature_cols = [
    'temp',
    'pressure',
    'airflow',
    'vibration',
    'power',
    'temp_delta'
]

df[feature_cols] = df[feature_cols].fillna(0)

# ============================================================
# ANOMALY DETECTION
# ============================================================

df['anomaly_score'] = 0.0

for unit in df['unit_id'].unique():

    unit_data = df[df['unit_id'] == unit]

    model = IsolationForest(
        contamination=0.05,
        random_state=42
    )

    model.fit(unit_data[feature_cols])

    scores = model.decision_function(
        unit_data[feature_cols]
    )

    df.loc[unit_data.index, 'anomaly_score'] = (
        scores.max() - scores
    )

# ============================================================
# NORMALIZE SCORES
# ============================================================

df['anomaly_score'] = df.groupby('unit_id')['anomaly_score'].transform(
    lambda x: (
        (x - x.min()) /
        (x.max() - x.min() + 1e-8)
    )
)

# ============================================================
# SMOOTHING
# ============================================================

df['anomaly_score_smooth'] = df.groupby('unit_id')['anomaly_score'].transform(
    lambda x: x.rolling(
        5,
        min_periods=1
    ).mean()
)

df['anomaly_trend'] = df.groupby('unit_id')[
    'anomaly_score_smooth'
].diff().fillna(0)

# ============================================================
# ALERT LEVELS
# ============================================================

def get_alert(row):

    if row['anomaly_score_smooth'] > 0.6:
        return "CRITICAL"

    elif (
        row['anomaly_score_smooth'] > 0.45 and
        row['anomaly_trend'] > 0
    ):
        return "HIGH"

    elif row['anomaly_score_smooth'] > 0.3:
        return "MEDIUM"

    else:
        return "LOW"


df['alert_level'] = df.apply(get_alert, axis=1)

# ============================================================
# FAILURE RISK ENGINE
# ============================================================

def get_failure_risk(row):

    risk = 0

    # anomaly contribution
    risk += row['anomaly_score_smooth'] * 50

    # temperature instability
    risk += min(abs(row['temp_delta']) * 20, 15)

    # pressure problems
    if row['pressure_drop'] < -0.05:
        risk += 15

    # vibration spikes
    if row['vibration_spike'] > 0.1:
        risk += 20

    return min(round(risk), 100)


def get_urgency(risk):

    if risk >= 80:
        return "Inspect immediately"

    elif risk >= 60:
        return "Inspect within 2 hours"

    elif risk >= 40:
        return "Monitor closely this shift"

    else:
        return "Routine monitoring"


def get_trend_status(row):

    if row['anomaly_trend'] > 0.03:
        return "Rapidly worsening"

    elif row['anomaly_trend'] > 0:
        return "Increasing"

    elif row['anomaly_trend'] < -0.02:
        return "Recovering"

    else:
        return "Stable"


df['failure_risk'] = df.apply(
    get_failure_risk,
    axis=1
)

df['urgency'] = df['failure_risk'].apply(
    get_urgency
)

df['trend_status'] = df.apply(
    get_trend_status,
    axis=1
)

# ============================================================
# AI-STYLE EXPLANATION ENGINE
# ============================================================

def explain(row):

    reasons = []

    if abs(row['temp_delta']) > 0.5:
        reasons.append(
            "Temperature increased beyond rolling baseline"
        )

    if row['pressure_drop'] < -0.05:
        reasons.append(
            "Pressure dropped significantly"
        )

    if row['vibration_spike'] > 0.1:
        reasons.append(
            "Vibration spike detected"
        )

    # contextual explanations

    if (
        row['pressure_drop'] < -0.05 and
        row['vibration_spike'] > 0.1
    ):
        return (
            "Pressure decreased while vibration increased, "
            "which may indicate airflow restriction or "
            "early compressor instability."
        )

    if (
        abs(row['temp_delta']) > 0.5 and
        row['pressure_drop'] < -0.05
    ):
        return (
            "Temperature instability combined with pressure loss "
            "suggests possible cooling inefficiency or blocked airflow."
        )

    if (
        abs(row['temp_delta']) > 0.5 and
        row['vibration_spike'] > 0.1
    ):
        return (
            "Temperature fluctuation with rising vibration "
            "may indicate motor strain or fan imbalance."
        )

    if not reasons:
        return (
            "Minor operational anomaly detected outside normal behavior."
        )

    return ". ".join(reasons[:2]) + "."


def get_action(row):

    if (
        row['pressure_drop'] < -0.05 and
        row['vibration_spike'] > 0.1
    ):
        return (
            "Inspect compressor and airflow ducts immediately."
        )

    elif row['vibration_spike'] > 0.1:
        return (
            "Inspect motor and rotating components."
        )

    elif row['pressure_drop'] < -0.05:
        return (
            "Check for airflow blockage or leakage."
        )

    elif abs(row['temp_delta']) > 0.5:
        return (
            "Inspect cooling efficiency and ventilation."
        )

    else:
        return (
            "Continue monitoring system behavior."
        )

# ============================================================
# ALERTS ENDPOINT
# ============================================================

@app.get("/alerts")

def get_alerts():

    results = []

    for unit in df['unit_id'].unique():

        unit_df = df[
            df['unit_id'] == unit
        ].sort_values("timestamp")

        latest = unit_df.iloc[-1]

        # ====================================================
        # GRAPH HISTORY
        # ====================================================

        history = unit_df.tail(20)[[
    'timestamp',
    'temp',
    'pressure',
    'airflow',
    'vibration',
    'power'
]].copy()

        history['timestamp'] = history[
            'timestamp'
        ].astype(str)

        # ====================================================
        # ALERT OBJECT
        # ====================================================

        results.append({

            "unit_id": latest['unit_id'],

            "timestamp": latest[
                'timestamp'
            ].isoformat(),

            "alert_level": latest[
                'alert_level'
            ],

            "confidence": round(
                latest['anomaly_score_smooth'],
                2
            ),

            "failure_risk": int(
                latest['failure_risk']
            ),

            "trend_status": latest[
                'trend_status'
            ],

            "urgency": latest[
                'urgency'
            ],

            # ====================================================
            # SENSOR INSIGHTS
            # ====================================================

            "temperature": round(
                latest['temp'],
                2
            ),

            "pressure_change": round(
                latest['pressure_drop'] * 100,
                2
            ),

            "vibration_change": round(
                latest['vibration_spike'] * 100,
                2
            ),

            # ====================================================
            # AI REASONING
            # ====================================================

            "reason": explain(latest),

            "action": get_action(latest),

            # ====================================================
            # GRAPH DATA
            # ====================================================

            "history": history.to_dict(
                orient='records'
            )
        })

    # ============================================================
    # SORT BY RISK
    # ============================================================

    results = sorted(
        results,
        key=lambda x: x['failure_risk'],
        reverse=True
    )

    return results

# ============================================================
# DASHBOARD STATS
# ============================================================

@app.get("/stats")

def get_stats():

    latest_df = df.groupby(
        'unit_id'
    ).tail(1)

    return {

        "critical": int(
            (
                latest_df['alert_level']
                == "CRITICAL"
            ).sum()
        ),

        "high": int(
            (
                latest_df['alert_level']
                == "HIGH"
            ).sum()
        ),

        "medium": int(
            (
                latest_df['alert_level']
                == "MEDIUM"
            ).sum()
        ),

        "low": int(
            (
                latest_df['alert_level']
                == "LOW"
            ).sum()
        )
    }