import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApplicationFormBuilder from "../ApplicationFormBuilder";
import { FiArrowLeft, FiEdit2, FiGrid, FiPieChart, FiEyeOff, FiFileText, FiBriefcase, FiShield, FiUsers, FiLogOut, FiCheckCircle } from "react-icons/fi";
import { LayoutPanelLeft, LocateIcon, Image as ImageIcon, GraduationCap } from "lucide-react";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { useFormBuilder, FormBuilderProvider } from "../context/FormBuilderContext";
import { Toaster } from "../ui/toaster";

/**
 * Inner component that consumes the FormBuilder context.
 * This MUST be a separate component so that useFormBuilder is called
 * inside the FormBuilderProvider tree.
 */
const getMenuIcon = (key, size) => {
  const icons = {
    Internship: <FiGrid size={size} />,
    Apprenticeships: <FiBriefcase size={size} />,
    Jobs: <FiBriefcase size={size} />,
    Masterclasses: <FiUsers size={size} />,
    Bootcamps: <FiCheckCircle size={size} />,
    "Certificate Programs": <FiFileText size={size} />,
    "Post Graduate Programs": <FiPieChart size={size} />,
    "Degree Programs": <FiGrid size={size} />,
    "Global Program": <FiPieChart size={size} />,
    University: <GraduationCap size={size} />,
    "All Application": <LayoutPanelLeft  size={size} />,
    "Closed Application": <FiEyeOff size={size} />,
    Applications: <FiFileText size={size} />,
    Overview: <FiPieChart size={size} />,
    "Post Opportunity": <FiBriefcase size={size} />,
    Admins: <FiShield size={size} />,
    Users: <FiUsers size={size} />,
    Mentors: <FiUsers size={size} />,
    Location: <LocateIcon size={size} />,
    Gallery: <ImageIcon size={size} />,
    "Program Details": <FiEdit2 size={size} />
  };
  return icons[key] || <FiGrid size={size} />;
};

