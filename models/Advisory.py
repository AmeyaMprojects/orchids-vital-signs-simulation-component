import os
from groq import Groq
# ----------------------------
# BASE TRIAGE PROTOCOLS
# ----------------------------

BASE_PROTOCOLS = {
    "LOW RISK": [
        "Advise home monitoring and hydration",
        "Schedule follow-up within 24–48 hours"
    ],
    "MODERATE RISK": [
        "Perform additional diagnostic tests",
        "Monitor SpO₂ periodically"
    ],
    "HIGH RISK": [
        "Initiate supportive respiratory therapy",
        "Monitor SpO₂ every 15–30 minutes"
    ],
    "CRITICAL": [
        "Initiate high-flow oxygen therapy",
        "Immediate senior clinician or ICU review"
    ]
}

# ----------------------------
# PROTOCOL REFINEMENT
# ----------------------------

def refine_protocol(triage_level, risk_factors):
    """
    Refines next steps based on dominant physiological risk drivers.
    Does NOT change triage level.
    """

    steps = BASE_PROTOCOLS[triage_level].copy()
    risk_text = " ".join(risk_factors).lower()

    # Oxygen-related risk
    if "oxygen" in risk_text or "spo2" in risk_text:
        steps.append("Continuous oxygen saturation monitoring")

    # Respiratory distress
    if "respiratory rate" in risk_text or "breathing" in risk_text:
        steps.append("Assess work of breathing and chest retractions")

    # Fever / infection burden
    if "temperature" in risk_text or "fever" in risk_text:
        steps.append("Initiate antipyretic management as per protocol")

    # Cardiovascular stress
    if "heart rate" in risk_text:
        steps.append("Monitor cardiac status and hydration")

    # Remove duplicates, preserve order
    return list(dict.fromkeys(steps))

triage_level = "CRITICAL"

risk_factors = [
    "Declining oxygen saturation",
    "Increasing respiratory rate",
    "Rising body temperature"
]

next_steps = refine_protocol(triage_level, risk_factors)

GROQ_MODEL = "llama-3.1-8b-instant"

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def narrate_next_steps(triage_level, next_steps, age_group):
    """
    Converts structured protocol steps into a human-readable clinical action summary.
    Age is used ONLY for contextual phrasing, not decision-making.
    """

    prompt = f"""
You are assisting with clinical documentation for a pediatric patient.

Patient age group: {age_group}

Triage level: {triage_level}

The following actions have already been determined:
{chr(10).join("- " + step for step in next_steps)}

Rewrite these actions as a concise, human-readable clinical action summary
appropriate for the given pediatric age group.

Rules:
- Use complete sentences and natural clinical language
- Do NOT add, remove, or alter any actions
- Do NOT provide new medical advice
- Do NOT mention AI, models, or decision systems
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You write clear pediatric clinical summaries."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.25,
        max_tokens=120
    )

    return response.choices[0].message.content.strip()

age_group = "Preschool"  # Infant | Toddler | Preschool | Child

summary = narrate_next_steps(triage_level, next_steps, age_group)
print(summary)
