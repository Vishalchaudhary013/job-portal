import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAward,
  FiBookmark,
  FiCheckCircle,
  FiExternalLink,
  FiShare2,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import ApplicationFormModal from "../../forms/components/ApplicationFormModal";
import ShareModal from "../../../components/common/ShareModal";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import {
  formatDeadlineLabel,
  formatDeadlineStatus,
  formatStipendPeriod,
  formatStipendText,
  getInternshipTags,
  isInternshipOpen,
  resolveWorkMode,
} from "../utils/internshipCardData";
import OpportunityDetailView from "../../opportunity/components/OpportunityDetailView";
import InternshipDetailsHeader from "../components/InternshipDetailsHeader";
import InternshipDetailsSummaryCards from "../components/InternshipDetailsSummaryCards";
import InternshipDetailsAbout from "../components/InternshipDetailsAbout";
import { BiBookmark, BiShare } from "react-icons/bi";
import {
  MdOutlineAttachMoney,
  MdOutlineCorporateFare,
  MdOutlineDateRange,
  MdBusiness,
} from "react-icons/md";
import { GiTakeMyMoney } from "react-icons/gi";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { IoBagOutline, IoLocationOutline } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";
import { IoMdShare } from "react-icons/io";
import { FaXTwitter } from "react-icons/fa6";

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toReadableDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resolveMapQuery = (value) => {
  const normalized = String(value || "").trim();
  return normalized || "India";
};

