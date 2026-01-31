## Project Summary
An interactive Clinical Vital Signs Simulation Component built for doctors to educate patients. It allows visualization of how different vital sign combinations (Temperature, SpO2, Heart Rate, Respiratory Rate, Cough, and Chest Retractions) relate to conditions like Normal health vs. Pneumonia.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Components: Radix UI (Slider, Tabs), Lucide React (Icons)
- Animation: Framer Motion

## Architecture
- `src/components/VitalSignsSimulator.tsx`: Main interactive component containing simulation logic and UI.
- `src/app/page.tsx`: Landing page demonstrating the component.

## User Preferences
- Clean, modern, tablet-friendly UI.
- Deterministic, rule-based simulation logic.
- Visual cues and animations for patient engagement.

## Project Guidelines
- No backend required (Client-side only).
- Hard-coded clinical ranges for safety and predictability.
- Mandatory medical disclaimer.
