import CareerServicesHero from "../components/CareerServicesHero";
import CompaniesStrip from "../components/CompaniesStrip";
import HowItWorksSection from "../components/HowItWorksSection";
import FeaturedJobsSection from "../components/FeaturedJobsSection";
import PopularJobTypesSection from "../components/PopularJobTypesSection";
import PopularCategorySection from "../components/PopularCategorySection";
import ForEmployersSection from "../components/ForEmployersSection";
import TestimonialsSection from "../components/TestimonialsSection";
import FaqSection from "../components/FaqSection";
import Internship from "../../home/components/Internship";
import Jobs from "../../home/components/Jobs";

const CareerServicesPage = () => {
  return (
    <div>
      <CareerServicesHero />
      <CompaniesStrip />
      <HowItWorksSection />
      <FeaturedJobsSection limit={6} />
      <PopularJobTypesSection />
      <PopularCategorySection />
      <ForEmployersSection />
      <TestimonialsSection />
      <FaqSection />
      {/* <Internship limit={8} />
      <Jobs limit={8} /> */}
    </div>
  );
};

export default CareerServicesPage;
