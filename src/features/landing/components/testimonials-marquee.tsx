"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "CMO at Stripe",
    content: "Marketly AI replaced our entire creative agency. We now generate ad copy and storyboards in 5 minutes instead of 5 days.",
    logo: "https://img.logo.dev/stripe.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "David Chen",
    role: "Growth Lead at Vercel",
    content: "The AI Growth Engine is mind-blowing. It gave us a 3-month launch plan that was better than what our $10k/mo consultants provided.",
    logo: "https://img.logo.dev/vercel.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Elena Rodriguez",
    role: "E-commerce Founder",
    content: "I use the Image Generator daily for product shots. The photorealism is unmatched and saves us thousands on photography.",
    logo: "https://img.logo.dev/shopify.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Michael Chang",
    role: "Digital Marketing Director",
    content: "The video storyboarding feature allows our team to pitch concepts to executives visually before spending a dime on production.",
    logo: "https://img.logo.dev/netflix.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
  {
    name: "Jessica Walsh",
    role: "Social Media Manager",
    content: "Generating campaigns across TikTok, Insta, and LinkedIn simultaneously has 10x'd my output. The tone matching is scary good.",
    logo: "https://img.logo.dev/spotify.com?token=pk_LnYu_mYyRBCS-_8nhWeJaw",
  },
];

export function TestimonialsMarquee() {
  return (
    <section className="py-24 overflow-hidden relative bg-background">
      <div className="text-center max-w-2xl mx-auto mb-16 px-6">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
          Loved by modern <span className="text-primary">growth teams</span>
        </h2>
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-64 md:w-96 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-64 md:w-96 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

      <div className="flex w-full overflow-hidden">
        <motion.div
          animate={{ x: [0, "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 30,
          }}
          className="flex gap-6 pr-6 w-max items-center"
        >
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={idx}
              className="w-[350px] shrink-0 glass-panel p-6 rounded-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-primary" />
                  ))}
                </div>
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1">
                &quot;{testimonial.content}&quot;
              </p>
              <div>
                <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
