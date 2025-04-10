
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

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

  const childVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hover: {
      scale: 1.03,
      boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Form submitted:", formData);
      setFormStatus('success');
      setFormData({ name: "", email: "", phone: "", message: "" });
      
      // Reset form success status after 3 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormStatus('error');
    }
  };

  return (
    <motion.section
      id="contact"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Contact Header */}
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <motion.h2
            variants={childVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-md"
          >
            যোগাযোগ করুন
          </motion.h2>
          <motion.p
            variants={childVariants}
            className="mt-6 text-lg sm:text-xl leading-8 text-white/90"
          >
            আমাদের সাথে যোগাযোগ করতে নিচের ফর্মটি পূরণ করুন। আমরা আপনার অনুসন্ধানের উত্তর দিতে সর্বদা প্রস্তুত।
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Information Cards */}
          <motion.div variants={childVariants} className="lg:col-span-1 space-y-6">
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">ফোন</h3>
                  <p className="text-white/80 mt-1">+88 01234 567890</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">ইমেইল</h3>
                  <p className="text-white/80 mt-1">info@myschool.edu.bd</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">ঠিকানা</h3>
                  <p className="text-white/80 mt-1">
                    ১২৩ শিক্ষা সড়ক, ঢাকা, বাংলাদেশ
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={childVariants} className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-white text-sm font-medium">
                        আপনার নাম
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="পূর্ণ নাম লিখুন"
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-white text-sm font-medium">
                        ইমেইল
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="আপনার ইমেইল লিখুন"
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-white text-sm font-medium">
                      ফোন নম্বর
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="আপনার ফোন নম্বর লিখুন"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-white text-sm font-medium">
                      বার্তা
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="আপনার বার্তা লিখুন"
                      required
                      rows={4}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className={`w-full sm:w-auto ${
                      formStatus === 'success'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
                    } text-gray-900 font-semibold py-2 px-6 rounded-full flex items-center justify-center gap-2`}
                  >
                    {formStatus === 'submitting' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-gray-900"></div>
                    )}
                    {formStatus === 'success' && <Check className="h-5 w-5" />}
                    {formStatus === 'idle' && <Send className="h-5 w-5" />}
                    {formStatus === 'submitting' && "পাঠানো হচ্ছে..."}
                    {formStatus === 'success' && "পাঠানো হয়েছে!"}
                    {(formStatus === 'idle' || formStatus === 'error') && "পাঠান"}
                  </Button>

                  {formStatus === 'error' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-300 text-sm mt-2"
                    >
                      বার্তা পাঠানো ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
                    </motion.p>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default Contact;
