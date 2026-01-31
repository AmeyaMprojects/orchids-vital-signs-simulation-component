import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from tensorflow.keras.preprocessing import image

# =========================================================
# CONFIG
# =========================================================
IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.4

# =========================================================
# TRIAGE LOGIC
# =========================================================
def triage_level(score):
    if score < 0.35:
        return "LOW RISK", "🟢 Monitor at home"
    elif score < 0.60:
        return "MODERATE RISK", "🟡 Further testing"
    elif score < 0.80:
        return "HIGH RISK", "🟠 Admit for observation"
    else:
        return "CRITICAL RISK", "🔴 Immediate intervention"

# =========================================================
# LOAD MODELS
# =========================================================
img_model = tf.keras.models.load_model(
    r"C:\Users\Arun\Downloads\Lovelace\pneumonia_binary_model.h5"
)
vitals_model = joblib.load(
    r"C:\Users\Arun\Downloads\Lovelace\vitals_model.pkl"
)

# =========================================================
# IMAGE PIPELINE
# =========================================================
def get_image_probability(img_path):
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    arr = image.img_to_array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return float(img_model.predict(arr)[0][0])

def image_confidence(p_img):
    return abs(p_img - 0.5) * 2

# =========================================================
# VITALS PIPELINE
# =========================================================
VITAL_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

def get_vitals_probability(vitals_dict):
    df = pd.DataFrame([vitals_dict])[VITAL_COLUMNS]
    return float(vitals_model.predict_proba(df)[0][1])

def age_adjusted_abnormalities(vitals_dict):
    abnormal = (
        vitals_dict["SpO2_percent"] < 95 or
        vitals_dict["RespRate_bpm"] > 28 or
        vitals_dict["HeartRate_bpm"] > 100 or
        vitals_dict["Temperature_C"] > 38
    )
    return "Present" if abnormal else "Absent"

# =========================================================
# GATED FUSION LOGIC (CORE)
# =========================================================
def gated_fusion(P_img, P_vitals):
    img_conf = image_confidence(P_img)

    # Default weighting
    w_img, w_vitals = 0.6, 0.4
    gate_message = "High confidence imaging evidence"

    # Confidence-based fail-safe
    if img_conf < CONFIDENCE_THRESHOLD:
        w_img, w_vitals = 0.4, 0.6
        gate_message = "Imaging confidence reduced → vitals weighted higher"

    final_score = (w_img * P_img) + (w_vitals * P_vitals)

    # Clinical safety cap
    if P_vitals < 0.65 and final_score > 0.8:
        final_score = 0.78

    return final_score, w_img, w_vitals, img_conf, gate_message

# =========================================================
# INPUTS
# =========================================================
img_path = r"C:\Users\Arun\Downloads\Lovelace\archive\chest_xray\test\PNEUMONIA\person1_virus_7.jpeg"

vitals_input = {
    "Temperature_C": 37.8,
    "Temperature_trend": 0.2,
    "SpO2_percent": 94,
    "SpO2_trend": -0.5,
    "HeartRate_bpm": 108,
    "HeartRate_trend": 3,
    "RespRate_bpm": 30,
    "RespRate_trend": 2,
    "Cough": 1,
    "Retractions": 0
}

# =========================================================
# RUN PIPELINE
# =========================================================
P_img = get_image_probability(img_path)
P_vitals = get_vitals_probability(vitals_input)
img_conf = image_confidence(P_img)
abnormalities = age_adjusted_abnormalities(vitals_input)

final_score, w_img, w_vitals, img_conf, gate_msg = gated_fusion(P_img, P_vitals)
risk, recommendation = triage_level(final_score)

# =========================================================
# ----------- GATED LOGIC TAB OUTPUT ----------------------
# =========================================================

print("\nINPUTS TO GATE")
print("────────────────────")
print(f"Imaging Probability        : {P_img:.2f}")
print(f"Imaging Confidence         : {img_conf:.2f} ({'High' if img_conf >= CONFIDENCE_THRESHOLD else 'Low'})\n")
print(f"Vitals Probability         : {P_vitals:.2f}")
print(f"Age-adjusted abnormalities : {abnormalities}")

print("\nFUSION WEIGHTS")
print("────────────────────")
print(f"Imaging Evidence : {int(w_img*100)}%")
print(f"Vitals Evidence  : {int(w_vitals*100)}%")

print("\nFINAL RISK SCORE")
print("────────────────────")
print(f"({w_img:.2f} × Imaging Risk) + ({w_vitals:.2f} × Vitals Risk)")
print(f"= {final_score:.2f}")

print("\nFINAL TRIAGE DECISION")
print("────────────────────")
print(f"{risk}")
print(f"Recommendation:")
print(f"{recommendation}")

print("\nDecision Rationale:")
if img_conf >= CONFIDENCE_THRESHOLD:
    print(
        "High confidence imaging evidence combined with worsening physiological trends "
        "resulted in a critical risk classification."
    )
else:
    print(
        "Due to ambiguous imaging evidence, the system relied more heavily on "
        "physiological deterioration to ensure patient safety."
    )