const getMapSearchUrl = (value) => {
  const query = encodeURIComponent(resolveMapQuery(value));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

const getMapEmbedUrl = (value) => {
  const query = encodeURIComponent(resolveMapQuery(value));
  return `https://maps.google.com/maps?q=${query}&z=13&output=embed`;
};

const getBenefitIcon = (benefit) => {
  return FiCheckCircle;
};

const InternshipDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { opportunities, isInternshipSaved, toggleSavedInternship, user } =
    useOpportunities();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const renderListOrHTML = (content) => {
    if (!content) return null;
    const str = String(content).trim();
    if (/<[a-z][\s\S]*>/i.test(str)) {
      return (
        <div
          className="text-slate-700 mt-3 text-[14px] whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 space-y-2"
          dangerouslySetInnerHTML={{ __html: str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    } else {
      const lines = str.split('\n').filter(line => line.trim() !== '');
      return (
        <ul className="list-disc pl-5 space-y-2 text-[14px] text-slate-700 mt-3">
          {lines.map((line, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ul>
      );
    }
  };

  const internship = useMemo(
    () =>
      opportunities.find(
        (item) =>
          item.id === id &&
          item.type === "Internship" &&
          isInternshipOpen(item),
      ),
    [opportunities, id],
  );

  const requiredSkills = toList(
    internship?.requiredSkills || internship?.skills,
  );
  const whoCanApply = toList(internship?.whoCanApply);
  const benefits = toList(internship?.benefits);
  const descriptionText = String(internship?.description || "").trim();
  const shouldShowDescriptionToggle = descriptionText.length > 320;
  const isSaved = isInternshipSaved(internship?.id);
  const mapSearchUrl = getMapSearchUrl(internship?.location);
  const mapEmbedUrl = getMapEmbedUrl(internship?.location);

  if (!internship) {
    return (
      <div className="min-h-[90vh] bg-[#EEF2FF] flex items-center justify-center px-4">
        <div className="bg-white border border-black/10 rounded-2xl p-8 max-w-xl w-full text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Internship not found
          </h1>
          <p className="text-slate-600 mt-2">
            This internship may have been removed or is no longer available.
          </p>
          <button
            type="button"
            onClick={() => navigate("/intership")}
            className="mt-5 px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold"
          >
            Back to internships
          </button>
        </div>
      </div>
    );
  }

  // NEW detail layout (reference design): light #E9F6FF hero + summary
  // card, 1250px two-column description with the navy `primary` headings
  // over black body copy, and a "You may also like" strip. Shared with the
  // other two opportunity detail pages.
  return <OpportunityDetailView opportunity={internship} type="Internship" />;

  // OLD layout — kept, commented out, not deleted.
  //   return (
  //     // <>
  //     //   <div className="bg-[#EEF2FF] min-h-screen py-8 sm:py-10 ">
  //     //     <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto px-4 sm:px-6">
  //     //       <div className="text-sm text-slate-500 mb-5">
  //     //         <Link to="/" className="hover:underline">
  //     //           Home
  //     //         </Link>
  //     //         <span className="mx-2">&gt;</span>
  //     //         <Link to="/intership" className="hover:underline">
  //     //           Internship
  //     //         </Link>
  //     //         <span className="mx-2">&gt;</span>
  //     //         <span className="text-slate-700 font-medium">{internship.title}</span>
  //     //       </div>
  //
  //     //       <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
  //     //         <div className="space-y-6">
  //     //           <InternshipDetailsHeader internship={internship} />
  //
  //     //           <InternshipDetailsSummaryCards internship={internship} />
  //
  //     //           {whoCanApply.length > 0 && (
  //     //             <div className="bg-white border border-[#EEF2FF] rounded-2xl p-6">
  //     //               <h2 className="text-xl font-semibold text-slate-900">Who Can Apply</h2>
  //     //               <ul className="mt-3 space-y-2 text-slate-700 list-disc pl-5">
  //     //                 {whoCanApply.map((item, index) => (
  //     //                   <li key={`${item}-${index}`}>{item}</li>
  //     //                 ))}
  //     //               </ul>
  //     //             </div>
  //     //           )}
  //
  //     //           {requiredSkills.length > 0 && (
  //     //             <div className="bg-white border border-[#EEF2FF] rounded-2xl p-6">
  //     //               <h2 className="text-xl font-semibold text-slate-900">Required Skills</h2>
  //     //               <div className="mt-3 flex flex-wrap gap-2">
  //     //                 {requiredSkills.map((skill, index) => (
  //     //                   <span
  //     //                     key={`${skill}-${index}`}
  //     //                     className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium"
  //     //                   >
  //     //                     {skill}
  //     //                   </span>
  //     //                 ))}
  //     //               </div>
  //     //             </div>
  //     //           )}
  //
  //     //           {benefits.length > 0 && (
  //     //             <div className="bg-white border border-[#EEF2FF] rounded-2xl p-6">
  //     //               <h2 className="text-xl font-semibold text-slate-900">Internship Benefits</h2>
  //     //               <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
  //     //                 {benefits.map((benefit, index) => (
  //     //                   <div
  //     //                     key={`${benefit}-${index}`}
  //     //                     className="rounded-xl border border-[#EEF2FF] bg-[#F8FAFF] px-4 py-3 text-slate-800 font-medium flex items-center gap-3"
  //     //                   >
  //     //                     <span className="h-11 w-11 rounded-xl bg-[#E2E8F0] text-[#1F2853] inline-flex items-center justify-center shrink-0">
  //     //                       {createElement(getBenefitIcon(benefit), {
  //     //                         size: 18,
  //     //                         "aria-hidden": true,
  //     //                       })}
  //     //                     </span>
  //     //                     <span>{benefit}</span>
  //     //                   </div>
  //     //                 ))}
  //     //               </div>
  //     //             </div>
  //     //           )}
  //
  //     //           <div className="bg-white border border-[#EEF2FF] rounded-2xl p-6">
  //     //             <h2 className="text-xl font-semibold text-slate-900">Job Description</h2>
  //     //             <div
  //     //               className="text-slate-700 mt-3 text-[15px] whitespace-pre-wrap"
  //     //               style={
  //     //                 shouldShowDescriptionToggle && !isDescriptionExpanded
  //     //                   ? {
  //     //                       display: "-webkit-box",
  //     //                       WebkitBoxOrient: "vertical",
  //     //                       WebkitLineClamp: 6,
  //     //                       overflow: "hidden",
  //     //                     }
  //     //                   : undefined
  //     //               }
  //     //               dangerouslySetInnerHTML={{
  //     //                 __html: descriptionText
  //     //                   .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  //     //               }}
  //     //             />
  //     //             {shouldShowDescriptionToggle && (
  //     //               <button
  //     //                 type="button"
  //     //                 onClick={() => setIsDescriptionExpanded((prev) => !prev)}
  //     //                 className="mt-3 block mx-auto text-sm font-semibold text-[#1F2853] hover:underline"
  //     //               >
  //     //                 {isDescriptionExpanded ? "Read less" : "Read more"}
  //     //               </button>
  //     //             )}
  //     //           </div>
  //     //         </div>
  //
  //     //         <InternshipDetailsAbout
  //     //           internship={internship}
  //     //           isSaved={isSaved}
  //     //           mapSearchUrl={mapSearchUrl}
  //     //           mapEmbedUrl={mapEmbedUrl}
  //     //           onApply={() => {
  //     //             if (!user) {
  //     //               navigate("/signup");
  //     //             } else {
  //     //               setSelectedOpportunity(internship);
  //     //             }
  //     //           }}
  //     //           onToggleSave={() => toggleSavedInternship(internship.id)}
  //     //         />
  //     //       </div>
  //     //     </div>
  //     //   </div>
  //
  //     //   <ApplicationFormModal
  //     //     isOpen={Boolean(selectedOpportunity)}
  //     //     opportunityTitle={selectedOpportunity?.title}
  //     //     opportunity={selectedOpportunity}
  //     //     onClose={() => setSelectedOpportunity(null)}
  //     //   />
  //     // </>
  //
  //     // <>
  //     //   <div className="bg-gray-50">
  //     //     <div className="w-[850px] mx-auto py-10 mt-20">
  //     //       <div className="flex items-start gap-4 mb-5">
  //     //         <div className="w-15 h-15  rounded-lg overflow-hidden shadow-md">
  //     //           <img
  //     //             src="https://joinhandshake-production.imgix.net/app/public/assets/institutions/430147/original/hs-emp-logo-data.?ixlib=rb-4.1.1&w=150&h=150&fit=crop&v=1557254669&s=7024750bee68482dda23d8cbd53917cf"
  //     //             alt=""
  //     //             className="w-full h-full overflow-hidden  rounded-lg"
  //     //           />
  //     //         </div>
  //     //         <div className="leading-7">
  //     //           <h4 className="text-[22px] font-semibold">
  //     //             New Jersey Department of Community Affairs
  //     //           </h4>
  //     //           <span className="text-[17px] font-medium">
  //     //             Government - Local, State & Federal
  //     //           </span>
  //     //         </div>
  //     //       </div>
  //
  //     //       <h2 className="text-[29px] font-semibold mb-3">
  //     //         Full-Stack Software Engineering Intern
  //     //       </h2>
  //     //       <p className="text-[13px] mb-4.5">
  //     //         Posted 2 days ago∙Apply by July 16, 2026 at 9:29 AM
  //     //       </p>
  //
  //     //       <div className="flex items-center gap-4 mb-8">
  //     //         <button className="flex items-center gap-1 border border-black/30 py-1 px-4 rounded-md">
  //     //           {" "}
  //     //           <BiBookmark />
  //     //           Save
  //     //         </button>
  //     //         <button className="text-white py-1 px-4 rounded-md bg-red-600">
  //     //           Apply
  //     //         </button>
  //     //       </div>
  //
  //     //       <div className="border-t border-b border-black/10 py-5 mb-7">
  //     //         <span className="text-[19.5px] font-medium inline-block mb-3">
  //     //           At a glance
  //     //         </span>
  //
  //     //         <div className="space-y-7">
  //     //           <div className="flex items-start gap-8">
  //     //             <GiTakeMyMoney size={22} />
  //
  //     //             <div className="">
  //     //               {" "}
  //     //               <span>$</span> 10000 month
  //     //             </div>
  //     //           </div>
  //
  //     //           <div className="flex items-start gap-8">
  //     //             <IoLocationOutline size={24} className="mt-1" />
  //     //             <div className="flex flex-col">
  //     //               <span className="font-semibold">
  //     //                 Onsite, based in Trenton, NJ
  //     //               </span>
  //     //               <span className="text-[13px]">Work from Office</span>
  //     //             </div>
  //     //           </div>
  //     //           <div className="flex items-start gap-8">
  //     //             <BsBuildings size={22} className="mt-1.5" />
  //     //             <div className="flex flex-col">
  //     //               <span className="font-semibold">Internship</span>
  //     //               <span className="text-[13px]">
  //     //                 Full-time∙From June 29, 2026 to September 30, 2026
  //     //               </span>
  //     //             </div>
  //     //           </div>
  //     //         </div>
  //     //       </div>
  //
  //     //       <div className="border-b  border-black/10 pb-5 mb-5">
  //     //         <span className="text-[19.5px] font-medium inline-block mb-3">
  //     //           Job description
  //     //         </span>
  //     //         <div className={`text-[14px] ${isDescriptionExpanded ? "" : "line-clamp-2 overflow-hidden"}`}>
  //
  //     //         <div className="space-y-4 flex flex-col text-[15.5px] mb-5">
  //     //           <span>Software Engineering Intern (Full-Stack)</span>
  //     //           <span>
  //     //             <b>Location:</b> Trenton, NJ
  //     //           </span>
  //     //           <span>
  //     //             <b>Employment Type:</b> Full-time{" "}
  //     //           </span>
  //     //         </div>
  //
  //     //         <span className="text-[16px] font-medium inline-block mb-4">
  //     //           About the Role
  //     //         </span>
  //     //         <div className="space-y-3.5 text-[14px] mb-5">
  //     //           <p>
  //     //             Reporting to the Director of Data Center Administration, the
  //     //             Full-Stack Software Engineering Intern will play a key role in
  //     //             building and maintaining high-impact web applications that
  //     //             promote housing stability and access to housing support services
  //     //             for residents of New Jersey. These applications power
  //     //             initiatives in eviction prevention, affordable housing creation,
  //     //             and veterans’ homelessness services, delivering mission-critical
  //     //             information and tools to the public and internal stakeholders.
  //     //           </p>
  //
  //     //           <p>
  //     //             This is a hands-on, professional role focused on building
  //     //             modern, accessible, and scalable frontend applications.You will
  //     //             work with a stack that includes React, Vite, TypeScript, and
  //     //             Astro, while also leveraging AI-assisted development platforms
  //     //             such as Claude Code, Cursor, and similar tools to streamline
  //     //             workflows and accelerate delivery.
  //     //           </p>
  //
  //     //           <p>
  //     //             Applications are deployed across Microsoft Azure and AWS
  //     //             environments.
  //     //           </p>
  //
  //     //           <p>
  //     //             The ideal candidate is detail-oriented, collaborative, and
  //     //             passionate about using technology to drive public good.
  //     //           </p>
  //
  //     //           <p>
  //     //             Applicants will be required to provide an open-source portfolio
  //     //             project for review, focusing on technical decisions,
  //     //             problem-solving approaches, and individual contributions.
  //     //           </p>
  //     //         </div>
  //
  //     //        <div>
  //     //          <span className="text-[16px] font-medium inline-block mb-3">
  //     //           Key Responsibilities
  //     //         </span>
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>
  //     //             Develop and maintain public-facing web applications using React,
  //     //             JavaScript/TypeScript, Vite, and Astro.
  //     //           </li>
  //     //           <li>
  //     //             Collaborate with designers, product owners, and stakeholders to
  //     //             create intuitive, responsive, and accessible user interfaces.
  //     //           </li>
  //     //           <li>
  //     //             Integrate REST APIs and configuration files (JSON) to deliver
  //     //             dynamic, data-driven content.
  //     //           </li>
  //     //           <li>
  //     //             Leverage AI-powered development tools (e.g., Bolt.new, Cursor,
  //     //             GitHub Copilot) to improve code efficiency and maintain code
  //     //             quality.
  //     //           </li>
  //     //           <li>
  //     //             Participate in cloud deployment workflows using Azure and AWS.
  //     //           </li>
  //     //           <li>
  //     //             Ensure all applications comply with WCAG accessibility
  //     //             standards, responsive design principles, and performance best
  //     //             practices.
  //     //           </li>
  //     //           <li>
  //     //             Engage in code reviews and contribute to a culture of technical
  //     //             excellence.
  //     //           </li>
  //     //         </ul>
  //     //        </div>
  //
  //     //       <div>
  //     //         <span className="text-[16px] font-medium inline-block mb-3">
  //     //           Interview Process
  //     //         </span>
  //
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>Qualified candidates will be asked to present a portfolio of past projects, focusing on technical decisions, problem-solving approaches, and individual contributions.</li>
  //
  //     //           <li>Qualified candidates will be asked to present a portfolio of past projects, focusing on technical decisions, problem-solving approaches, and individual contributions.</li>
  //     //         </ul>
  //
  //     //       </div>
  //
  //     //         <div>
  //     //           <span className="text-[16px] font-medium inline-block mb-3">
  //     //           Minimum Qualifications
  //     //         </span>
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>
  //     //             Develop and maintain public-facing web applications using React,
  //     //             JavaScript/TypeScript, Vite, and Astro.
  //     //           </li>
  //     //           <li>
  //     //             Collaborate with designers, product owners, and stakeholders to
  //     //             create intuitive, responsive, and accessible user interfaces.
  //     //           </li>
  //     //           <li>
  //     //             Integrate REST APIs and configuration files (JSON) to deliver
  //     //             dynamic, data-driven content.
  //     //           </li>
  //     //           <li>
  //     //             Leverage AI-powered development tools (e.g., Bolt.new, Cursor,
  //     //             GitHub Copilot) to improve code efficiency and maintain code
  //     //             quality.
  //     //           </li>
  //     //           <li>
  //     //             Participate in cloud deployment workflows using Azure and AWS.
  //     //           </li>
  //     //           <li>
  //     //             Ensure all applications comply with WCAG accessibility
  //     //             standards, responsive design principles, and performance best
  //     //             practices.
  //     //           </li>
  //     //           <li>
  //     //             Engage in code reviews and contribute to a culture of technical
  //     //             excellence.
  //     //           </li>
  //     //         </ul>
  //     //         </div>
  //
  //     //         <div>
  //     //           <span className="text-[16px] font-medium inline-block mb-3">
  //     //           Preferred Skills
  //     //         </span>
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>
  //     //             Develop and maintain public-facing web applications using React,
  //     //             JavaScript/TypeScript, Vite, and Astro.
  //     //           </li>
  //     //           <li>
  //     //             Collaborate with designers, product owners, and stakeholders to
  //     //             create intuitive, responsive, and accessible user interfaces.
  //     //           </li>
  //     //           <li>
  //     //             Integrate REST APIs and configuration files (JSON) to deliver
  //     //             dynamic, data-driven content.
  //     //           </li>
  //     //           <li>
  //     //             Leverage AI-powered development tools (e.g., Bolt.new, Cursor,
  //     //             GitHub Copilot) to improve code efficiency and maintain code
  //     //             quality.
  //     //           </li>
  //     //           <li>
  //     //             Participate in cloud deployment workflows using Azure and AWS.
  //     //           </li>
  //     //           <li>
  //     //             Ensure all applications comply with WCAG accessibility
  //     //             standards, responsive design principles, and performance best
  //     //             practices.
  //     //           </li>
  //     //           <li>
  //     //             Engage in code reviews and contribute to a culture of technical
  //     //             excellence.
  //     //           </li>
  //     //         </ul>
  //     //         </div>
  //
  //     //         <div>
  //     //           <span className="text-[16px] font-medium inline-block mb-3">
  //     //           Nice to Have
  //     //         </span>
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>
  //     //             Develop and maintain public-facing web applications using React,
  //     //             JavaScript/TypeScript, Vite, and Astro.
  //     //           </li>
  //     //           <li>
  //     //             Collaborate with designers, product owners, and stakeholders to
  //     //             create intuitive, responsive, and accessible user interfaces.
  //     //           </li>
  //     //           <li>
  //     //             Integrate REST APIs and configuration files (JSON) to deliver
  //     //             dynamic, data-driven content.
  //     //           </li>
  //     //           <li>
  //     //             Leverage AI-powered development tools (e.g., Bolt.new, Cursor,
  //     //             GitHub Copilot) to improve code efficiency and maintain code
  //     //             quality.
  //     //           </li>
  //     //           <li>
  //     //             Participate in cloud deployment workflows using Azure and AWS.
  //     //           </li>
  //     //           <li>
  //     //             Ensure all applications comply with WCAG accessibility
  //     //             standards, responsive design principles, and performance best
  //     //             practices.
  //     //           </li>
  //     //           <li>
  //     //             Engage in code reviews and contribute to a culture of technical
  //     //             excellence.
  //     //           </li>
  //     //         </ul>
  //     //         </div>
  //
  //     //        <div>
  //     //          <span className="text-[16px] font-medium inline-block mb-3">
  //     //           What We Offer
  //     //         </span>
  //     //         <ul className="list-disc pl-5 space-y-2 text-[14px] px-4 mb-5">
  //     //           <li>
  //     //             Develop and maintain public-facing web applications using React,
  //     //             JavaScript/TypeScript, Vite, and Astro.
  //     //           </li>
  //     //           <li>
  //     //             Collaborate with designers, product owners, and stakeholders to
  //     //             create intuitive, responsive, and accessible user interfaces.
  //     //           </li>
  //     //           <li>
  //     //             Integrate REST APIs and configuration files (JSON) to deliver
  //     //             dynamic, data-driven content.
  //     //           </li>
  //     //           <li>
  //     //             Leverage AI-powered development tools (e.g., Bolt.new, Cursor,
  //     //             GitHub Copilot) to improve code efficiency and maintain code
  //     //             quality.
  //     //           </li>
  //     //           <li>
  //     //             Participate in cloud deployment workflows using Azure and AWS.
  //     //           </li>
  //     //           <li>
  //     //             Ensure all applications comply with WCAG accessibility
  //     //             standards, responsive design principles, and performance best
  //     //             practices.
  //     //           </li>
  //     //           <li>
  //     //             Engage in code reviews and contribute to a culture of technical
  //     //             excellence.
  //     //           </li>
  //     //         </ul>
  //     //        </div>
  //
  //     //         </div>
  //     //         <div className="text-center">
  //     //           <button
  //     //           onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
  //     //           className="text-[#1F2853] r font-medium text-[14px] mt-2 hover:underline outline-none"
  //     //         >
  //     //           {isDescriptionExpanded ? "Read less" : "Read more"}
  //     //         </button>
  //     //         </div>
  //     //       </div>
  //
  //     //       <div className="border-b  border-black/10 pb-5">
  //
  //     //          <span className="text-[19.5px] font-medium inline-block mb-3">
  //     //           About the Company
  //     //         </span>
  //
  //     //         <div className="flex items-start gap-4 mb-5">
  //     //         <div className="w-14 h-14  rounded-lg overflow-hidden shadow-md">
  //     //           <img
  //     //             src="https://joinhandshake-production.imgix.net/app/public/assets/institutions/430147/original/hs-emp-logo-data.?ixlib=rb-4.1.1&w=150&h=150&fit=crop&v=1557254669&s=7024750bee68482dda23d8cbd53917cf"
  //     //             alt=""
  //     //             className="w-full h-full overflow-hidden  rounded-lg"
  //     //           />
  //     //         </div>
  //     //         <div className="leading-6">
  //     //           <h4 className="text-[19px] font-semibold">
  //     //             New Jersey Department of Community Affairs
  //     //           </h4>
  //     //           <span className="text-[15px] font-medium">
  //     //             Government - Local, State & Federal
  //     //           </span>
  //     //         </div>
  //     //       </div>
  //
  //     //       </div>
  //
  //     //     </div>
  //     //   </div>
  //     // </>
  //
  //     <>
  //       <div className="bg-gray-100 py-5 px-3 sm:px-4">
  //         <div className="w-full max-w-[830px] bg-white p-4 sm:p-5 rounded-lg mx-auto mt-6 sm:mt-15">
  //           <div className="flex flex-col mb-5">
  //             <div className="flex items-center gap-3 mb-3">
  //               <img
  //                     src={internship?.companyLogo?.url || internship?.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(internship?.company || "Company")}&background=random`}
  //                     alt={internship?.company}
  //                     className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 overflow-hidden rounded-lg object-contain"
  //                   />
  //               <div className="min-w-0">
  //                 <span className="block text-[16px] sm:text-xl font-medium truncate">{internship?.company || "Company Name"}</span>
  //                 <span className="block text-[13.5px] text-gray-500 truncate">{internship?.industry || internship?.companyType || "Company Type"}</span>
  //               </div>
  //             </div>
  //             <h3 className="text-[20px] sm:text-[26px] font-semibold">
  //               {internship?.title || "Role Title"}
  //             </h3>
  //             {/* Their own row, below the title — crowding them next to the
  //                 company name is what made this cramped on narrow screens. */}
  //             <div className="mt-3 flex gap-2 sm:gap-3">
  //               <button
  //                 onClick={() => {
  //                   if (!user) {
  //                     navigate("/signup");
  //                   } else {
  //                     setSelectedOpportunity(internship);
  //                   }
  //                 }}
  //                 className="text-white py-1.5 px-4 text-[13px] sm:text-[14px] whitespace-nowrap rounded-md bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
  //                 Apply
  //               </button>
  //               <button className="flex items-center gap-1 border bg-white shadow border-black/5 py-1.5 px-4 text-[13px] sm:text-[14px] whitespace-nowrap rounded-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 e.stopPropagation();
  //                 setIsShareModalOpen(true);
  //               }}>
  //                 <IoMdShare />
  //                 Share
  //               </button>
  //             </div>
  //           </div>
  //
  //           <div className="space-y-2.5 mb-6">
  //             {internship?.experienceLevel && (
  //               <div className="flex flex-wrap items-start gap-2 sm:gap-3">
  //                 <div className="flex items-center font-semibold gap-1.5">
  //                   <IoBagOutline size={20} className="" />
  //                   <span>Exp:</span>
  //                 </div>
  //
  //                 <div className="">
  //                   {(() => {
  //                     const exp = internship?.experienceLevel;
  //                     const lower = exp.toLowerCase();
  //                     if (lower === "beginner") return "0-1 Years";
  //                     if (lower === "intermediate") return "1-3 Years";
  //                     if (lower === "advanced") return "3+ Years";
  //                     if (lower === "1 years") return "1 Year";
  //                     if (lower === "1 months") return "1 Month";
  //                     return exp;
  //                   })()}
  //                 </div>
  //               </div>
  //             )}
  //
  //             <div className="flex items-start gap-3">
  //               <div className="flex items-center font-semibold gap-1.5">
  //                 <GiTakeMyMoney size={20} />
  //                 <span>CTC:</span>
  //               </div>
  //
  //               <div>
  //                 <span>{formatStipendText(internship)} {formatStipendPeriod(internship) === 'Compensation details' ? '' : formatStipendPeriod(internship)}</span>
  //               </div>
  //             </div>
  //
  //             {(internship?.cityState || internship?.location) && (
  //               <div className="flex flex-wrap items-start gap-2 sm:gap-3">
  //                 <div className="flex items-center font-semibold gap-1.5">
  //                   <IoLocationOutline size={20} className="" />
  //                   <span>Location:</span>
  //                 </div>
  //
  //                 <div className="">{internship?.cityState || internship?.location}</div>
  //               </div>
  //             )}
  //
  //             {(internship?.workMode || internship?.internshipType) && (
  //               <div className="flex flex-wrap items-start gap-2 sm:gap-3">
  //                 <div className="flex items-center font-semibold gap-1.5">
  //                   <BsBuildings size={20} className="" />
  //                   <span>Role Type:</span>
  //                 </div>
  //
  //                 <div className="">{internship?.workMode || internship?.internshipType}</div>
  //               </div>
  //             )}
  //
  //             {internship?.openings && (
  //               <div className="flex flex-wrap items-start gap-2 sm:gap-3">
  //                 <div className="flex items-center font-semibold gap-1.5">
  //                   <FiUsers size={20} className="" />
  //                   <span>Openings:</span>
  //                 </div>
  //
  //                 <div className="">{internship?.openings}</div>
  //               </div>
  //             )}
  //           </div>
  //
  //           {/* <div className="flex items-center gap-4 mb-8">
  //
  //
  //           </div> */}
  //
  //           <div className="border-b border-t border-black/10 py-4 sm:py-5 mb-5">
  //             <span className="text-[17px] sm:text-[19.5px] font-medium inline-block mb-3">
  //               Job description
  //             </span>
  //             <div
  //               className={`text-slate-700 mt-3 text-[15px] whitespace-pre-wrap ${isDescriptionExpanded ? "" : "line-clamp-10 overflow-hidden"}`}
  //             >
  //               {internship?.aboutProgram && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     About the Role
  //                   </span>
  //                   <div
  //                     className="text-slate-700 mt-3 text-[14px] whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 space-y-2"
  //                     dangerouslySetInnerHTML={{
  //                       __html: String(internship.aboutProgram).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  //                     }}
  //                   />
  //                 </div>
  //               )}
  //
  //               {internship?.description && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Key Responsibilities
  //                   </span>
  //                   {renderListOrHTML(internship.description)}
  //                 </div>
  //               )}
  //
  //               {internship?.minimumRequirements && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Minimum Requirements
  //                   </span>
  //                   {renderListOrHTML(internship.minimumRequirements)}
  //                 </div>
  //               )}
  //
  //               {internship?.preferredQualifications && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Preferred Qualifications
  //                   </span>
  //                   {renderListOrHTML(internship.preferredQualifications)}
  //                 </div>
  //               )}
  //
  //               {internship?.whatYouWillLearn && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     What You Will Learn
  //                   </span>
  //                   {renderListOrHTML(internship.whatYouWillLearn)}
  //                 </div>
  //               )}
  //
  //               {((internship?.perks && internship.perks.length > 0) || (internship?.benefits && internship.benefits.length > 0)) && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Perks
  //                   </span>
  //                   <ul className="list-disc pl-5 space-y-2 text-[14px] px-4">
  //                     {(internship.perks?.length > 0 ? internship.perks : internship.benefits).map((perk, index) => (
  //                       <li key={index}>{perk}</li>
  //                     ))}
  //                   </ul>
  //                 </div>
  //               )}
  //
  //               {internship?.incentivesBonuses && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Incentives / Bonuses
  //                   </span>
  //                   {renderListOrHTML(internship.incentivesBonuses)}
  //                 </div>
  //               )}
  //
  //               {internship?.selectionRounds && internship.selectionRounds.length > 0 && (
  //                 <div className="mb-6">
  //                   <span className="text-[17px] font-medium inline-block mb-3">
  //                     Interview Process
  //                   </span>
  //                   <ul className="list-disc pl-5 space-y-2 text-[14px] px-4">
  //                     {internship.selectionRounds.map((round, index) => (
  //                       <li key={index}>{round}</li>
  //                     ))}
  //                   </ul>
  //                 </div>
  //               )}
  //             </div>
  //             <div className="text-center">
  //               <button
  //                 onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
  //                 className="text-[#1F2853] r font-medium text-[14px] mt-2 hover:underline outline-none"
  //               >
  //                 {isDescriptionExpanded ? "Read less" : "Read more"}
  //               </button>
  //             </div>
  //           </div>
  //
  //           <div className="">
  //             <span className="text-[17px] sm:text-[19.5px] font-medium inline-block mb-3">
  //               About the Company
  //             </span>
  //
  //             <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
  //               <div className="flex items-start gap-3 sm:gap-4">
  //                 <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden shadow-md">
  //                   <img
  //                     src={internship?.companyLogo?.url || internship?.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(internship?.company || "Company")}&background=random`}
  //                     alt={internship?.company}
  //                     className="w-full h-full overflow-hidden rounded-lg object-contain"
  //                   />
  //                 </div>
  //                 <div className="leading-6">
  //                   <h4 className="text-[16px] sm:text-[19px] font-semibold flex flex-wrap items-center gap-2 sm:gap-3">
  //                     {internship?.company}
  //                     {(internship?.headquarters || internship?.location || internship?.cityState) && (
  //                       <a
  //                         href={getMapSearchUrl(internship?.headquarters || internship?.location || internship?.cityState)}
  //                         target="_blank"
  //                         rel="noopener noreferrer"
  //                         className="text-[12px] font-bold text-[#1F2853] hover:underline bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1"
  //                       >
  //                         <IoLocationOutline size={14} /> Find on map
  //                       </a>
  //                     )}
  //                   </h4>
  //                   <span className="text-[14px] sm:text-[15px] font-medium">
  //                     {internship?.industry || internship?.companyType || "Company"}
  //                   </span>
  //                 </div>
  //               </div>
  //
  //               {/* Follow Us  Icons */}
  //               {(internship?.socialProofLinks?.instagram || internship?.socialProofLinks?.facebook || internship?.socialProofLinks?.twitter || internship?.socialProofLinks?.linkedin) && (
  //                 <div className="flex items-center gap-2 sm:gap-3">
  //                   <span className="hidden sm:inline text-[14px] font-medium text-gray-600">Follow us:</span>
  //                   <div className="flex gap-2">
  //                     {internship?.socialProofLinks?.instagram && (
  //                       <a href={internship.socialProofLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-black/10 rounded-md hover:bg-gray-50 transition-colors">
  //                         <FaInstagram size={16} className="text-[#FF4E45]" />
  //                       </a>
  //                     )}
  //                     {/* {internship?.socialProofLinks?.facebook && (
  //                       <a href={internship.socialProofLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-black/10 rounded-md hover:bg-gray-50 transition-colors">
  //                         <FaFacebookF size={16} className="text-[#1F2853]" />
  //                       </a>
  //                     )} */}
  //                     {internship?.socialProofLinks?.twitter && (
  //                       <a href={internship.socialProofLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-black/10 rounded-md hover:bg-gray-50 transition-colors">
  //                         <FaXTwitter  size={16} className="text-blue-700" />
  //                       </a>
  //                     )}
  //                     {internship?.socialProofLinks?.linkedin && (
  //                       <a href={internship.socialProofLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-black/10 rounded-md hover:bg-gray-50 transition-colors">
  //                         <FaLinkedinIn size={16} className="text-[#1F2853]" />
  //                       </a>
  //                     )}
  //                   </div>
  //                 </div>
  //               )}
  //             </div>
  //
  //             <div className="grid grid-cols-1 gap-5">
  //               {/* Hiring Manager */}
  //               {internship?.hiringManager && (
  //                 <div className="p-4 sm:p-6 shadow-sm border border-black/5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-50 to-transparent">
  //                   <div className="flex items-center gap-4">
  //                     <div className="w-12 h-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-[#1F2853]">
  //                       <FiUserCheck size={24} />
  //                     </div>
  //                     <div>
  //                       <h5 className="text-[16px] font-semibold text-slate-800">Hiring Manager</h5>
  //                       <span className="text-[13px] text-slate-500">Connect with the Point of Contact for this role</span>
  //                     </div>
  //                   </div>
  //                   <a
  //                     href={internship.hiringManager}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold  transition-colors hover:shadow-lg"
  //                   >
  //                     <FaLinkedinIn size={16} />
  //                     LinkedIn Profile
  //                   </a>
  //                 </div>
  //               )}
  //
  //               {/* Company Overview & Specialties */}
  //               {(internship?.companyOverview || internship?.specialties) && (
  //                 <div className="p-4 sm:p-6 shadow-sm border border-black/5 rounded-lg">
  //                   {internship?.companyOverview && (
  //                     <div className="mb-4">
  //                       <h5 className="text-[16px] font-semibold mb-2">Company Overview</h5>
  //                       <div
  //                         className="text-[14px] text-gray-700 whitespace-pre-wrap"
  //                         dangerouslySetInnerHTML={{
  //                           __html: String(internship.companyOverview).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  //                         }}
  //                       />
  //                     </div>
  //                   )}
  //                   {internship?.specialties && (
  //                     <div>
  //                       <h5 className="text-[16px] font-semibold mb-2">Specialties</h5>
  //                       <div
  //                         className="text-[14px] text-gray-700 whitespace-pre-wrap"
  //                         dangerouslySetInnerHTML={{
  //                           __html: String(internship.specialties).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
  //                         }}
  //                       />
  //                     </div>
  //                   )}
  //                 </div>
  //               )}
  //               {/* Company Details */}
  //               <div className="p-4 sm:p-6 shadow-sm border border-black/5 rounded-lg">
  //                 <h5 className="text-[18px] font-semibold mb-5">
  //                   Company Details
  //                 </h5>
  //                 <ul className="flex flex-col gap-4 sm:gap-5">
  //                   <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                     <div className="flex items-center gap-3">
  //                       <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                         <BsBuildings size={20} />
  //                       </div>
  //                       <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                         Company Name
  //                       </span>
  //                     </div>
  //                     <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                     <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                       {internship?.company || "Not specified"}
  //                     </span>
  //                   </li>
  //
  //                   {(internship?.industry || internship?.companyType) && (
  //                     <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                       <div className="flex items-center gap-3">
  //                         <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                           <MdBusiness size={20} />
  //                         </div>
  //                         <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                           Industry Type
  //                         </span>
  //                       </div>
  //                       <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                       <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                         {internship?.industry || internship?.companyType}
  //                       </span>
  //                     </li>
  //                   )}
  //
  //                   {(internship?.headquarters || internship?.location || internship?.cityState) && (
  //                     <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                       <div className="flex items-center gap-3">
  //                         <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                           <IoLocationOutline size={20} />
  //                         </div>
  //                         <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                           Headquarters
  //                         </span>
  //                       </div>
  //                       <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                       <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                         {internship?.headquarters || internship?.location || internship?.cityState}
  //                       </span>
  //                     </li>
  //                   )}
  //
  //                   {internship?.foundedYear && (
  //                     <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                       <div className="flex items-center gap-3">
  //                         <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                           <MdOutlineDateRange size={20} />
  //                         </div>
  //                         <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                           Founded Year
  //                         </span>
  //                       </div>
  //                       <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                       <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                         {internship?.foundedYear}
  //                       </span>
  //                     </li>
  //                   )}
  //
  //                   {internship?.numberOfEmployees && (
  //                     <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                       <div className="flex items-center gap-3">
  //                         <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                           <FiUsers size={20} />
  //                         </div>
  //                         <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                           Employees
  //                         </span>
  //                       </div>
  //                       <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                       <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                         {internship?.numberOfEmployees}
  //                       </span>
  //                     </li>
  //                   )}
  //
  //                   {internship?.companyClassification && (
  //                     <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 w-full">
  //                       <div className="flex items-center gap-3">
  //                         <div className=" rounded-md text-gray-500 flex-shrink-0">
  //                           <MdOutlineCorporateFare size={20} />
  //                         </div>
  //                         <span className="text-[13.5px] text-gray-500 font-medium whitespace-nowrap">
  //                           Company Size
  //                         </span>
  //                       </div>
  //                       <div className="hidden flex-grow border-b border-black/10 mx-4 sm:block"></div>
  //                       <span className="text-[14.5px] font-medium text-gray-900 sm:whitespace-nowrap sm:text-right">
  //                         {internship.companyClassification}
  //                       </span>
  //                     </li>
  //                   )}
  //
  //
  //                 </ul>
  //               </div>
  //
  //               {/* Social Accounts */}
  //               {/* <div className="p-6 shadow-sm border border-black/5 rounded-lg flex flex-col">
  //                 <h5 className="text-[18px] font-semibold mb-5">
  //                   Social Accounts
  //                 </h5>
  //                 <div className="flex flex-col gap-3 flex-grow">
  //                   <a
  //                     href={internship?.social?.instagram || "#"}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex items-center gap-3 p-3 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
  //                   >
  //                     <FaInstagram size={22} className="text-[#FF4E45]" />
  //                     <span className="text-[15px] font-medium text-gray-700">
  //                       Instagram
  //                     </span>
  //                   </a>
  //                   <a
  //                     href={internship?.social?.facebook || "#"}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex items-center gap-3 p-3 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
  //                   >
  //                     <FaFacebookF size={22} className="text-[#1F2853]" />
  //                     <span className="text-[15px] font-medium text-gray-700">
  //                       Facebook
  //                     </span>
  //                   </a>
  //                   <a
  //                     href={internship?.social?.twitter || "#"}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex items-center gap-3 p-3 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
  //                   >
  //                     <FaTwitter size={22} className="text-[#1F2853]" />
  //                     <span className="text-[15px] font-medium text-gray-700">
  //                       Twitter
  //                     </span>
  //                   </a>
  //                   <a
  //                     href={internship?.social?.linkedin || "#"}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex items-center gap-3 p-3 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
  //                   >
  //                     <FaLinkedinIn size={22} className="text-[#1F2853]" />
  //                     <span className="text-[15px] font-medium text-gray-700">
  //                       LinkedIn
  //                     </span>
  //                   </a>
  //                 </div>
  //               </div> */}
  //
  //               {/*Company Location */}
  //               {/* <div className="p-6 shadow-sm border border-black/5 rounded-lg flex flex-col">
  //                 <h5 className="text-[18px] font-semibold mb-5">
  //                   Company Location
  //                 </h5>
  //                 <div className="w-full h-full min-h-[230px] rounded-lg overflow-hidden border border-black/5 bg-gray-50 flex-grow">
  //                   <iframe
  //                     title="Company Location"
  //                     width="100%"
  //                     height="100%"
  //                     style={{ border: 0 }}
  //                     loading="lazy"
  //                     allowFullScreen
  //                     src={`https://www.google.com/maps?q=${encodeURIComponent(internship?.headquarters || internship?.location || internship?.cityState)}&output=embed`}
  //                   ></iframe>
  //                 </div>
  //               </div> */}
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //       <ApplicationFormModal
  //         isOpen={Boolean(selectedOpportunity)}
  //         opportunityTitle={selectedOpportunity?.title}
  //         opportunity={selectedOpportunity}
  //         onClose={() => setSelectedOpportunity(null)}
  //       />
  //       <ShareModal
  //         isOpen={isShareModalOpen}
  //         onClose={() => setIsShareModalOpen(false)}
  //         eventTitle={internship?.title || "Internship"}
  //         shareUrl={window.location.href}
  //       />
  //     </>
  //   );
};

export default InternshipDetailsPage;
