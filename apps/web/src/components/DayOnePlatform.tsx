import React from 'react';
import { Activity, BarChart3, Database, ShieldCheck } from 'lucide-react';

export function DayOnePlatform() {
  return (
    <section className="py-24 bg-kn-card border-t border-kn-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm">PROPRIETARY TOOLING</h2>
            <span className="bg-kn-accent/10 text-kn-accent text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-kn-accent/20 tracking-wider">IN DEVELOPMENT</span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl mb-6">
            Infrastructure visibility, included. Not an upsell.
          </h3>
          <p className="text-lg text-kn-body leading-relaxed">
            We are actively building our proprietary Cloud Management Platform — purpose-built for consulting engagements. Once released, every Kybern Nexus engagement will include access to this tool, designed to give your team real-time visibility into your infrastructure from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FinOps Dashboard */}
          <div className="bg-kn-bg border border-kn-border rounded-xl p-8 shadow-lg hover:border-kn-accent/50 transition-all">
            <div className="w-12 h-12 bg-kn-accent-bg rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="text-kn-accent w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-kn-heading mb-4">FinOps Dashboard</h4>
            <p className="text-kn-muted mb-6 leading-relaxed">
              See exactly where your cloud spend is going — by service, by environment, by team. Track cost trends over time and catch overspend before it hits your bill.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Database className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Real-time spend breakdown across AWS, GCP, and Azure</span>
              </li>
              <li className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Budget alerts and anomaly detection</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Rightsizing recommendations surfaced automatically</span>
              </li>
            </ul>
          </div>

          {/* Deployment Dashboard */}
          <div className="bg-kn-bg border border-kn-border rounded-xl p-8 shadow-lg hover:border-kn-accent/50 transition-all">
            <div className="w-12 h-12 bg-kn-accent-bg rounded-lg flex items-center justify-center mb-6">
              <Activity className="text-kn-accent w-6 h-6" />
            </div>
            <h4 className="text-2xl font-bold text-kn-heading mb-4">Deployment Dashboard</h4>
            <p className="text-kn-muted mb-6 leading-relaxed">
              Track every deployment, rollback, and pipeline run in one place. Know the state of your systems without digging through logs.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Live pipeline status and deployment history</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Rollback triggers and incident flags</span>
              </li>
              <li className="flex items-start gap-3">
                <Database className="w-5 h-5 text-kn-accent mt-0.5 shrink-0" />
                <span className="text-sm text-kn-body">Service health at a glance — for you and your team</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-kn-muted italic">
            * Our Cloud Management Platform (CMP) is currently in active development. Features shown represent the target release scope.
          </p>
        </div>
      </div>
    </section>
  );
}
