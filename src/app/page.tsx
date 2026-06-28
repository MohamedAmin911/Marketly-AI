import { LandingNavbar } from "@/features/landing/components/navbar";
import { HeroSection } from "@/features/landing/components/hero-section";
import { PartnersMarquee } from "@/features/landing/components/partners-marquee";
import { FeaturesSection } from "@/features/landing/components/features-section";
import { TestimonialsMarquee } from "@/features/landing/components/testimonials-marquee";
import { PricingSection } from "@/features/landing/components/pricing-section";
import { LandingFooter } from "@/features/landing/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <PartnersMarquee />
        <FeaturesSection />
        <TestimonialsMarquee />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
