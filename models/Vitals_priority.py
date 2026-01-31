import joblib
import shap
import pandas as pd
import numpy as np

# ----------------------------
# CONFIG
# ----------------------------

vitals_input = {
    "Temperature_C": 38.2,
    "Temperature_trend": 0.7,
    "SpO2_percent": 92,
    "SpO2_trend": -2.5,
    "HeartRate_bpm": 130,
    "HeartRate_trend": 10,
    "RespRate_bpm": 38,
    "RespRate_trend": 8,
    "Cough": 1,
    "Retractions": 1
}

MODEL_PATH = r"C:\Users\Arun\Downloads\Lovelace\vitals_model.pkl"

FEATURE_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

# ----------------------------
# LOAD MODEL (once)
# ----------------------------

vitals_model = joblib.load(MODEL_PATH)

scaler = vitals_model.named_steps["scaler"]
clf = vitals_model.named_steps["clf"]

# SHAP explainer (Logistic Regression → LinearExplainer)
# Create background data for masker (VERY IMPORTANT)
# Use zeros or training mean – zeros are fine after scaling
background = np.zeros((1, len(FEATURE_COLUMNS)))

masker = shap.maskers.Independent(background)

explainer = shap.LinearExplainer(
    clf,
    masker=masker,
    feature_names=FEATURE_COLUMNS
)

# ----------------------------
# SHAP EXPLANATION FUNCTION
# ----------------------------

def explain_vitals(vitals_dict):
    """
    vitals_dict: dict with all vitals (single patient)

    Returns:
    - probability
    - top contributing features (signed)
    - shap values (raw)
    """

    # Convert input to DataFrame
    X = pd.DataFrame([vitals_dict])[FEATURE_COLUMNS]

    # Scale features (must match training)
    X_scaled = scaler.transform(X)

    # Predict probability
    prob = clf.predict_proba(X_scaled)[0][1]

    # Compute SHAP values
    shap_values = explainer.shap_values(X_scaled)

    shap_vals = shap_values[0]
    shap_dict = dict(zip(FEATURE_COLUMNS, shap_vals))

    # Sort by absolute contribution
    sorted_features = sorted(
        shap_dict.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    # Top contributors
    top_features = [
        {
            "feature": name,
            "contribution": float(value)
        }
        for name, value in sorted_features[:5]
    ]

    return {
        "vitals_probability": float(prob),
        "top_contributors": top_features,
        "shap_values": shap_dict
    }

vitals_input = {
    "Temperature_C": 38.2,
    "Temperature_trend": 0.7,
    "SpO2_percent": 92,
    "SpO2_trend": -2.5,
    "HeartRate_bpm": 130,
    "HeartRate_trend": 10,
    "RespRate_bpm": 38,
    "RespRate_trend": 8,
    "Cough": 1,
    "Retractions": 1
}

shap_result = explain_vitals(vitals_input)

print(shap_result)