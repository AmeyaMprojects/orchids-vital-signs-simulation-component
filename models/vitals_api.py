import sys
import json
import warnings
warnings.filterwarnings('ignore')
import joblib
import shap
import pandas as pd
import numpy as np

# ----------------------------
# CONFIG
# ----------------------------

FEATURE_EXPLANATIONS = {
    "HeartRate_trend": {
        "risk_up": "Increasing heart rate over time suggests physiological stress",
        "risk_down": "Stable or decreasing heart rate reduces pneumonia concern"
    },
    "RespRate_trend": {
        "risk_up": "Increasing respiratory rate indicates worsening breathing effort",
        "risk_down": "Stable respiratory rate reduces respiratory distress concern"
    },
    "Temperature_trend": {
        "risk_up": "Rising body temperature suggests worsening infection",
        "risk_down": "Stable or falling temperature reduces infection concern"
    },
    "SpO2_trend": {
        "risk_up": "Declining oxygen saturation over time indicates hypoxemia",
        "risk_down": "Improving oxygen saturation reduces hypoxia concern"
    },
    "HeartRate_bpm": {
        "risk_up": "Elevated heart rate contributes to pneumonia risk",
        "risk_down": "Heart rate within normal range reduces risk"
    },
    "RespRate_bpm": {
        "risk_up": "Elevated respiratory rate increases pneumonia risk",
        "risk_down": "Respiratory rate within normal range reduces risk"
    },
    "Temperature_C": {
        "risk_up": "Fever contributes to pneumonia suspicion",
        "risk_down": "Normal body temperature reduces infection concern"
    },
    "SpO2_percent": {
        "risk_up": "Low oxygen saturation increases pneumonia risk",
        "risk_down": "Normal oxygen saturation reduces hypoxia concern"
    },
    "Cough": {
        "risk_up": "Presence of cough supports respiratory infection",
        "risk_down": "Absence of cough reduces respiratory infection concern"
    },
    "Retractions": {
        "risk_up": "Chest retractions indicate increased work of breathing",
        "risk_down": "No chest retractions reduce respiratory distress concern"
    }
}

FEATURE_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

PEDIATRIC_NORMALS = {
    "infant": {
        "HeartRate_bpm": (100, 160),
        "RespRate_bpm": (30, 60)
    },
    "toddler": {
        "HeartRate_bpm": (90, 150),
        "RespRate_bpm": (24, 40)
    },
    "preschool": {
        "HeartRate_bpm": (80, 120),
        "RespRate_bpm": (22, 34)
    },
    "child": {
        "HeartRate_bpm": (70, 110),
        "RespRate_bpm": (18, 30)
    }
}

# ----------------------------
# LOAD MODEL (once)
# ----------------------------

import os
model_path = os.path.join(os.path.dirname(__file__), "vitals_model.pkl")
vitals_model = joblib.load(model_path)

scaler = vitals_model.named_steps["scaler"]
clf = vitals_model.named_steps["clf"]

# SHAP explainer
background = np.zeros((1, len(FEATURE_COLUMNS)))
masker = shap.maskers.Independent(background)
explainer = shap.LinearExplainer(
    clf,
    masker=masker,
    feature_names=FEATURE_COLUMNS
)

# ----------------------------
# HELPER FUNCTIONS
# ----------------------------

def age_adjusted_interpretation(vitals_dict, age_group):
    """Returns age-adjusted interpretation of vitals"""
    normals = PEDIATRIC_NORMALS[age_group]
    interpretation = {}

    hr_low, hr_high = normals["HeartRate_bpm"]
    rr_low, rr_high = normals["RespRate_bpm"]

    interpretation["HeartRate"] = (
        "High for age" if vitals_dict["HeartRate_bpm"] > hr_high else
        "Low for age" if vitals_dict["HeartRate_bpm"] < hr_low else
        "Normal for age"
    )

    interpretation["RespRate"] = (
        "High for age" if vitals_dict["RespRate_bpm"] > rr_high else
        "Low for age" if vitals_dict["RespRate_bpm"] < rr_low else
        "Normal for age"
    )

    return interpretation

def interpret_shap_contributors(top_contributors):
    """Converts SHAP top contributors into human-readable explanations"""
    explanations = []

    for item in top_contributors:
        feature = item["feature"]
        contribution = item["contribution"]

        if feature not in FEATURE_EXPLANATIONS:
            continue

        if contribution > 0:
            explanations.append(FEATURE_EXPLANATIONS[feature]["risk_up"])
        else:
            explanations.append(FEATURE_EXPLANATIONS[feature]["risk_down"])

    return explanations

def explain_vitals(vitals_dict, age_group):
    """
    Main function to analyze vitals and return risk assessment
    """
    # Convert input to DataFrame
    X = pd.DataFrame([vitals_dict])[FEATURE_COLUMNS]

    # Scale features
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
    
    human_explanations = interpret_shap_contributors(top_features)
    age_flags = age_adjusted_interpretation(vitals_dict, age_group)

    return {
        "vitals_probability": float(prob),
        "top_contributors": top_features,
        "risk_factors_text": human_explanations,
        "age_adjusted_flags": age_flags,
        "shap_values": shap_dict
    }

# ----------------------------
# MAIN (API ENTRY POINT)
# ----------------------------

if __name__ == "__main__":
    try:
        # Read JSON input from file (to avoid Windows command-line escaping issues)
        if len(sys.argv) > 1:
            input_path = sys.argv[1]
            
            # If it's a file path, read from file
            if input_path.endswith('.json'):
                with open(input_path, 'r') as f:
                    input_data = json.load(f)
            else:
                # Otherwise, treat as JSON string (for backward compatibility)
                input_data = json.loads(input_path)
        else:
            raise ValueError("No input provided")
        
        vitals_dict = input_data["vitals"]
        age_group = input_data["age_group"]
        
        # Analyze vitals
        result = explain_vitals(vitals_dict, age_group)
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        error_result = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "vitals_probability": 0,
            "top_contributors": [],
            "risk_factors_text": [],
            "age_adjusted_flags": {}
        }
        print(json.dumps(error_result))
        sys.exit(1)
