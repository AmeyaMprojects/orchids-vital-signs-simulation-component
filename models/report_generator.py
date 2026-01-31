import sys
import json
import os

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

def narrate_next_steps(triage_level, next_steps, age_group):
    """
    Converts structured protocol steps into a human-readable clinical action summary.
    """
    try:
        from groq import Groq
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            # Fallback to simple formatting if no API key
            return f"For {age_group} patient at {triage_level} level: " + " ".join(next_steps)
        
        client = Groq(api_key=api_key)
        
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
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You write clear pediatric clinical summaries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.25,
            max_tokens=120
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback formatting
        return f"For {age_group} patient at {triage_level} level: " + " ".join(next_steps)

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
    """
    try:
        from groq import Groq
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            # Fallback to structured summary if no API key
            return f"""Clinical Impression: {age_group} patient presenting with {risk_level} risk profile (score {final_score:.2f}).

Key Rationale: Assessment based on vital signs trending and physiological indicators. Age-adjusted findings show {', '.join(f"{k}: {v}" for k, v in age_adjusted_flags.items())}."""
        
        client = Groq(api_key=api_key)
        
        # Imaging interpretation
        if image_probability >= 0.75:
            imaging_text = "Chest X-ray findings are supportive of pneumonia risk."
        elif image_probability <= 0.30:
            imaging_text = "Chest X-ray findings do not strongly support pneumonia."
        else:
            imaging_text = "Chest X-ray findings are inconclusive."

        # Physiological drivers
        vitals_summary = ", ".join([
            f"{item['feature'].replace('_', ' ')} (impact {item['contribution']:.2f})"
            for item in shap_contributors[:3]
        ])

        # Age context
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

CONSTRAINTS:
- Under 120 words
- Use professional pediatric clinical language
- Do NOT mention AI, algorithms, or models
- Do NOT describe anatomical locations or imaging regions
- Do NOT introduce new medical actions
- Do NOT include recommended actions or next steps in the summary
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
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
    except Exception as e:
        # Fallback to structured summary
        return f"""Clinical Impression: {age_group} patient presenting with {risk_level} risk profile (score {final_score:.2f}).

Key Rationale: Assessment based on vital signs trending and physiological indicators. Age-adjusted findings show {', '.join(f"{k}: {v}" for k, v in age_adjusted_flags.items())}."""

if __name__ == "__main__":
    try:
        # Read JSON input from file
        if len(sys.argv) > 1:
            input_path = sys.argv[1]
            
            if input_path.endswith('.json'):
                with open(input_path, 'r') as f:
                    input_data = json.load(f)
            else:
                input_data = json.loads(input_path)
        else:
            raise ValueError("No input provided")
        
        vitals_probability = input_data["vitals_probability"]
        age_group = input_data["age_group"]
        image_probability = input_data.get("image_probability", 0)
        shap_contributors = input_data["shap_contributors"]
        age_adjusted_flags = input_data["age_adjusted_flags"]
        risk_factors_text = input_data["risk_factors_text"]
        
        # Determine triage level based on probability
        if vitals_probability >= 0.75:
            triage_level = "CRITICAL"
        elif vitals_probability >= 0.50:
            triage_level = "HIGH RISK"
        elif vitals_probability >= 0.30:
            triage_level = "MODERATE RISK"
        else:
            triage_level = "LOW RISK"
        
        # Refine protocol
        next_steps = refine_protocol(triage_level, risk_factors_text)
        
        # Generate narrative
        next_steps_summary = narrate_next_steps(triage_level, next_steps, age_group)
        
        # Generate clinical report
        clinical_report = generate_clinical_report(
            risk_level=triage_level,
            final_score=vitals_probability,
            age_group=age_group,
            image_probability=image_probability,
            shap_contributors=shap_contributors,
            age_adjusted_flags=age_adjusted_flags,
            next_steps_summary=next_steps_summary
        )
        
        result = {
            "triage_level": triage_level,
            "next_steps": next_steps,
            "next_steps_summary": next_steps_summary,
            "clinical_report": clinical_report
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        error_result = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)
