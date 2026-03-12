import Hero from "@/components/hero/Hero";
import SearchSection from "@/components/home/SearchSection";
import LogoBar from "@/components/home/LogoBar";
import CategoryShowcase from "@/components/hero/CategoryShowcase";
import ValueProps from "@/components/home/ValueProps";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import AITopPicks from "@/components/home/AITopPicks";
import UseCases from "@/components/home/UseCases";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import EcoCommitment from "@/components/home/EcoCommitment";
import CtaBanner from "@/components/home/CtaBanner";
import Faq from "@/components/home/Faq";

export default function Home() {
  return (
    <>
      <Hero />
      <SearchSection />
      <LogoBar />
      <CategoryShowcase />
      <ValueProps />
      <FeaturedProducts />
      <AITopPicks />
      <UseCases />
      <HowItWorks />
      <Testimonials />
      <EcoCommitment />
      <CtaBanner />
      <Faq />
    </>
  );
}
