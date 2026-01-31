def evidence_triangulation(P_img, vitals_probability, top_risk_factors):
    """
    Determines cross-modal consistency.
    """

    imaging_support = P_img >= 0.75
    vitals_support = vitals_probability >= 0.75

    phys_distress = any(
        keyword in " ".join(top_risk_factors).lower()
        for keyword in ["oxygen", "spo2", "respiratory", "breathing"]
    )

    if imaging_support and vitals_support and phys_distress:
        return "High-confidence detection: Imaging findings align with physiological distress indicators."
    elif imaging_support and vitals_support:
        return "Moderate-confidence detection: Imaging and physiological signals are concordant."
    elif imaging_support or vitals_support:
        return "Low-confidence detection: Partial agreement between evidence sources."
    else:
        return "No strong concordance between imaging and physiological indicators."
