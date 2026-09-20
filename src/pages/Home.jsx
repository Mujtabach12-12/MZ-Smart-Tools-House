import { useEffect, useState } from "react";
import Seo from "../components/layout/Seo";
import Hero from "../components/home/Hero";
import MobileHome from "../components/home/MobileHome";
import CategoryRail from "../components/home/CategoryRail";
import DashboardQuickStart from "../components/home/DashboardQuickStart";
import PersonalTools from "../components/home/PersonalTools";
import RecentFiles from "../components/home/RecentFiles";
import PopularTools from "../components/home/PopularTools";
import IntentSections from "../components/home/IntentSections";
import HowItWorks from "../components/home/HowItWorks";
import WhyMZSolutions from "../components/home/WhyMZSolutions";
import FAQ from "../components/home/FAQ";

function useMobileLayout() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return mobile;
}

export default function Home() {
  const mobile = useMobileLayout();
  return (
    <>
      <Seo path="/" title={null} description="MZ Smart Tool House is a focused digital office for PDF, documents, images, study, programming, developer utilities, AI and everyday calculations." />
      {mobile ? <MobileHome /> : (
        <>
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
      )}
    </>
  );
}
