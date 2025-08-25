"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="text-2xl font-bold text-gradient-primary"
            whileHover={{ scale: 1.05 }}
          >
            Prime Stores
          </motion.div>
          <div className="hidden md:flex space-x-6">
            <motion.a 
              href="#features" 
              className="text-white/80 hover:text-white transition-colors"
              whileHover={{ y: -2 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#how-it-works" 
              className="text-white/80 hover:text-white transition-colors"
              whileHover={{ y: -2 }}
            >
              How It Works
            </motion.a>
            <motion.a 
              href="#join" 
              className="text-white/80 hover:text-white transition-colors"
              whileHover={{ y: -2 }}
            >
              Join Now
            </motion.a>
          </div>
          <Link href="/login">
            <motion.button 
              className="glass-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="animate-float"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-shadow">
              Welcome to{" "}
              <span className="text-gradient-secondary">Prime Stores</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              The ultimate campus marketplace connecting students, vendors, and administrators 
              in a seamless digital ecosystem
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link href="/customers">
              <motion.button 
                className="glass-button text-lg px-8 py-4 bg-gradient-primary"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                🛍️ Shop Now
              </motion.button>
            </Link>
            <Link href="/vendors">
              <motion.button 
                className="glass-button text-lg px-8 py-4"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                🏪 Become a Vendor
              </motion.button>
            </Link>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="glass-card text-center hover-lift">
              <div className="text-3xl font-bold text-gradient-tertiary mb-2">1000+</div>
              <div className="text-white/70">Active Students</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-3xl font-bold text-gradient-tertiary mb-2">50+</div>
              <div className="text-white/70">Campus Vendors</div>
            </div>
            <div className="glass-card text-center hover-lift">
              <div className="text-3xl font-bold text-gradient-tertiary mb-2">3</div>
              <div className="text-white/70">University Campuses</div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-gradient-secondary opacity-30"
          animate={{ y: [-20, 20, -20], rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-10 w-16 h-16 rounded-full bg-gradient-tertiary opacity-30"
          animate={{ y: [20, -20, 20], rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 text-gradient-primary">
              Amazing Features
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need for a complete campus marketplace experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🛒",
                title: "Easy Shopping",
                description: "Browse and purchase products from campus vendors with just a few clicks"
              },
              {
                icon: "💳",
                title: "Secure Payments",
                description: "Safe and reliable payment system with wallet integration"
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                description: "Responsive design that works perfectly on all your devices"
              },
              {
                icon: "🎯",
                title: "Campus Specific",
                description: "Filter products and services by your specific university campus"
              },
              {
                icon: "⭐",
                title: "Reviews & Ratings",
                description: "Rate and review vendors to help the community make better choices"
              },
              {
                icon: "📊",
                title: "Analytics Dashboard",
                description: "Comprehensive analytics for vendors to track their business performance"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card text-center hover-lift hover-glow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 text-gradient-secondary">
              How It Works
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Simple steps to get started with Prime Stores
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create your account as a student, vendor, or admin",
                icon: "👤"
              },
              {
                step: "02",
                title: "Browse & Shop",
                description: "Explore products from campus vendors or list your own",
                icon: "🛍️"
              },
              {
                step: "03",
                title: "Connect & Grow",
                description: "Build your campus community and grow your business",
                icon: "🚀"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="glass-card hover-lift mb-6 relative">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <div className="text-5xl mb-4 pt-4">{step.icon}</div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">
                    {step.title}
                  </h3>
                  <p className="text-white/70">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 text-gradient-tertiary">
              Join Your Role
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Choose your path and start your Prime Stores journey today
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: "Student/Customer",
                description: "Shop from campus vendors, discover amazing products, and enjoy seamless delivery",
                features: ["Browse Products", "Secure Checkout", "Order Tracking", "Rate & Review"],
                link: "/customers",
                icon: "🎓",
                gradient: "bg-gradient-primary"
              },
              {
                role: "Campus Vendor",
                description: "Sell your products to students, manage orders, and grow your business",
                features: ["Product Management", "Order Fulfillment", "Analytics Dashboard", "Boost Visibility"],
                link: "/vendors",
                icon: "🏪",
                gradient: "bg-gradient-secondary"
              },
              {
                role: "Administrator",
                description: "Manage the platform, approve vendors, and oversee campus operations",
                features: ["Vendor Approval", "Product Moderation", "Platform Analytics", "User Management"],
                link: "/admin",
                icon: "⚙️",
                gradient: "bg-gradient-tertiary"
              }
            ].map((roleCard, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card text-center hover-lift hover-glow"
              >
                <div className="text-4xl mb-4">{roleCard.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {roleCard.role}
                </h3>
                <p className="text-white/70 mb-6">
                  {roleCard.description}
                </p>
                <ul className="text-left text-white/60 mb-8 space-y-2">
                  {roleCard.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={roleCard.link}>
                  <motion.button 
                    className={`glass-button w-full ${roleCard.gradient}`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-nav mt-20 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-gradient-primary mb-4">
            Prime Stores
          </div>
          <p className="text-white/60 mb-4">
            Connecting campus communities through seamless marketplace experiences
          </p>
          <div className="flex justify-center space-x-6 text-white/40">
            <span>© 2024 Prime Stores</span>
            <span>•</span>
            <span>Campus Marketplace</span>
            <span>•</span>
            <span>Made with ❤️</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
