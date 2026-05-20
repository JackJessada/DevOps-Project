"use client";

import { signIn } from "next-auth/react";
import React from "react";

const FeatureCard = ({ title, icon, description }: { title: string; icon: React.ReactNode; description: string }) => (
  <div className="relative p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 rounded-full border border-indigo-100">
        Coming Soon
      </span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-100 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Chat with your Inbox. <br />
            <span className="text-indigo-600">Master your Career.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
            Connect your Gmail and let AI organize your job hunt. Ask anything about your applications, interviews, and follow-ups.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => signIn("google")}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
            {/* <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  U{i}
                </div>
              ))}
              <div className="pl-4 text-sm text-slate-500 font-medium self-center">
                Joined by 500+ job hunters
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* "The Now" Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Now: AI at your service</h2>
            <p className="text-slate-600">Our core AI engine is already helping users navigate their inbox.</p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-4 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mx-auto text-xs font-medium text-slate-400">Mail Chat - Career Assistant</div>
            </div>
            <div className="p-6 lg:p-10 space-y-6">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                  What&apos;s the status of my application at Google?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200">
                  You received an email from Google Recruiting 2 days ago. They&apos;ve invited you for a technical phone screen. Would you like me to find some available times in your calendar?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                  Summarize the benefits package from the Stripe offer.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200">
                  Based on the offer letter PDF, your benefits include:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Full medical, dental, and vision coverage</li>
                    <li>401(k) matching up to 4%</li>
                    <li>Annual professional development budget ($2,000)</li>
                    <li>Flexible PTO policy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "The Future" Section
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">The Future: Career Mastery</h2>
            <p className="text-lg text-slate-600">We&apos;re building the ultimate command center for your professional growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <FeatureCard
              title="Automatic Sync"
              description="Never manually track an application again. We sync with your inbox automatically."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            />
            <FeatureCard
              title="AI Interview Coach"
              description="Get tailored prep questions based on the specific job description and your background."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
            />
            <FeatureCard
              title="Smart Follow-ups"
              description="AI-driven reminders telling you exactly when and how to follow up with recruiters."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            />
            <FeatureCard
              title="Salary Benchmarking"
              description="Real-time data on salary ranges for similar roles in your specific location and industry."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <FeatureCard
              title="Resume Tailoring"
              description="Instantly optimize your resume for every application with AI-powered keyword matching."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <FeatureCard
              title="Sentiment Analysis"
              description="Know exactly where you stand. We analyze recruiter communication tone and frequency."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <FeatureCard
              title="Timeline Visualization"
              description="A clear, visual path of your entire interview process from first contact to offer."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <FeatureCard
              title="Research Dossier"
              description="Comprehensive company reports including recent news, culture, and interview tips."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />
            <FeatureCard
              title="AI Draft Assistant"
              description="Draft perfect replies to recruiters in seconds, maintaining the right level of interest."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            />
            <FeatureCard
              title="Success Analytics"
              description="Detailed metrics on your search efficiency, conversion rates, and funnel health."
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="text-xl font-bold text-slate-900">Mail Chat</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2026 Mail Chat. All rights reserved. Built for the modern job hunter.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
