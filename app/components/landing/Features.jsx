"use client";

import { motion } from "framer-motion";
import { FaCalendarCheck, FaUsers, FaShieldAlt } from "react-icons/fa";

const features = [
  {
    icon: <FaCalendarCheck />,
    title: "Easy Scheduling",
    desc: "Book and manage appointments in seconds.",
  },
  {
    icon: <FaUsers />,
    title: "Patient Management",
    desc: "Keep track of all your clients securely.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Data Security",
    desc: "Your data is encrypted and safe.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="transition-colors duration-500 py-20 bg-gradient-to-b from-base-100 to-base-200 dark:from-gray-900 dark:to-gray-800"
    >
      <h2 className="text-3xl font-bold text-center mb-10 text-base-content">
        Features
      </h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="card bg-base-100 shadow-lg p-6 text-center transition-colors duration-500"
          >
            <div className="text-4xl mb-4 text-primary">{f.icon}</div>
            <h3 className="text-xl font-semibold text-base-content">
              {f.title}
            </h3>
            <p className="mt-2 text-base-content/70">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
