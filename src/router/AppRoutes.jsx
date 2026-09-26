import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import AllTools from "../pages/AllTools";
import CategoriesIndex from "../pages/CategoriesIndex";
import CategoryPage from "../pages/CategoryPage";
import ToolPage from "../pages/ToolPage";
import OfficeHub from "../pages/OfficeHub";
import StudentHub from "../pages/StudentHub";
import Blog from "../pages/Blog";
import About from "../pages/About";
import Contact from "../pages/Contact";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Terms from "../pages/Terms";
import Disclaimer from "../pages/Disclaimer";
import NotFound from "../pages/NotFound";
import UniversityGpaPage from "../pages/UniversityGpaPage";
import Settings from "../pages/Settings";
import ToolHealth from "../pages/ToolHealth";
import ConversionHub from "../tools/converters/ConversionHub";
import ConversionPage from "../pages/ConversionPage";

const CATEGORY_ALIASES = [
  ["office-tools","office-tools"],["pdf-tools","pdf-tools"],["image-tools","image-tools"],["student-tools","student-tools"],
  ["programming-tools","programming-tools"],["ai-tools","ai-tools"],["business-tools","finance-tools"],["calculators","calculators"],
  ["utilities","utility-tools"],["developer-tools","developer-tools"],["scanner-tools","scanner-tools"],["document-tools","document-tools"],
  ["text-tools","text-tools"],["converters","converter-tools"],["date-time-tools","date-time-tools"],["world-tools","world-tools"],["daily-life-tools","daily-life-tools"],
  ["university-tools","university-tools"],["productivity-tools","productivity-tools"],["health-tools","health-tools"],["nutrition-tools","nutrition-tools"],
  ["mathematics-tools","mathematics-tools"],["physics-tools","physics-tools"],["chemistry-tools","chemistry-tools"],["biology-tools","biology-tools"],
  ["engineering-tools","engineering-tools"],["robotics-tools","robotics-tools"],
];

export default function AppRoutes() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="tools" element={<AllTools />} />
    <Route path="tools/unix-timestamp-converter-pro" element={<Navigate to="/tools/unix-timestamp-converter-plus" replace />} />
    <Route path="tools/:toolId" element={<ToolPage />} />
    <Route path="convert" element={<ConversionHub />} />
    <Route path="convert/:converterSlug" element={<ConversionPage />} />
    <Route path="office" element={<OfficeHub />} />
    <Route path="student-hub" element={<StudentHub />} />
    <Route path="gpa-calculator/:university" element={<UniversityGpaPage />} />
    <Route path="categories" element={<CategoriesIndex />} />
    <Route path="categories/business-finance" element={<Navigate to="/business-tools" replace />} />
    <Route path="categories/:slug" element={<CategoryPage />} />
    {CATEGORY_ALIASES.map(([path,slug])=><Route key={path} path={path} element={<CategoryPage slugOverride={slug} />} />)}
    <Route path="blog" element={<Blog />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="settings" element={<Settings />} />
    <Route path="tool-health" element={<ToolHealth />} />
    <Route path="privacy-policy" element={<PrivacyPolicy />} />
    <Route path="terms" element={<Terms />} />
    <Route path="disclaimer" element={<Disclaimer />} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes>;
}
