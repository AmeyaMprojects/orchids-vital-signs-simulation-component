from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import shap
import pandas as pd
import numpy as np
import traceback

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3001"]}})

# ============================
# CONFIGURATION
# ============================

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

PEDIATRIC_NORMALS = {
    "infant": {"HeartRate_bpm": (100, 160), "RespRate_bpm": (30, 60)},      # 0-1 year
    "toddler": {"HeartRate_bpm": (90, 150), "RespRate_bpm": (24, 40)},      # 1-3 years
    "preschool": {"HeartRate_bpm": (80, 120), "RespRate_bpm": (22, 34)},    # 4-6 years
    "child": {"HeartRate_bpm": (70, 110), "RespRate_bpm": (18, 30)}         # 7-12 years
}

FEATURE_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

# ============================
# MODEL LOADING
# ============================

MODEL_PATH = r"D:\Pulmo\orchids-vital-signs-simulation-component\models\vitals_model.pkl"

try:
    vitals_model = joblib.load(MODEL_PATH)
    scaler = vitals_model.named_steps["scaler"]
    clf = vitals_model.named_steps["clf"]

     # sklearn compatibility patch
    if not hasattr(clf, "multi_class"):
        clf.multi_class = "auto"
    
    # SHAP explainer setup
    background = np.zeros((1, len(FEATURE_COLUMNS)))
    explainer = shap.LinearExplainer(
        clf,
        background,
        feature_names=FEATURE_COLUMNS
    )
    
    print("✅ Model loaded successfully!")
    MODEL_LOADED = True
except Exception as e:
    print(f"❌ Error loading model: {e}")
    traceback.print_exc()
    MODEL_LOADED = False
    scaler = None
    clf = None
    explainer = None

# ============================
# HELPER FUNCTIONS
# ============================

def age_adjusted_interpretation(vitals_dict, age_group):
    """Returns age-adjusted interpretation of vitals"""
    if age_group not in PEDIATRIC_NORMALS:
        age_group = "preschool"  # Default fallback
    
    normals = PEDIATRIC_NORMALS[age_group]
    hr_low, hr_high = normals["HeartRate_bpm"]
    rr_low, rr_high = normals["RespRate_bpm"]

    return {
        "HeartRate": "High for age" if vitals_dict.get("HeartRate_bpm", 0) > hr_high else "Normal for age",
        "RespRate": "High for age" if vitals_dict.get("RespRate_bpm", 0) > rr_high else "Normal for age"
    }

def interpret_shap_contributors(top_contributors):
    """Converts SHAP top contributors into human-readable explanations"""
    explanations = []
    for item in top_contributors:
        feature = item["feature"]
        contribution = item["contribution"]
        if feature not in FEATURE_EXPLANATIONS:
            continue
        key = "risk_up" if contribution > 0 else "risk_down"
        explanations.append(FEATURE_EXPLANATIONS[feature][key])
    return explanations[:3]  # Return top 3

# ============================
# API ENDPOINTS
# ============================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy" if MODEL_LOADED else "unhealthy",
        "model_loaded": MODEL_LOADED,
        "message": "Backend is running" if MODEL_LOADED else "Model failed to load"
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    if not MODEL_LOADED:
        return jsonify({"error": "Model not loaded. Check server logs."}), 500

    try:
        data = request.get_json()
        if not data or 'vitals' not in data or 'age_group' not in data:
            return jsonify({"error": "Missing 'vitals' or 'age_group' in request"}), 400
        
        vitals = data['vitals']
        age_group = data['age_group']
        
        # Validate vitals structure
        for col in FEATURE_COLUMNS:
            if col not in vitals:
                return jsonify({"error": f"Missing vital: {col}"}), 400
        
        # Run prediction pipeline
        X = pd.DataFrame([vitals])[FEATURE_COLUMNS]
        X_scaled = scaler.transform(X)
        prob = clf.predict_proba(X_scaled)[0][1]
        shap_vals = explainer.shap_values(X_scaled)[0]
        shap_dict = dict(zip(FEATURE_COLUMNS, shap_vals.tolist()))
        
        # Prepare top contributors
        sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_contributors = [{"feature": f, "contribution": float(v)} for f, v in sorted_features[:5]]
        
        # Generate human explanations
        risk_explanations = interpret_shap_contributors(top_contributors)
        age_flags = age_adjusted_interpretation(vitals, age_group)
        
        # Return full SHAP result
        return jsonify({
            "vitals_probability": float(prob),
            "top_contributors": top_contributors,
            "risk_factors_text": risk_explanations,
            "age_adjusted_flags": age_flags,
            "shap_values": shap_dict,
            "base_value": float(explainer.expected_value) if hasattr(explainer, 'expected_value') else 0.15
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "details": "Check server logs for full traceback"
        }), 500

@app.route('/feature-explanations', methods=['GET'])
def get_feature_explanations():
    """Return feature explanations for frontend tooltips"""
    return jsonify(FEATURE_EXPLANATIONS)

# ============================
# RUN SERVER
# ============================

if __name__ == '__main__':
    print("="*60)
    print("🚀 Pediatric Pneumonia Risk Analyzer API")
    print("="*60)
    print(f"Model path: {MODEL_PATH}")
    print(f"Features: {FEATURE_COLUMNS}")
    print("="*60)
    print("Starting Flask server on http://localhost:5000")
    print("Frontend should connect to: http://localhost:5000/predict")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)