import React from 'react';
import Link from 'next/link';
import { ArrowRight, Users, CheckCircle } from 'lucide-react';

export function OurEngineers() {
  return (
    <section className="py-24 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-kn-accent/10 blur-3xl -z-10 rounded-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">OUR ENGINEERS</h2>
            <h3 className="text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl mb-6">
              Our engineers aren&apos;t recruited. They&apos;re trained by us.
            </h3>
            <p className="text-lg text-kn-body leading-relaxed mb-6">
              Most consultancies pull from the same hiring pools and hope for the best. We took a different approach: we built a training academy and grew our own engineering bench from the ground up.
            </p>
            <p className="text-lg text-kn-body leading-relaxed mb-8">
              Every engineer on a Kybern Nexus engagement has been trained on the same production-grade systems, the same documentation standards, and the same methodology you&apos;ll see in action from day one. No ramp-up time. No inconsistency.
            </p>
            
            {/* <Link href="/about" className="inline-flex items-center gap-2 text-kn-accent font-semibold hover:gap-3 transition-all">
              Meet the Team <ArrowRight className="w-5 h-5" />
            </Link> */}
          </div>
          
          <div className="bg-kn-card border border-kn-border rounded-2xl p-8 shadow-xl relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-kn-accent-bg rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-kn-accent w-6 h-6" />
                </div>
                <p className="text-4xl font-black text-kn-heading">50+</p>
                <p className="text-sm font-medium text-kn-muted">Engineers Trained</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-kn-accent-bg rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="text-kn-accent w-6 h-6" />
                </div>
                <p className="text-4xl font-black text-kn-heading">Active</p>
                <p className="text-sm font-medium text-kn-muted">Bench On Staff</p>
              </div>
              <div className="sm:col-span-2 space-y-2 mt-4 pt-4 border-t border-kn-border">
                <p className="text-xl font-black text-kn-heading">Always</p>
                <p className="text-sm font-medium text-kn-muted">Engineers in Training</p>
              </div>
            </div>
            
            <div className="mt-8 bg-kn-bg p-4 rounded-lg border border-kn-border">
              <p className="text-sm text-kn-body italic">
                <span className="font-bold">Why this matters:</span> Unlike firms that vet engineers from outside, every Kybern Nexus engineer was shaped by the same standards that built our client systems. Consistency is a feature, not a coincidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
