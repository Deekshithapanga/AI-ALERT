# HVAC Predictive Maintenance System

### AI-Powered Mobile Alerting for Industrial HVAC Monitoring

---

# Project Overview

Manufacturing facilities depend heavily on HVAC systems for environmental stability, equipment safety, and operational continuity. However, traditional threshold-based alert systems often generate excessive false alarms, leading to alert fatigue among technicians.

In this challenge, the goal was to design a smarter mobile-first predictive maintenance system capable of:

* Detecting meaningful anomalies from sensor data
* Reducing false positives
* Prioritizing technician attention
* Providing explainable AI-driven recommendations
* Delivering actionable alerts directly on mobile devices

The system was built as a full-stack AI-powered mobile application using:

* React Native (Expo)
* FastAPI
* Python
* Isolation Forest (Machine Learning)
* Time-series feature engineering

The final solution provides:

* Real-time HVAC monitoring
* Intelligent alert prioritization
* Technician-focused mobile UI
* Sensor trend visualization
* AI-generated explanations and recommended actions
* Push notifications for critical alerts

---

# Problem Understanding

The maintenance team had stopped trusting the previous alerting system because:

* 90% of alerts were false alarms
* Important failures were buried in noise
* Threshold-based rules lacked context
* Technicians began silencing notifications

This challenge was not only a machine learning problem, but also a human-centered reliability problem.

The system therefore needed to:

* Detect abnormal system behavior intelligently
* Reduce unnecessary alerts
* Explain *why* alerts occur
* Help technicians quickly decide where to go and what to inspect

---

# My Approach

Instead of using simple thresholds, I approached the problem as an anomaly detection and risk prioritization problem.

The overall pipeline:

1. Clean and preprocess sensor data
2. Engineer time-series behavioral features
3. Detect anomalies using Isolation Forest
4. Smooth anomaly scores over time
5. Generate risk scores and alert levels
6. Provide AI-style explanations and actions
7. Deliver results through a mobile app optimized for technicians

---

# Tech Stack

## Frontend

* React Native
* Expo
* Expo Router
* Expo Notifications
* React Native Chart Kit

## Backend

* FastAPI
* Python
* Pandas
* NumPy
* Scikit-learn

## Machine Learning

* Isolation Forest (unsupervised anomaly detection)

---

# Dataset Understanding

The dataset contained real-time HVAC sensor readings for 5 HVAC units.

### Sensor Fields

* Temperature
* Pressure
* Airflow
* Vibration
* Power
* Timestamp
* Unit ID

The dataset intentionally included:

* Missing values
* Noisy signals
* Subtle anomalies
* Non-obvious failure patterns

This simulated real industrial environments where sensor data is rarely clean.

---

# Data Preprocessing

Handling messy sensor data was one of the most important parts of the project.

## 1. Time-Series Sorting

Data was first sorted by:

* Unit ID
* Timestamp

This ensured correct temporal sequencing.

## 2. Missing Value Handling

Instead of dropping rows, multiple strategies were used:

### Interpolation

Used to estimate missing sensor values using nearby values in the time series.

Example:
If temperature readings were missing between two valid timestamps, linear interpolation estimated intermediate values smoothly.

### Forward Fill

If interpolation still left missing values:

* previous valid readings were propagated forward

This preserved continuity for streaming sensor data.

### Final Fallback

Remaining missing values were replaced using median values.

This ensured model stability.

---

# Feature Engineering

Raw sensor readings alone are often insufficient for detecting real operational problems.

To improve anomaly detection, additional behavioral features were engineered.

## Rolling Means

Rolling averages were calculated to establish dynamic baselines.

Example:

* 5-point rolling temperature average

## Delta Features

Difference between current reading and rolling baseline.

Example:

* temp_delta

Helps identify sudden behavioral shifts.

## Pressure Drop

Percentage pressure change over time.

Useful for:

* leaks
* airflow blockages
* compressor issues

## Vibration Spike

Percentage change in vibration.

Useful for:

* motor instability
* rotating component wear
* mechanical imbalance

## Trend Features

Anomaly trend slopes were computed to determine whether systems were:

* worsening
* stabilizing
* recovering

---

