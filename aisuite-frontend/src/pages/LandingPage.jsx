

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ParticlesBackground from "../components/ParticlesBackground";

// Icons
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  BoltIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const SECTIONS = ["home", "features", "pricing", "faq"];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [pricingTab, setPricingTab] = useState("monthly");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (const id of SECTIONS) {
        const sec = document.getElementById(id);
        if (!sec) continue;
        const top = sec.offsetTop;
        const h = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + h) {
          setActiveSection(id);
          break;
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  // Rich data
  const features = [
    {
      title: "CareerGPT",
      icon: <BoltIcon className="w-8 h-8 text-blue-400" />,
      desc: "Accelerate your career with AI-powered tools tailored for professionals.",
      bullets: [
        "AI Resume Enhancer & Builder",
        "Mock Interviews with Feedback",
        "Cover Letter Generator",
        "Job Application Tracker",
      ],
    },
    {
      title: "StudyGPT",
      icon: <AcademicCapIcon className="w-8 h-8 text-green-400" />,
      desc: "Master any subject with intelligent study aids and summarization.",
      bullets: [
        "Instant PDF Summaries",
        "Concept Simplification",
        "Exam-Style Q&A Generator",
        "Personalized Study Plans",
      ],
    },
    {
      title: "ContentGPT",
      icon: <PencilSquareIcon className="w-8 h-8 text-purple-400" />,
      desc: "Generate engaging content for social media, blogs, and marketing.",
      bullets: [
        "Social Media Post Creator",
        "Blog Outline & Drafts",
        "Ad Copy & Taglines",
        "SEO Optimization Tips",
      ],
    },
  ];

  const monthlyPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "/ month",
      desc: "Perfect for trying out the platform.",
      perks: ["3 queries per day", "Basic SmartMix access", "History: Last 10"],
      emphasize: false,
      buttonText: "Get Started",
    },
    {
      name: "Pro",
      price: "₹249",
      period: "/ month",
      desc: "Unlock full power for serious users.",
      perks: [
        "Unlimited queries",
        "Full SmartMix Access",
        "Access all 3 AI tools",
        "Export to PDF",
        "Unlimited history",
        "Priority Support",
      ],
      emphasize: true,
      buttonText: "Upgrade to Pro",
    },
  ];

  const enterprisePlans = [
    {
      name: "Team",
      price: "Custom",
      period: "",
      desc: "Scalable solutions for growing teams.",
      perks: [
        "Everything in Pro",
        "Team Management Dashboard",
        "Centralized Billing",
        "Admin Controls",
        "Usage Analytics",
      ],
      emphasize: false,
      buttonText: "Contact Sales",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "For large organizations with specific needs.",
      perks: [
        "Everything in Team",
        "SAML SSO Integration",
        "Dedicated Account Manager",
        "Custom AI Model Training",
        "SLA Support",
      ],
      emphasize: true,
      buttonText: "Contact Sales",
    },
  ];

  const faqs = [
    {
      q: "What makes AI Suite different?",
      a: "AI Suite uniquely combines specialized AI agents for Career, Study, and Content into a single, cohesive platform. Our SmartMix technology allows you to compare outputs from top models side-by-side.",
    },
    {
      q: "Is there a limit on the Free plan?",
      a: "Yes, the Free plan is designed for exploration and is limited to 3 queries per day. You can upgrade to Pro for unlimited access.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Absolutely. You can cancel your subscription at any time from your account settings. You will retain access until the end of your billing period.",
    },
    {
      q: "Do you offer student discounts?",
      a: "We are working on a student discount program. Please contact our support team for more information.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white bg-[#050505] font-sans selection:bg-blue-500/30">
      <ParticlesBackground />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">
              AiSuite
            </span>
          </Link>

          <ul className="hidden md:flex gap-8 items-center text-sm font-medium">
            {SECTIONS.map((id) => (
              <li key={id}>
                <button
                  onClick={() => handleNavClick(id)}
                  className={`relative transition-colors duration-300 ${
                    activeSection === id ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                  {activeSection === id && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden md:inline-block text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
          >
            Get Started
          </Link>
         <button
  className="md:hidden text-white"
  onClick={() => setIsMenuOpen(true)}
>
  <Bars3Icon className="w-7 h-7" />
</button>

        </div>

        {/* Mobile Menu */}



      </motion.nav>
      <AnimatePresence>
  {isMenuOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0
        z-[999]
      bg-gradient-to-b from-black via-black/95 to-black


        backdrop-blur-2xl
        flex flex-col
      "
    >
      {/* Close */}
      <button
        onClick={() => setIsMenuOpen(false)}
        className="absolute top-4 right-4 text-white"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Menu */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8 text-xl font-semibold pt-24">
        {SECTIONS.map((id) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className="text-white/90 hover:text-white transition"
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}

        <div className="mt-10 flex flex-col gap-4 w-64">
          <Link
            to="/login"
            className="py-3 rounded-xl border border-white/30 text-center text-white"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="py-3 rounded-xl bg-blue-600 text-center font-bold text-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>


      {/* Content Wrapper */}
      <div className="relative z-10 pt-20">
        
        {/* HERO */}
        <section
          id="home"
          className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              New: Multi-Model AI Chat
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Unlock Your Potential with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Intelligent AI Tools
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
              The all-in-one platform tailored for your career, studies, and content creation. 
              Experience the power of ChatGPT, Gemini, and Claude in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1"
              >
                Start for Free
              </Link>
              <button
                onClick={() => handleNavClick("features")}
                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Explore Features
              </button>
            </div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Capabilities</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-white">Everything you need to succeed</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-[#111827]/60 border border-white/5 hover:border-white/10 hover:bg-[#111827]/80 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm"
              >
                <div>
                  <div className="mb-6 p-3 rounded-2xl bg-white/5 w-fit border border-white/5 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">{f.title}</h4>
                  <p className="text-gray-400 mb-6 leading-relaxed">{f.desc}</p>
                  <ul className="space-y-3">
                    {f.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-300 text-sm">
                        <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Pricing</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple, transparent pricing</h3>
            
            {/* Toggle */}
            <div className="inline-flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setPricingTab("monthly")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pricingTab === "monthly" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingTab("enterprise")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pricingTab === "enterprise" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Enterprise
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {(pricingTab === "monthly" ? monthlyPlans : enterprisePlans).map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative p-8 rounded-3xl border flex flex-col ${
                  plan.emphasize
                    ? "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-blue-500/30 shadow-2xl shadow-blue-900/20"
                    : "bg-[#111827]/40 border-white/5 hover:border-white/10"
                }`}
              >
                {plan.emphasize && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{plan.desc}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.perks.map((p, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-300 text-sm">
                      <CheckCircleIcon className={`w-5 h-5 shrink-0 ${plan.emphasize ? "text-blue-400" : "text-gray-500"}`} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`w-full py-3 rounded-xl text-center font-bold transition-all ${
                    plan.emphasize
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-4 md:px-8 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Support</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => {
              const isOpen = expandedFAQ === i;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen ? "bg-[#1e293b]/60 border-blue-500/30" : "bg-[#111827]/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <button
                    onClick={() => setExpandedFAQ(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className={`font-medium ${isOpen ? "text-blue-100" : "text-gray-300"}`}>
                      {f.q}
                    </span>
                    {isOpen ? (
                      <ChevronUpIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 text-gray-400 text-sm leading-relaxed"
                      >
                        {f.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-200">AiSuite</span>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} AiSuite Inc. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms</Link>
              <Link to="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}