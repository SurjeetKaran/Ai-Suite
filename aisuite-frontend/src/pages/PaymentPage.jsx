import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";

// Icons
import {
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

import LoadingSpinner from "../components/LoadingSpinner";
import log from "../utils/logger";
import dialog from "../utils/dialogService";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 1️⃣ Fetch Plans from Backend
  useEffect(() => {
    const getPlans = async () => {
      try {
        const res = await API.get("/admin/plan");
        setPlans(res.data);
      } catch (err) {
        log('ERROR', 'Failed to fetch plans', err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    getPlans();
  }, []);

  // 2️⃣ Handle Payment Logic
  const handleSubscribe = async (plan) => {
    if (plan.price === 0) return; // Ignore free plan click

    setProcessing(true);
    try {
      // A. Create Order
      const orderRes = await API.post("/auth/payment/create-order", {
        amount: plan.price,
        currency: "INR",
      });

      const { order } = orderRes.data;

      // B. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Put your Test Key ID here
        amount: order.amount,
        currency: order.currency,
        name: "AiSuite Pro",
        description: `Upgrade to ${plan.name} Plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // C. Verify Payment
            await API.post("/auth/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // D. Success
            await dialog.alert("Payment Successful! You are now a Pro member.");
            await fetchUser(); // Refresh user state
            navigate("/dashboard");
            } catch (err) {
            await dialog.alert("Payment verification failed.");
            log('ERROR', 'Payment verification failed', err?.response?.data || err);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      log('ERROR', 'Payment initiation failed', err?.response?.data || err);
      await dialog.alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Plans..." />;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Navbar / Back Button */}
      <div className="p-6 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-20 z-10">
        <div className="text-center mb-12 max-w-2xl">
          <span className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-2 block">
            Upgrade Your Experience
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-400 text-lg">
            Unlock the full power of multi-model AI with our Pro plan. No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {plans.map((plan, idx) => {
            const isPro = plan.price > 0;
            const isCurrent = user?.subscription === (isPro ? "Pro" : "Free");

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                  isPro
                    ? "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-blue-500/50 shadow-2xl shadow-blue-900/20 scale-105 z-10"
                    : "bg-[#111827]/60 border-white/5 hover:border-white/10 backdrop-blur-sm"
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                    <SparklesIcon className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${isPro ? "text-white" : "text-gray-300"}`}>
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isPro ? "For power users & creators" : "For getting started"}
                      </p>
                    </div>
                    {isPro ? (
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <SparklesIcon className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="p-2 bg-white/5 rounded-lg text-gray-500">
                        <ShieldCheckIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-gray-500">/ month</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircleIcon className={`w-5 h-5 shrink-0 ${isPro ? "text-blue-400" : "text-gray-500"}`} />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing || isCurrent || !isPro}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-white/10 text-gray-400 cursor-default"
                      : isPro
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:-translate-y-1"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {processing && isPro ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : isPro ? (
                    "Upgrade to Pro"
                  ) : (
                    "Free Forever"
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}