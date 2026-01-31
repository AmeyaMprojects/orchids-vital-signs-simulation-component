import VitalSignsSimulator from "@/components/VitalSignsSimulator";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          Clinical Educator
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-2xl">
          Empowering doctors with visual tools to explain vital sign patterns to patients.
        </p>
      </header>

      <main className="max-w-6xl mx-auto pb-24 px-6">
        <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-zinc-200/50">
          <VitalSignsSimulator />
        </div>
        
        <section className="mt-20 grid md:grid-cols-3 gap-12 max-w-4xl mx-auto text-zinc-600">
          <div>
            <h3 className="font-bold text-zinc-900 mb-2">Visual Learning</h3>
            <p className="text-sm leading-relaxed">
              Help patients visualize how complex physiological data points connect to their health status.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 mb-2">Tablet Friendly</h3>
            <p className="text-sm leading-relaxed">
              Designed for touch interfaces, making it perfect for bedside consultations.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 mb-2">Clinical Scenarios</h3>
            <p className="text-sm leading-relaxed">
              Quickly switch between common clinical profiles like healthy state and pneumonia.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
