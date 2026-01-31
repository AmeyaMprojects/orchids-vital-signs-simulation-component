import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from tensorflow.keras.preprocessing import image

def triage_level(score):
    if score < 0.35:
        return "LOW RISK", "🟢 Monitor at home"
    elif score < 0.60:
        return "MODERATE RISK", "🟡 Further testing"
    elif score < 0.80:
        return "HIGH RISK", "🟠 Admit for observation"
    else:
        return "CRITICAL", "🔴 Immediate intervention"

# Load trained models
img_model = tf.keras.models.load_model(r"C:\Users\Arun\Downloads\Lovelace\pneumonia_binary_model.h5")
vitals_model = joblib.load(r"C:\Users\Arun\Downloads\Lovelace\vitals_model.pkl")

IMG_SIZE = 224

def get_image_probability(img_path):
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    P_img = float(img_model.predict(img_array)[0][0])
    return P_img

VITAL_COLUMNS = [
    "Temperature_C", "Temperature_trend",
    "SpO2_percent", "SpO2_trend",
    "HeartRate_bpm", "HeartRate_trend",
    "RespRate_bpm", "RespRate_trend",
    "Cough", "Retractions"
]

def get_vitals_probability(vitals_dict):
    """
    vitals_dict: dictionary with all required vitals
    """
    df = pd.DataFrame([vitals_dict])
    df = df[VITAL_COLUMNS]  # enforce order

    P_vitals = vitals_model.predict_proba(df)[0][1]
    return float(P_vitals)

def image_confidence(P_img):
    return abs(P_img - 0.5) * 2

def gated_fusion(P_img, P_vitals):
    img_conf = image_confidence(P_img)

    w_img, w_vitals = 0.6, 0.4

    if img_conf < 0.4:
        w_img, w_vitals = 0.4, 0.6

    total = w_img + w_vitals
    w_img /= total
    w_vitals /= total

    final_score = (w_img * P_img) + (w_vitals * P_vitals)

    # 🔴 NEW: clinical safety cap
    if P_vitals < 0.65 and final_score > 0.8:
        final_score = 0.78   # cap to HIGH, not CRITICAL

    return final_score, w_img, w_vitals, img_conf

def safe_score(score, cap=0.97):
    return min(score, cap)

# --- INPUTS ---
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

# --- MODEL OUTPUTS ---
P_img = get_image_probability(img_path)
P_vitals = get_vitals_probability(vitals_input)

# --- GATED FUSION ---
final_score, w_img, w_vitals, img_conf = gated_fusion(P_img, P_vitals)

final_score = safe_score(final_score)
risk, recommendation = triage_level(final_score)

# --- OUTPUT ---
print(f"Image Probability      : {P_img:.2f}")
print(f"Vitals Probability     : {P_vitals:.2f}")
print(f"Image Confidence       : {img_conf:.2f}")
print(f"Fusion Weights         : Image={w_img:.2f}, Vitals={w_vitals:.2f}")
print(f"Final Risk Score       : {final_score:.2f}")
print(f"Triage Level           : {risk}")
print(f"Recommendation         : {recommendation}")