const ApplicationFormBuilderPageContent = () => {
  const { id, templateId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, logout } = useOpportunities();
  const { formState, setFormState, handlers, isPublishing } = useFormBuilder();
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  
  const savedPreferences = (() => {
    try {
      return JSON.parse(localStorage.getItem("admin_sidebar_preferences") || '["Internship", "Jobs"]');
    } catch {
      return ["Internship", "Jobs"];
    }
  })();

  const PROGRAM_ITEMS = [
    { key: "Internship", label: "Internships" },
    { key: "Apprenticeships", label: "Apprenticeships" },
    { key: "Jobs", label: "Jobs" },
    { key: "Masterclasses", label: "Master Class" },
    { key: "Bootcamps", label: "Workshops & Bootcamps" },
    { key: "Certificate Programs", label: "Certificate Programs" },
    { key: "Post Graduate Programs", label: "Post Graduate Programs" },
    { key: "Degree Programs", label: "Degree Programs" },
    { key: "Global Program", label: "Global Programs" },
    { key: "University", label: "University" },
  ];

  let menuItems = [];

  if (isSuperAdmin) {
    menuItems = [
      { key: "Overview", label: "Overview" },
      { key: "Admins", label: "Admins" },
      { key: "Users", label: "Users" },
      { key: "Mentors", label: "Mentors" },
      { key: "Location", label: "Location" },
      { key: "Gallery", label: "Gallery" },
      { key: "Program Details", label: "Program Details" },
      ...PROGRAM_ITEMS,
      { key: "All Application", label: "All Application" },
      { key: "Closed Application", label: "Closed Application" },
    ];
  } else {
    const activeProgramItems = PROGRAM_ITEMS.filter(item => savedPreferences.includes(item.key));
    menuItems = [
      { key: "Program Details", label: "Program Details" },
      ...activeProgramItems,
      { key: "Closed Application", label: "Closed Application" },
      { key: "Applications", label: "Applications" },
    ];
  }

  const handleSidebarClick = (key) => {
    const dashboardPath = isSuperAdmin ? "/super-admin-dashboard" : user?.role === "mentor" ? "/mentor-dashboard" : "/admin-dashboard";
    if (key === "Program Details") {
      navigate(dashboardPath, { state: { editId: id, activeSection: "Internship" } });
      return;
    }
    navigate(dashboardPath, { state: { activeSection: key } });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="w-full">
        <div className={`flex flex-col xl:flex-row transition-all duration-300 ease-in-out h-full`}>
          {/* SIDEBAR (AUTO-EXPANDING) */}
          <aside 
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
            className={`bg-[#EEF2FF] border-r border-[#E2E8F0] p-4 h-screen sticky top-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-sm shrink-0 ${isSidebarHovered ? 'items-start w-full xl:w-[220px]' : 'items-center w-full xl:w-[80px]'}`}
          >
            <div className={`mb-8 transition-all duration-300 ${isSidebarHovered ? 'w-full' : ''}`}>
              {isSidebarHovered ? (
                <div className="flex flex-col">
                  <p className="text-slate-900 text-xl font-semibold whitespace-nowrap">
                    {user?.role === "mentor" ? "Mentor Control" : "Admin Control"}
                  </p>
                  <p className="text-[10px] tracking-[0.16em] text-slate-500 mt-1 font-semibold">PORTAL</p>
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FiShield className="text-white" size={20} />
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-2 w-full overflow-y-auto custom-scrollbar ${isSidebarHovered ? '' : 'items-center'}`}>
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  title={!isSidebarHovered ? item.label : ""}
                  onClick={() => handleSidebarClick(item.key)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl transition-all group relative ${isSidebarHovered ? 'w-full px-4 py-3 justify-start' : 'w-8 h-8 justify-center'} ${isSidebarHovered ? 'text-slate-700 hover:bg-white hover:text-red-600' : 'text-slate-600 hover:bg-white/70 hover:text-red-600'}`}
                >
                  <div className="shrink-0">
                    {getMenuIcon(item.key, isSidebarHovered ? 18 : 20)}
                  </div>
                  
                  {isSidebarHovered && (
                    <span className="text-sm font-semibold whitespace-nowrap transition-all duration-300 opacity-100">
                      {item.label}
                    </span>
                  )}

                  {!isSidebarHovered && (
                    <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className={`mt-auto pt-4 border-t border-[#EEF2FF] w-full flex ${isSidebarHovered ? 'justify-start' : 'justify-center'}`}>
              <button
                type="button"
                title={!isSidebarHovered ? "Logout" : ""}
                onClick={handleLogout}
                className={`flex shrink-0 items-center gap-3 rounded-xl border border-slate-300 transition-all group relative ${isSidebarHovered ? 'w-full px-4 py-3 justify-start' : 'w-12 h-12 justify-center'} ${isSidebarHovered ? 'text-slate-700 hover:bg-white hover:text-rose-600' : 'text-slate-700 hover:bg-white/80 hover:text-rose-600'}`}
              >
                <div className="shrink-0">
                  <FiLogOut size={isSidebarHovered ? 16 : 18} />
                </div>
                
                {isSidebarHovered && (
                  <span className="text-sm font-semibold whitespace-nowrap transition-all duration-300 opacity-100">
                    Logout
                  </span>
                )}

                {!isSidebarHovered && (
                  <span className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Logout
                  </span>
                )}
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="bg-white overflow-hidden h-screen flex-1 w-full flex flex-col">
            <ApplicationFormBuilder programId={id} initialTemplateId={templateId} />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

/**
 * Main Page Component.
 * Wraps the content in the FormBuilderProvider.
 */
const ApplicationFormBuilderPage = () => {
  const { id, templateId } = useParams();

  return (
    <FormBuilderProvider internshipId={templateId ? null : id}>
      <ApplicationFormBuilderPageContent />
    </FormBuilderProvider>
  );
};

export default ApplicationFormBuilderPage;
