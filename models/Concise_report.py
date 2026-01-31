import os
from groq import Groq

# ----------------------------
# CONFIG
# ----------------------------

GROQ_MODEL = "llama-3.1-8b-instant"

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)

# ----------------------------
# REPORT GENERATOR
# ----------------------------

def generate_clinical_report(
    risk_level,
    final_score,
    age_group,
    image_probability,
    shap_contributors,
    age_adjusted_flags,
    next_steps_summary
):
    """
    Generates a conservative, judge-safe clinical decision support summary.
    Does NOT localize disease or provide diagnosis.
    """

    # ---- Imaging interpretation (SAFE) ----
    if image_probability >= 0.75:
        imaging_text = "Chest X-ray findings are supportive of pneumonia risk."
    elif image_probability <= 0.30:
        imaging_text = "Chest X-ray findings do not strongly support pneumonia."
    else:
        imaging_text = "Chest X-ray findings are inconclusive."

    # ---- Physiological drivers ----
    vitals_summary = ", ".join([
        f"{item['feature'].replace('_', ' ')} (impact {item['contribution']:.2f})"
        for item in shap_contributors[:3]
    ])

    # ---- Age context ----
    age_context = "; ".join(
        f"{k}: {v}" for k, v in age_adjusted_flags.items()
    )

    prompt = f"""
You are a clinical decision support assistant.

Patient age group: {age_group}
Age-adjusted observations: {age_context}

Assessment:
- Triage category: {risk_level} (risk score {final_score:.2f})
- Imaging assessment: {imaging_text}
- Key physiological contributors: {vitals_summary}

Recommended clinical actions:
{next_steps_summary}

TASK:
Write a concise clinical summary including:
1. Clinical Impression
2. Key Rationale
3. Immediate Clinical Focus

CONSTRAINTS:
- Under 120 words
- Use professional pediatric clinical language
- Do NOT mention AI, algorithms, or models
- Do NOT describe anatomical locations or imaging regions
- Do NOT introduce new medical actions
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You generate conservative, clinician-facing summaries only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.25,
        max_tokens=200
    )

    return response.choices[0].message.content.strip()

report = generate_clinical_report(
    risk_level="CRITICAL",
    final_score=0.92,
    age_group="Preschool",
    image_probability=0.97,
    shap_contributors=[
        {"feature": "RespRate_trend", "contribution": 1.96},
        {"feature": "SpO2_trend", "contribution": 1.57},
        {"feature": "Temperature_trend", "contribution": 1.95}
    ],
    age_adjusted_flags={
        "HeartRate": "Normal for age",
        "RespRate": "High for age"
    },
    next_steps_summary="""
- Initiate high-flow oxygen therapy
- Immediate senior clinician or ICU review
- Continuous oxygen saturation monitoring
- Assess work of breathing and chest retractions
- Initiate antipyretic management as per protocol
"""
)

print(report)