# AI / Machine Learning Approach

## Why Isolation Forest?

I selected Isolation Forest because:

* The dataset did not contain labeled failure examples
* It works well for anomaly detection
* It performs efficiently on tabular sensor data
* It is lightweight enough for real-time systems
* It isolates abnormal behavior without requiring supervised training

This made it suitable for predictive maintenance.

---

# Anomaly Detection Pipeline

For each HVAC unit:

1. Sensor features were extracted
2. Isolation Forest was trained
3. Anomaly scores were generated
4. Scores were normalized
5. Rolling smoothing was applied

This reduced noise and prevented alert spikes from single abnormal readings.

---

# Alert Prioritization Logic

The system does not simply flag anomalies.

It converts anomalies into operational risk.

## Alert Levels

* LOW
* MEDIUM
* HIGH
* CRITICAL

## Failure Risk Score

A custom risk score was generated using:

* anomaly severity
* temperature instability
* pressure drops
* vibration spikes

This produced a technician-friendly risk score between 0–100.

---

# AI-Generated Explanations

One major issue with previous systems was lack of trust.

To improve trust, the system generates contextual explanations.

Examples:

* "Pressure dropped significantly"
* "Temperature instability combined with pressure loss suggests cooling inefficiency"
* "Vibration spike detected"

The app also generates recommended technician actions such as:

* inspect compressor
* check airflow blockage
* inspect rotating components

This transforms raw anomalies into actionable maintenance guidance.

---

# Mobile Application Design

The app was designed specifically for field technicians.

## Key Features

### Real-Time Alert Dashboard

Displays:

* active alerts
* risk scores
* urgency
* trend status

### Priority Response Banner

Highlights the highest-risk HVAC unit requiring immediate attention.

### Push Notifications

Critical alerts trigger:

* sound alerts
* mobile notifications

This ensures technicians can respond immediately without continuously checking the app.

### Sensor Trend Visualization

Technicians can:

* open any HVAC unit
* view sensor graphs
* switch between:

  * temperature
  * pressure
  * airflow
  * vibration
  * power

### AI Diagnosis Panel

Displays:

* root-cause reasoning
* operational interpretation
* recommended action

---

# Human-Centered Thinking

This project was intentionally designed around technician workflow.

The goal was not just anomaly detection.

The goal was:

* reducing alert fatigue
* improving trust
* helping technicians prioritize effectively
* minimizing unnecessary inspections

The interface prioritizes:

* clarity
* urgency
* explainability
* speed of interpretation

---

# How I Used AI During Development

AI tools were used throughout development to accelerate iteration and experimentation.

AI assisted with:

* debugging React Native issues
* improving UI structure
* refining anomaly detection logic
* exploring feature engineering ideas
* improving explanation generation
* optimizing mobile layouts
* structuring FastAPI endpoints

However:

* model selection
* system design
* logic integration
* preprocessing strategy
* risk engineering
* alert flow
* testing decisions

were manually designed, validated, and customized for this use case.

AI accelerated development, but system reasoning and architectural decisions remained human-driven.

---

# Trade-Offs Made

## 1. Polling Instead of WebSockets

The app polls the backend every 5 seconds instead of using real-time streaming sockets.

### Why?

* simpler implementation
* faster development
* stable for prototype/demo

### Trade-Off

* slightly less real-time responsiveness
* more network requests

---

## 2. Isolation Forest Instead of Deep Learning

I intentionally chose a lightweight anomaly detection model.

### Why?

* faster experimentation
* interpretable behavior
* easier deployment
* no labeled data required

### Trade-Off

* less predictive sophistication than LSTM forecasting models

---

## 3. Single Backend File

The backend logic was kept mostly inside one API file.

### Why?

* faster iteration
* easier debugging during development
* lower integration complexity

### Trade-Off

* less scalable architecture for production systems

---

## 4. Simulated Real-Time Data

The dataset is static and replayed through polling.

### Why?

* challenge constraints
* no live IoT stream available

### Trade-Off

* not fully production-realistic streaming behavior

---

# Challenges Faced

## Handling Noisy Time-Series Data

Sensor data contained fluctuations that could easily trigger false alerts.

Solution:

