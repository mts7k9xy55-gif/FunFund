import {
  Header,
  HeroSection,
  FeaturesSection,
  StatsSection,
  DemoSection,
  HowItWorksSection,
  ProjectsSection,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <DemoSection />
      <HowItWorksSection />
      <ProjectsSection />
      <Footer />
    </div>
  );
}
