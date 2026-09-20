import Seo from "../components/layout/Seo";
import Hero from "../components/home/Hero";
import CategoryRail from "../components/home/CategoryRail";
import DashboardQuickStart from "../components/home/DashboardQuickStart";
import PersonalTools from "../components/home/PersonalTools";
import RecentFiles from "../components/home/RecentFiles";
import PopularTools from "../components/home/PopularTools";
import IntentSections from "../components/home/IntentSections";
import HowItWorks from "../components/home/HowItWorks";
import WhyMZSolutions from "../components/home/WhyMZSolutions";
import FAQ from "../components/home/FAQ";

export default function Home() {
  return (
    <>
      <Seo path="/" title={null} description="MZ Smart Tool House is a focused digital office for PDF, documents, images, study, programming, developer utilities, AI and everyday calculations." />
      <Hero />
      <DashboardQuickStart />
      <CategoryRail />
      <PersonalTools />
      <RecentFiles />
      <PopularTools />
      <IntentSections />
      <HowItWorks />
      <WhyMZSolutions />
      <FAQ />
    </>
  );
}
