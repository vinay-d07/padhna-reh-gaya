import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import CtaSection from "./components/CtaSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-warm-canvas">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
