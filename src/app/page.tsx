"use client";

import VitalSignsSimulator from "@/components/VitalSignsSimulator";
import XrayAnalyzer from "@/components/XrayAnalyzer";
import GatedLogic from "@/components/GatedLogic";
import ClinicalReport from "@/components/ClinicalReport";
import { XrayProvider } from "@/contexts/XrayContext";
import { VitalsProvider } from "@/contexts/VitalsContext";
import * as Tabs from "@radix-ui/react-tabs";
import { Scan, Activity, FileText } from "lucide-react";

export default function Home() {
  return (
    <XrayProvider>
      <VitalsProvider>
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
        <header className="max-w-6xl mx-auto py-12 px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Clinical Educator
          </h1>
          <p className="mt-4 text-xl text-zinc-600 max-w-2xl">
            Empowering doctors with visual tools to explain vital sign patterns to patients.
          </p>
        </header>

        <main className="max-w-6xl mx-auto pb-24 px-6">
        <Tabs.Root defaultValue="vitals" className="w-full">
          <Tabs.List className="flex gap-3 mb-8 bg-white p-2 rounded-2xl shadow-md border border-zinc-100">
            <Tabs.Trigger
              value="x-ray"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-zinc-600 transition-all hover:bg-zinc-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Scan className="w-5 h-5" />
              X-Ray
            </Tabs.Trigger>
            <Tabs.Trigger
              value="vitals"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-zinc-600 transition-all hover:bg-zinc-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Activity className="w-5 h-5" />
              Vitals
            </Tabs.Trigger>
            <Tabs.Trigger
              value="gated"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-zinc-600 transition-all hover:bg-zinc-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Gated Logic
            </Tabs.Trigger>
            <Tabs.Trigger
              value="report"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-zinc-600 transition-all hover:bg-zinc-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Report
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="x-ray" className="outline-none">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-zinc-200/50">
              <XrayAnalyzer />
            </div>
          </Tabs.Content>

          <Tabs.Content value="vitals" className="outline-none">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-zinc-200/50">
              <VitalSignsSimulator />
            </div>
          </Tabs.Content>

          <Tabs.Content value="gated" className="outline-none">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-zinc-200/50">
              <GatedLogic />
            </div>
          </Tabs.Content>

          <Tabs.Content value="report" className="outline-none">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-zinc-200/50">
              <ClinicalReport />
            </div>
          </Tabs.Content>
        </Tabs.Root>
        
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
      </VitalsProvider>
    </XrayProvider>
  );
}
