import joblib
import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# ----------------------------
# LOAD TRAINED VITALS MODEL
# ----------------------------

MODEL_PATH = r"C:\Users\Arun\Downloads\Lovelace\vitals_model.pkl"

vitals_model = joblib.load(MODEL_PATH)

# Extract pipeline components
scaler = vitals_model.named_steps["scaler"]
clf = vitals_model.named_steps["clf"]   # <-- THIS was missing

# ----------------------------
# FEATURE CONFIG
# ----------------------------

FEATURE_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

# Background for SHAP (already scaled space)
background = np.zeros((1, len(FEATURE_COLUMNS)))
masker = shap.maskers.Independent(background)

# SHAP explainer (Logistic Regression)
explainer = shap.LinearExplainer(
    clf,
    masker=masker,
    feature_names=FEATURE_COLUMNS
)

# ----------------------------
# SHAP EXPLANATION FUNCTIONS
# ----------------------------

def get_shap_explanation(vitals_dict):
    """
    Returns SHAP Explanation object for a single patient
    """
    X = pd.DataFrame([vitals_dict])[FEATURE_COLUMNS]
    X_scaled = scaler.transform(X)

    shap_exp = explainer(X_scaled)
    return shap_exp

def plot_shap_waterfall(shap_exp):
    """
    Displays SHAP waterfall plot
    """
    plt.figure(figsize=(8, 5))
    shap.plots.waterfall(
        shap_exp[0],
        max_display=8,
        show=False
    )
    plt.tight_layout()
    plt.show()

# ----------------------------
# DEMO INPUT (HIGH-RISK CASE)
# ----------------------------

vitals_input = {
    "Temperature_C": 38.6,
    "Temperature_trend": 0.9,
    "SpO2_percent": 91,
    "SpO2_trend": -3.0,
    "HeartRate_bpm": 132,
    "HeartRate_trend": 11,
    "RespRate_bpm": 40,
    "RespRate_trend": 9,
    "Cough": 1,
    "Retractions": 1
}

# ----------------------------
# RUN
# ----------------------------

shap_exp = get_shap_explanation(vitals_input)
plot_shap_waterfall(shap_exp)