* rolling smoothing
* contextual scoring
* feature engineering

---

## Reducing False Positives

A core challenge was preventing excessive alerts.

Solution:

* anomaly smoothing
* trend analysis
* combined risk scoring

---

## Building Technician Trust

Raw anomaly scores are difficult for humans to trust.

Solution:

* explainable reasoning
* urgency levels
* recommended actions

---

## Mobile Notification Integration

Implementing notification handling and alert sound behavior inside Expo required additional debugging and testing.

---

# What I Would Improve With More Time

## Real Streaming Architecture

Replace polling with:

* WebSockets
* MQTT
* Kafka streams

---

## Advanced Forecasting Models

Experiment with:

* LSTM
* Temporal CNNs
* Transformer-based time-series models

for predictive forecasting instead of anomaly-only detection.

---

## Historical Analytics Dashboard

Add:

* maintenance history
* long-term trends
* unit reliability analysis
* technician performance insights

---

## Cloud Deployment

Deploy backend using:

* Docker
* AWS/GCP/Azure
* scalable inference pipelines

---

## Smarter Root-Cause Analysis

Use:

* multivariate causal inference
* failure pattern learning
* maintenance history correlation

---

# Conclusion

This project focused on building an intelligent predictive maintenance assistant rather than a simple alerting dashboard.

The final system combines:

* anomaly detection
* explainable AI
* mobile-first design
* technician-focused prioritization
* operational risk scoring

to address the real problem of alert fatigue in industrial environments.

The project demonstrates both:

* practical AI application
* human-centered system thinking

which are critical for real-world industrial AI solutions.


# Setup Instructions

## Prerequisites

Make sure the following are installed:

- Node.js
- Python 3.10+
- Expo Go mobile app
- Git

---

# Clone Repository

```bash
git clone https://github.com/Deekshithapanga/AI-ALERT.git

cd AI-ALERT
```

---

# Backend Setup

Open terminal inside the backend folder:

```bash
cd backend
```

## Create Virtual Environment

### Mac/Linux

```bash
python3 -m venv deekenv

source deekenv/bin/activate
```

### Windows

```bash
python -m venv deekenv

deekenv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install fastapi uvicorn pandas numpy scikit-learn
```

---

## Run Backend Server

```bash
uvicorn api:app --reload
```

Backend will run on:

```bash
http://127.0.0.1:8000
```

---

# Mobile App Setup

Open a new terminal:

```bash
cd ai-alert-mobile
```

---

## Install Dependencies

```bash
npm install
```

---

## Install Expo Packages

```bash
npx expo install expo-router expo-av expo-notifications react-native-chart-kit react-native-svg
```

---

## Start Expo App

```bash
npx expo start
```

---

# Run on Mobile Device

1. Install Expo Go from Play Store/App Store
2. Scan the QR code shown in terminal/browser
3. Ensure:
   - mobile device
   - backend server
   - development machine

are connected to the same WiFi network.

---

# Configure Backend API URL

Inside:

```bash
ai-alert-mobile/app/(tabs)/index.tsx
```

update:

```ts
fetch("http://YOUR_LOCAL_IP:8000/alerts")
```

Example:

```ts
fetch("http://192.168.0.108:8000/alerts")
```

Use your machine's local IP address.

---

# Features

- AI-powered HVAC anomaly detection
- Real-time technician alert dashboard
- Risk prioritization
- Push notifications
- Sensor trend graphs
- AI-generated diagnosis
- Recommended technician actions

---

# Project Structure

```bash
AI-ALERT/
│
├── backend/
│   ├── api.py
│   ├── backend.py
│   └── hvac_sensor_data.csv
│
├── ai-alert-mobile/
│   ├── app/
│   ├── assets/
│   └── package.json
│
├── screenshots/
│
├── README.md
│
└── .gitignore
```

---

# Notes

- The system currently uses polling every 5 seconds for fetching alerts.
- Isolation Forest is used for unsupervised anomaly detection.
- The dataset is replayed as simulated real-time data.
- The app is optimized for technician-focused mobile workflows.

---

# Walkthrough Video

Loom Video: https://www.loom.com/share/5c153a711ac040898803249f43983ed8
