
import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Award, School } from "lucide-react";

const Stats = () => {
  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Stats data
  const stats = [
    {
      icon: <Users className="h-10 w-10" />,
      number: "1000+",
      label: "শিক্ষার্থী",
      description: "সফল গ্র্যাজুয়েট",
    },
    {
      icon: <BookOpen className="h-10 w-10" />,
      number: "50+",
      label: "পাঠ্যক্রম",
      description: "উন্নত শিক্ষা পদ্ধতি",
    },
    {
      icon: <Award className="h-10 w-10" />,
      number: "100%",
      label: "উত্তীর্ণের হার",
      description: "সরকারি পরীক্ষায়",
    },
    {
      icon: <School className="h-10 w-10" />,
      number: "25+",
      label: "অভিজ্ঞ শিক্ষক",
      description: "যোগ্যতা সম্পন্ন",
    },
  ];

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-gradient-to-r from-gray-900 to-gray-800 py-16 sm:py-24 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <motion.h2
            variants={statVariants}
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            আমাদের সাফল্য
          </motion.h2>
          <motion.p
            variants={statVariants}
            className="mt-4 text-lg text-gray-300"
          >
            গত 15 বছর ধরে আমরা শিক্ষাক্ষেত্রে উল্লেখযোগ্য অবদান রেখে চলেছি।
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={statVariants}
              className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 text-white group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </h3>
                <p className="text-xl font-semibold text-gray-200 mb-1">
                  {stat.label}
                </p>
                <p className="text-sm text-gray-400">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default Stats;
