import Hero from "@/components/hero/Hero";
import LogoBar from "@/components/home/LogoBar";
import CategoryShowcase from "@/components/hero/CategoryShowcase";
import ValueProps from "@/components/home/ValueProps";
import FeaturedProducts from "@/components/home/FeaturedProducts";
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
      <LogoBar />
      <CategoryShowcase />
      <ValueProps />
      <FeaturedProducts />
      <UseCases />
      <HowItWorks />
      <Testimonials />
      <EcoCommitment />
      <CtaBanner />
      <Faq />
    </>
  );
}
