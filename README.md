# Clinical Vital Signs Simulation Component

An interactive Clinical Vital Signs Simulation Component built for doctors to educate patients. This tool allows healthcare professionals to visualize how different vital sign combinations relate to various health conditions, making complex medical concepts accessible and understandable for patients.

![Medical Disclaimer](https://img.shields.io/badge/⚠️-Medical%20Disclaimer-red)
**MEDICAL DISCLAIMER:** This is an educational tool only. It should not be used for actual medical diagnosis or treatment. Always consult with qualified healthcare professionals for medical advice.

#Demo



https://github.com/user-attachments/assets/d4dffc81-98c8-40c0-87de-e539da8f5ca0


## ✨ Features

- **Interactive Vital Signs Simulator**: Real-time visualization of how Temperature, SpO2, Heart Rate, Respiratory Rate, Cough, and Chest Retractions correlate with health conditions
- **X-Ray Analyzer**: Upload and analyze chest X-rays with AI-powered insights
- **Gated Logic Visualization**: Step-by-step clinical decision-making process
- **Clinical Report Generation**: Comprehensive reports based on vital signs and imaging
- **Waterfall Chart**: Visual representation of diagnostic priorities and evidence triangulation
- **Tablet-Friendly UI**: Clean, modern interface optimized for bedside consultations
- **Deterministic Logic**: Hard-coded clinical ranges for safety and predictability

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI (Slider, Tabs, Dialog, etc.)
- **Icons**: Lucide React, Heroicons, Tabler Icons
- **Animation**: Framer Motion
- **3D Visualization**: React Three Fiber & Drei

### Backend
- **Python**: Flask API for ML model inference
- **ML**: TensorFlow/Keras for pneumonia detection model
- **File Handling**: Python for X-ray image processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or later ([Download](https://nodejs.org/))
- **npm** or **yarn** or **pnpm**
- **Python** 3.8+ (for backend ML models)
- **pip** (Python package manager)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd orchids-vital-signs-simulation-component
```

### 2. Install Frontend Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Setup

Create a `.env.local` file in the root directory (if needed for API keys or configuration):

```env
# Add any environment variables here
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5. Run the Development Server

**Frontend:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Backend (Python API):**

```bash
python api/app.py
```

The Flask API will typically run on `http://localhost:5000`.

## 📁 Project Structure

```
├── api/
│   └── app.py                    # Flask API server
├── models/
│   ├── pneumonia_binary_model.h5 # Pre-trained ML model
│   ├── vitals_api.py             # Vital signs analysis logic
│   ├── xray_api.py               # X-ray analysis logic
│   └── ...                       # Other model utilities
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── api/                  # Next.js API routes
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/
│   │   ├── VitalSignsSimulator.tsx  # Main simulation component
│   │   ├── XrayAnalyzer.tsx         # X-ray upload & analysis
│   │   ├── GatedLogic.tsx           # Clinical decision flow
│   │   ├── ClinicalReport.tsx       # Report generation
│   │   ├── WaterfallChart.tsx       # Diagnostic visualization
│   │   └── ui/                      # Reusable UI components
│   ├── contexts/
│   │   ├── VitalsContext.tsx     # Vital signs state management
│   │   └── XrayContext.tsx       # X-ray state management
│   ├── hooks/                    # Custom React hooks
│   └── lib/
│       └── utils.ts              # Utility functions
├── uploads/                      # X-ray image uploads
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🎯 Usage

### Vital Signs Simulator

1. Navigate to the **Vital Signs** tab
2. Adjust the sliders for different vital signs:
   - Temperature (°F)
   - SpO2 (%)
   - Heart Rate (bpm)
   - Respiratory Rate (breaths/min)
   - Cough Severity
   - Chest Retractions
3. Observe real-time condition assessment (Normal vs. Pneumonia)
4. Use visual cues and animations to explain to patients

### X-Ray Analyzer

1. Navigate to the **X-Ray** tab
2. Upload a chest X-ray image
3. View AI-powered analysis results
4. Review confidence scores and clinical insights

### Clinical Report

1. Navigate to the **Report** tab
2. View comprehensive analysis combining:
   - Vital signs assessment
   - X-ray findings
   - Evidence triangulation
   - Diagnostic priorities
3. Generate detailed reports for patient records

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Component Development

All main components are located in `src/components/`:

- Create new components following the existing patterns
- Use TypeScript for type safety
- Leverage Radix UI primitives for accessibility
- Style with Tailwind CSS utility classes

### Adding New Features

1. Define component logic in `src/components/`
2. Manage state with Context API (`src/contexts/`)
3. Add API routes in `src/app/api/` if needed
4. Update Python models in `models/` for ML features

## 🎨 Customization

### Styling

- **Global Styles**: Edit `src/app/globals.css`
- **Tailwind Config**: Modify `tailwind.config.ts`
- **Component Styles**: Use Tailwind utility classes

### Clinical Ranges

Hard-coded ranges are defined in the simulation component for safety. Modify with caution:

```typescript
// src/components/VitalSignsSimulator.tsx
const NORMAL_RANGES = {
  temperature: { min: 97.0, max: 99.5 },
  spO2: { min: 95, max: 100 },
  // ...
};
```

## 🔒 Medical Disclaimer

**IMPORTANT**: This application is designed strictly for educational purposes to help healthcare professionals explain medical concepts to patients. It is NOT intended for:

- Medical diagnosis
- Treatment decisions
- Clinical assessment
- Replacing professional medical judgment

Always consult qualified healthcare professionals for medical advice, diagnosis, and treatment.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍⚕️ Built For

Healthcare professionals who want to:
- Improve patient education
- Visualize complex medical concepts
- Enhance doctor-patient communication
- Demonstrate clinical decision-making processes

## 📞 Support

For questions or issues, please open an issue in the repository or contact the development team.

---

**Made with ❤️ for better patient education**
