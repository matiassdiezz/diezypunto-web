import Hero from "@/components/hero/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import SearchSection from "@/components/home/SearchSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import LogoBar from "@/components/home/LogoBar";
import Testimonials from "@/components/home/Testimonials";
import EcoFaq from "@/components/home/EcoFaq";
import CtaFinal from "@/components/home/CtaFinal";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cuál es la cantidad mínima de pedido?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Depende del producto y el método de personalización. En general, los mínimos arrancan desde 25 unidades.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto demora la entrega?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En promedio, entre 7 y 15 días hábiles una vez aprobado el diseño.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué métodos de personalización ofrecen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Serigrafía, bordado, grabado láser, sublimación, impresión UV, tampografía y más. Cada producto indica los métodos disponibles.",
      },
    },
    {
      "@type": "Question",
      name: "¿Hacen envíos a todo el país?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, realizamos envíos a todo el territorio argentino. Los costos de envío se calculan según destino y volumen del pedido.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo ver una muestra antes de comprar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, podemos enviar muestras físicas o virtuales (mockups digitales con tu logo) antes de confirmar el pedido.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo funciona la compra?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agregá productos al carrito desde el catálogo, indicá las cantidades y pagá con Mercado Pago o consultá por Telegram.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <SearchSection />
      <FeaturedProducts />
      <LogoBar />
      <Testimonials />
      <EcoFaq />
      <CtaFinal />
    </>
  );
}
