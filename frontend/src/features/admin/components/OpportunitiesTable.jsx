import React, { useEffect, useState } from "react";
import { FiFileText, FiTrash2, FiEdit2, FiCheck, FiX, FiCheckCircle, FiEye, FiEyeOff, FiExternalLink, FiKey, FiGlobe, FiPlay } from "react-icons/fi";
import { useAdminContext } from "../context/AdminContext";
import { API_BASE_URL, getErrorMessage } from "../../../services/apiClient";
import {
  bulkDeleteUniversityPrograms,
  deleteUniversityProgram,
  getUniversityPrograms,
  getUniversityProgramById,
} from "../../../services/universityProgramAPI";
import {
  bulkDeleteDegreePrograms,
  deleteDegreeProgram,
  getDegreePrograms,
  getDegreeProgramById,
} from "../../../services/degreeProgramAPI";
import UniversityProgramForm from "./UniversityProgramForm";
import DegreeProgramCMSForm from "./DegreeProgramForm";
import JobForm from "./JobForm";
import ExportSheetConfig from "./ExportSheetConfig";

const OpportunitiesTable = () => {
  const [showCreationTypeModal, setShowCreationTypeModal] = useState(false);
  const [masterclassFilter, setMasterclassFilter] = useState("All");
  const [statusView, setStatusView] = useState("active");
  // Jobs keeps the shared Internship backend/collection (type: "Jobs") — only the admin
  // form UI is dedicated, so no separate list state is needed like University/Degree Programs.
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  // New, richer University Program module gets its own dedicated form instead of the shared OpportunityForm,
  // and its own list state since it lives in a separate collection (/api/university-programs), not `opportunities`.
  const [showUniversityProgramForm, setShowUniversityProgramForm] = useState(false);
  const [universityPrograms, setUniversityPrograms] = useState([]);
  const [universityProgramsLoading, setUniversityProgramsLoading] = useState(false);
  const [universityProgramsError, setUniversityProgramsError] = useState("");
  const [deletingUniversityProgramId, setDeletingUniversityProgramId] = useState("");
  const [editingUniversityProgram, setEditingUniversityProgram] = useState(null);
  const [loadingEditUniversityProgramId, setLoadingEditUniversityProgramId] = useState("");
  const [selectedUniversityProgramIds, setSelectedUniversityProgramIds] = useState([]);
  // Degree Program CMS gets the same dedicated-form + dedicated-list treatment as University,
  // since it now uses the same richer card+detail Program schema (paginated {data, pagination}).
  const [showDegreeProgramCMSForm, setShowDegreeProgramCMSForm] = useState(false);
  const [degreePrograms, setDegreePrograms] = useState([]);
  const [degreeProgramsLoading, setDegreeProgramsLoading] = useState(false);
  const [degreeProgramsError, setDegreeProgramsError] = useState("");
  const [deletingDegreeProgramId, setDeletingDegreeProgramId] = useState("");
  const [editingDegreeProgram, setEditingDegreeProgram] = useState(null);
  const [loadingEditDegreeProgramId, setLoadingEditDegreeProgramId] = useState("");
  const [selectedDegreeProgramIds, setSelectedDegreeProgramIds] = useState([]);
  const {
    isSuperDashboard,
    user, isAdmin, isSuperAdmin, isBootstrapping, isImpersonating,
    filteredOpportunities, sorted, applications,
    scopedApplications, paginatedApplications, totalPages, recentApplications,
    form, editingId, showOpportunityForm, requiredSkillInputs, benefitInputs,
    currentStep, setCurrentStep, showPreviewModal, showSuccessMessage,
    activeSection,
    isInternshipPanel, isGlobalProgramPanel, isJobsPanel, isBootcampsPanel,
    isMasterclassesPanel, isDegreeProgramsPanel, isPGProgramsPanel, isClosedApplicationPanel, isAllApplicationPanel,
    isSuperStatsSection, isSuperPostSection, isSuperUsersSection, isSuperAdminsSection,
    isSuperApprovedRequestsSection, isAnySuperDirectorySection,
    currentPage, setCurrentPage, itemsPerPage, totalClosedPages, paginatedClosedItems,
    closedApplicationView, setClosedApplicationView, closedApplicationItems, closedApplicationTitle,
    selectedIds, setSelectedIds,
    directory,
    userCount, adminCount, superAdminCount, totalAccountCount, userPercent, adminPercent, superAdminPercent,
    isWhatsAppConnected, whatsAppStatusText,
    passwordEditorAdminId, adminPasswordForm, showAdminPassword,
    changingPasswordAdminId, passwordChangeMessage, adminApprovalMessage, approvingAdminId,
    visiblePasswords, openingAdminId, deletingUserId,
    selectedApplication, setSelectedApplication,
    statusChangingId, statusChangeMessage,
    error, busy,
    resolveOwnerName,
    handleChange, handleLogoChange, handleRequiredSkillChange, addRequiredSkillInput, removeRequiredSkillInput,
    handleBenefitChange, addBenefitInput, resetForm,
    handleOpenCreateForm, handleOpenCreateShortVideo, handleSuperCreateInternship, handleSuperCreateGlobalProgram,
    handleSubmit, handleConfirmSubmit,
    handleEdit, handleViewResponses, handleDelete, handleBulkDelete,
    handleSelectAll, handleSelectItem,
    handleViewResume,
    handleSectionChange, handleLogout, handleReturnToSuperAdmin,
    handleOpenAdminDashboard, handleApproveAdminAccess, handleDeleteAccount,
    handleStartPasswordEditor, handleCancelPasswordEditor, toggleAdminPasswordVisibility,
    handleAdminPasswordInputChange, handleNotifyAdminToggle, handleChangeAdminPassword,
    handleStatusChange, handleExport, fetchDecryptedPassword, isOpportunityClosed,
    exportSheetMessage, exportSheetUrl, handleSyncToSheet, sheetSyncBusy,
  } = useAdminContext();

  // Sections whose backend export supports the Google Sheet sync.
  const SHEET_SYNC_SECTIONS = ["Internship", "Jobs", "Apprenticeships", "Global Program", "Bootcamps", "Degree Programs","Certificate Program"];

  useEffect(() => {
    setStatusView("active");
  }, [activeSection]);

  const refreshUniversityPrograms = async () => {
    try {
      setUniversityProgramsLoading(true);
      setUniversityProgramsError("");
      const result = await getUniversityPrograms();
      setUniversityPrograms(result?.data || []);
    } catch (apiError) {
      setUniversityProgramsError(getErrorMessage(apiError, "Failed to load university programs."));
    } finally {
      setUniversityProgramsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "University") {
      refreshUniversityPrograms();
    }
  }, [activeSection]);

  const handleEditOpportunity = (item) => {
    if (item.type === "Jobs") {
      setEditingJob(item);
      setShowJobForm(true);
      return;
    }
    handleEdit(item);
  };

  const handleDeleteUniversityProgram = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this university program?");
    if (!confirmed) return;
    try {
      setDeletingUniversityProgramId(id);
      await deleteUniversityProgram(id);
      setUniversityPrograms((prev) => prev.filter((item) => item._id !== id));
    } catch (apiError) {
      setUniversityProgramsError(getErrorMessage(apiError, "Failed to delete university program."));
    } finally {
      setDeletingUniversityProgramId("");
    }
  };

  const handleEditUniversityProgram = async (id) => {
    try {
      setUniversityProgramsError("");
      setLoadingEditUniversityProgramId(id);
      const fullProgram = await getUniversityProgramById(id);
      setEditingUniversityProgram(fullProgram);
      setShowUniversityProgramForm(true);
    } catch (apiError) {
      setUniversityProgramsError(getErrorMessage(apiError, "Failed to load university program for editing."));
    } finally {
      setLoadingEditUniversityProgramId("");
    }
  };

  const handleSelectAllUniversityPrograms = () => {
    setSelectedUniversityProgramIds((prev) =>
      prev.length === universityPrograms.length ? [] : universityPrograms.map((item) => item._id)
    );
  };

  const handleSelectUniversityProgram = (id) => {
    setSelectedUniversityProgramIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteUniversityPrograms = async () => {
    if (selectedUniversityProgramIds.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUniversityProgramIds.length} selected university program(s)?`
    );
    if (!confirmed) return;
    try {
      setUniversityProgramsError("");
      await bulkDeleteUniversityPrograms(selectedUniversityProgramIds);
      setUniversityPrograms((prev) => prev.filter((item) => !selectedUniversityProgramIds.includes(item._id)));
      setSelectedUniversityProgramIds([]);
    } catch (apiError) {
      setUniversityProgramsError(getErrorMessage(apiError, "Failed to delete selected university programs."));
    }
  };

  const refreshDegreePrograms = async () => {
    try {
      setDegreeProgramsLoading(true);
      setDegreeProgramsError("");
      const result = await getDegreePrograms();
      setDegreePrograms(result?.data || []);
    } catch (apiError) {
      setDegreeProgramsError(getErrorMessage(apiError, "Failed to load degree programs."));
    } finally {
      setDegreeProgramsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "Degree Programs") {
      refreshDegreePrograms();
    }
  }, [activeSection]);

  const handleDeleteDegreeProgram = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this degree program?");
    if (!confirmed) return;
    try {
      setDeletingDegreeProgramId(id);
      await deleteDegreeProgram(id);
      setDegreePrograms((prev) => prev.filter((item) => item._id !== id));
    } catch (apiError) {
      setDegreeProgramsError(getErrorMessage(apiError, "Failed to delete degree program."));
    } finally {
      setDeletingDegreeProgramId("");
    }
  };

  const handleEditDegreeProgram = async (id) => {
    try {
      setDegreeProgramsError("");
      setLoadingEditDegreeProgramId(id);
      const fullProgram = await getDegreeProgramById(id);
      setEditingDegreeProgram(fullProgram);
      setShowDegreeProgramCMSForm(true);
    } catch (apiError) {
      setDegreeProgramsError(getErrorMessage(apiError, "Failed to load degree program for editing."));
    } finally {
      setLoadingEditDegreeProgramId("");
    }
  };

  const handleSelectAllDegreePrograms = () => {
    setSelectedDegreeProgramIds((prev) =>
      prev.length === degreePrograms.length ? [] : degreePrograms.map((item) => item._id)
    );
  };

  const handleSelectDegreeProgram = (id) => {
    setSelectedDegreeProgramIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteDegreePrograms = async () => {
    if (selectedDegreeProgramIds.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDegreeProgramIds.length} selected degree program(s)?`
    );
    if (!confirmed) return;
    try {
      setDegreeProgramsError("");
      await bulkDeleteDegreePrograms(selectedDegreeProgramIds);
      setDegreePrograms((prev) => prev.filter((item) => !selectedDegreeProgramIds.includes(item._id)));
      setSelectedDegreeProgramIds([]);
    } catch (apiError) {
      setDegreeProgramsError(getErrorMessage(apiError, "Failed to delete selected degree programs."));
    }
  };

  const closedApplicationContent = isClosedApplicationPanel ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setClosedApplicationView("Internship");
              setSelectedIds([]);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              closedApplicationView === "Internship"
                ? "bg-[#1F2853] text-white"
                : "bg-white text-slate-700 border border-[#E2E8F0]"
            }`}
          >
            Closed Internship
          </button>
          <button
            type="button"
            onClick={() => {
              setClosedApplicationView("Global Program");
              setSelectedIds([]);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              closedApplicationView === "Global Program"
                ? "bg-[#1F2853] text-white"
                : "bg-white text-slate-700 border border-[#E2E8F0]"
            }`}
          >
            Closed Global Program
          </button>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center gap-2 shadow-sm"
          >
            <FiTrash2 size={14} />
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {closedApplicationTitle}
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {closedApplicationItems.length} items
          </span>
        </div>

        {closedApplicationItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No closed {closedApplicationView.toLowerCase()} found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#EEF2FF] text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={
                        closedApplicationItems.length > 0 &&
                        selectedIds.length === closedApplicationItems.length
                      }
                      onChange={() => handleSelectAll(closedApplicationItems)}
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created By</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2FF]">
                {paginatedClosedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.company}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.deadline
                        ? new Date(item.deadline).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-red-100 text-red-700">
                        Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {resolveOwnerName(item)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEditOpportunity(item)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalClosedPages > 1 && (
          <div className="mt-6 flex items-center  justify-center border-t border-[#EEF2FF] p-4 bg-white rounded-b-xl">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center px-4">
                <span className="text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalClosedPages}
                </span>
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalClosedPages))
                }
                disabled={currentPage === totalClosedPages}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const showOpportunitiesTable = ["Internship", "Apprenticeships", "Jobs", "Masterclasses", "Bootcamps", "Certificate Programs", "Post Graduate Programs", "Degree Programs", "Global Program", "University"].includes(activeSection) || isClosedApplicationPanel || isAllApplicationPanel;

  if (!showOpportunitiesTable) return null;

  let displayOpportunities = filteredOpportunities.filter((item) =>
    statusView === "inactive" ? isOpportunityClosed(item) : !isOpportunityClosed(item)
  );
  if (isMasterclassesPanel && masterclassFilter !== "All") {
    displayOpportunities = displayOpportunities.filter(item => {
      const isShortVideo = item.isShortVideo || item.masterclassType === "Short Video" || item.category === "Short Video";
      return masterclassFilter === "Short Video" ? isShortVideo : !isShortVideo;
    });
  }
  const activeCount = filteredOpportunities.filter((item) => !isOpportunityClosed(item)).length;
  const inactiveCount = filteredOpportunities.filter((item) => isOpportunityClosed(item)).length;

  return (
    <>
                  {showUniversityProgramForm && (
                    <UniversityProgramForm
                      initialProgram={editingUniversityProgram}
                      onClose={() => {
                        setShowUniversityProgramForm(false);
                        setEditingUniversityProgram(null);
                        refreshUniversityPrograms();
                      }}
                      // Stays open after save so the admin can continue to the Application Form step;
                      // refresh the list now so the new program shows up once they do close it.
                      onSaved={refreshUniversityPrograms}
                    />
                  )}
                  {showDegreeProgramCMSForm && (
                    <DegreeProgramCMSForm
                      initialProgram={editingDegreeProgram}
                      onClose={() => {
                        setShowDegreeProgramCMSForm(false);
                        setEditingDegreeProgram(null);
                        refreshDegreePrograms();
                      }}
                      onSaved={refreshDegreePrograms}
                    />
                  )}
                  {showJobForm && (
                    <JobForm
                      initialJob={editingJob}
                      onClose={() => {
                        setShowJobForm(false);
                        setEditingJob(null);
                      }}
                      onSaved={() => {
                        setShowJobForm(false);
                        setEditingJob(null);
                      }}
                    />
                  )}
                  {!showOpportunityForm && !showUniversityProgramForm && !showDegreeProgramCMSForm && !showJobForm && (
                    <div className="bg-white  border border-[#E2E8F0] p-4 sm:p-5">
                      <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-semibold text-slate-800">
                          {activeSection === "Internship"
                            ? "Internship Opportunities"
                            : activeSection === "Global Program"
                              ? "Global Program Opportunities"
                              : activeSection === "Jobs"
                                ? "Job Opportunities"
                                : activeSection === "Apprenticeships"
                                  ? "Apprenticeship Opportunities"
                                  : activeSection === "Masterclasses"
                                    ? "Master Class Opportunities"
                                    : activeSection === "Bootcamps"
                                      ? "Bootcamp Opportunities"
                                      : activeSection === "Certificate Programs"
                                        ? "Certificate Program Opportunities"
                                        : activeSection === "Post Graduate Programs"
                                          ? "Post Graduate Program Opportunities"
                                          : activeSection === "Degree Programs"
                                            ? "Degree Program Opportunities"
                                              : activeSection === "University"
                                                ? "University Programs"
                                                : activeSection === "Closed Application"
                                                  ? "Closed Application"
                                                  : activeSection === "All Application"
                                                    ? "All Published Opportunities"
                                                    : "Application Forms"}
                        </h2>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                          {!isClosedApplicationPanel && !isAllApplicationPanel && (
                            <>
                              <button
                                type="button"
                                onClick={
                                  activeSection === "Masterclasses"
                                    ? () => setShowCreationTypeModal(true)
                                    : activeSection === "University"
                                      ? () => { setEditingUniversityProgram(null); setShowUniversityProgramForm(true); }
                                      : activeSection === "Degree Programs"
                                        ? () => { setEditingDegreeProgram(null); setShowDegreeProgramCMSForm(true); }
                                        : activeSection === "Jobs"
                                          ? () => { setEditingJob(null); setShowJobForm(true); }
                                          : handleOpenCreateForm
                                }
                                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-blue-700 text-white text-sm font-semibold"
                              >
                                {activeSection === "Internship"
                                  ? "Create Internship"
                                  : activeSection === "Global Program"
                                    ? "Create Global Program"
                                    : activeSection === "Jobs"
                                      ? "Create Job"
                                      : activeSection === "Apprenticeships"
                                        ? "Create Apprenticeship"
                                        : activeSection === "Masterclasses"
                                          ? "Create Master Class"
                                          : activeSection === "Bootcamps"
                                            ? "Create Bootcamp"
                                            : activeSection === "Certificate Programs"
                                              ? "Create Certificate Program"
                                              : activeSection === "Post Graduate Programs"
                                                ? "Create PG Program"
                                                : activeSection === "Degree Programs"
                                                  ? "Create Degree Program"
                                                    : activeSection === "University"
                                                      ? "Create University Program"
                                                      : "Create Opportunity"}
                              </button>

                            

                              {activeSection === "University" && selectedUniversityProgramIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleBulkDeleteUniversityPrograms}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                                >
                                  <FiTrash2 size={14} />
                                  Delete Selected ({selectedUniversityProgramIds.length})
                                </button>
                              )}
                              {activeSection === "Degree Programs" && selectedDegreeProgramIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleBulkDeleteDegreePrograms}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                                >
                                  <FiTrash2 size={14} />
                                  Delete Selected ({selectedDegreeProgramIds.length})
                                </button>
                              )}
                              {activeSection !== "University" && activeSection !== "Degree Programs" && selectedIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleBulkDelete}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                                >
                                  <FiTrash2 size={14} />
                                  Delete Selected ({selectedIds.length})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleExport("csv")}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-slate-100 text-slate-900 text-sm font-semibold"
                              >
                                Download CSV
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExport("xlsx")}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold"
                              >
                                Download Excel
                              </button>
                              {SHEET_SYNC_SECTIONS.includes(activeSection) && (
                                <button
                                  type="button"
                                  onClick={handleSyncToSheet}
                                  disabled={sheetSyncBusy}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  {sheetSyncBusy ? "Updating..." : "Update Google Sheet"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {SHEET_SYNC_SECTIONS.includes(activeSection) && (
                        <div className="mb-3">
                          <ExportSheetConfig />
                        </div>
                      )}

                      {exportSheetMessage && (
                        <p className="mb-3 text-xs text-slate-500 break-words">
                          {exportSheetMessage}
                          {exportSheetUrl && (
                            <>
                              {" "}
                              <a
                                href={exportSheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-emerald-700 underline"
                              >
                                Open Google Sheet
                              </a>
                            </>
                          )}
                        </p>
                      )}

                      {activeSection === "University" ? (
                        universityProgramsError ? (
                          <p className="text-red-600 text-sm">{universityProgramsError}</p>
                        ) : universityProgramsLoading ? (
                          <p className="text-slate-500">Loading university programs...</p>
                        ) : universityPrograms.length === 0 ? (
                          <p className="text-slate-500">No opportunities added yet.</p>
                        ) : (
                          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left border-b border-[#EEF2FF] text-slate-500 bg-slate-50/50">
                                  <th className="py-3 px-4 w-10 text-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-slate-300"
                                      checked={universityPrograms.length > 0 && selectedUniversityProgramIds.length === universityPrograms.length}
                                      onChange={handleSelectAllUniversityPrograms}
                                    />
                                  </th>
                                  <th className="py-3 px-4 font-semibold">Program Name</th>
                                  <th className="py-3 px-4 font-semibold">Degree</th>
                                  <th className="py-3 px-4 font-semibold">University</th>
                                  <th className="py-3 px-4 font-semibold">Total Fee</th>
                                  <th className="py-3 px-4 font-semibold">Created</th>
                                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EEF2FF]">
                                {universityPrograms.map((program) => (
                                  <tr
                                    key={program._id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="rounded border-slate-300"
                                        checked={selectedUniversityProgramIds.includes(program._id)}
                                        onChange={() => handleSelectUniversityProgram(program._id)}
                                      />
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-800">{program.programName}</td>
                                    <td className="py-3 px-4 text-slate-600">{program.degree}</td>
                                    <td className="py-3 px-4 text-slate-600">{program.university?.name}</td>
                                    <td className="py-3 px-4 text-slate-600">
                                      {program.fees?.totalFee != null ? `₹${Number(program.fees.totalFee).toLocaleString("en-IN")}` : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500">
                                      {program.createdAt ? new Date(program.createdAt).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          type="button"
                                          onClick={() => handleEditUniversityProgram(program._id)}
                                          disabled={loadingEditUniversityProgramId === program._id}
                                          className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={16} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUniversityProgram(program._id)}
                                          disabled={deletingUniversityProgramId === program._id}
                                          className="text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : activeSection === "Degree Programs" ? (
                        degreeProgramsError ? (
                          <p className="text-red-600 text-sm">{degreeProgramsError}</p>
                        ) : degreeProgramsLoading ? (
                          <p className="text-slate-500">Loading degree programs...</p>
                        ) : degreePrograms.length === 0 ? (
                          <p className="text-slate-500">No opportunities added yet.</p>
                        ) : (
                          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left border-b border-[#EEF2FF] text-slate-500 bg-slate-50/50">
                                  <th className="py-3 px-4 w-10 text-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-slate-300"
                                      checked={degreePrograms.length > 0 && selectedDegreeProgramIds.length === degreePrograms.length}
                                      onChange={handleSelectAllDegreePrograms}
                                    />
                                  </th>
                                  <th className="py-3 px-4 font-semibold">Program Name</th>
                                  <th className="py-3 px-4 font-semibold">Degree</th>
                                  <th className="py-3 px-4 font-semibold">University</th>
                                  <th className="py-3 px-4 font-semibold">Total Fee</th>
                                  <th className="py-3 px-4 font-semibold">Status</th>
                                  <th className="py-3 px-4 font-semibold">Created</th>
                                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EEF2FF]">
                                {degreePrograms.map((program) => (
                                  <tr
                                    key={program._id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="rounded border-slate-300"
                                        checked={selectedDegreeProgramIds.includes(program._id)}
                                        onChange={() => handleSelectDegreeProgram(program._id)}
                                      />
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-800">{program.programName}</td>
                                    <td className="py-3 px-4 text-slate-600">{program.degree}</td>
                                    <td className="py-3 px-4 text-slate-600">{program.university?.name}</td>
                                    <td className="py-3 px-4 text-slate-600">
                                      {program.fees?.totalFee != null ? `₹${Number(program.fees.totalFee).toLocaleString("en-IN")}` : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 capitalize">{program.status}</td>
                                    <td className="py-3 px-4 text-slate-500">
                                      {program.createdAt ? new Date(program.createdAt).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          type="button"
                                          onClick={() => handleEditDegreeProgram(program._id)}
                                          disabled={loadingEditDegreeProgramId === program._id}
                                          className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={16} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDegreeProgram(program._id)}
                                          disabled={deletingDegreeProgramId === program._id}
                                          className="text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : isClosedApplicationPanel ? (
                        closedApplicationContent
                      ) : filteredOpportunities.length === 0 ? (
                        <p className="text-slate-500">
                          No opportunities added yet.
                        </p>
                      ) : (
                        <>
                        {/* Creation Type Modal */}
                        {showCreationTypeModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-[#E2E8F0]">
                              <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
                                <h3 className="text-lg font-semibold text-slate-800">Choose Creation Type</h3>
                                <button 
                                  onClick={() => setShowCreationTypeModal(false)}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <FiX size={20} />
                                </button>
                              </div>
                              <div className="p-6 flex flex-col gap-3">
                                <button
                                  onClick={() => {
                                    setShowCreationTypeModal(false);
                                    handleOpenCreateForm();
                                  }}
                                  className="w-full py-2.5 px-4 bg-white border border-[#E2E8F0] text-blue-700 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                >
                                  <FiFileText size={16} />
                                  Master Class
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCreationTypeModal(false);
                                    handleOpenCreateShortVideo();
                                  }}
                                  className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg  transition flex items-center justify-center gap-2"
                                >
                                  <FiExternalLink size={16} />
                                  Short Video
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-6 mb-4 ">
                          <button
                            type="button"
                            onClick={() => setStatusView("active")}
                            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors ${
                              statusView === "active"
                                ? "border-[#1F2853] text-[#1F2853]"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            Active ({activeCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusView("inactive")}
                            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors ${
                              statusView === "inactive"
                                ? "border-[#1F2853] text-[#1F2853]"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            Inactive ({inactiveCount})
                          </button>
                        </div>

                        {displayOpportunities.length === 0 ? (
                          <p className="text-slate-500 border border-[#E2E8F0] rounded-xl bg-white p-6 text-center">
                            No {statusView} opportunities in this view.
                          </p>
                        ) : (
                        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left border-b border-[#EEF2FF] text-slate-500 bg-slate-50/50">
                                <th className="py-3 px-4 w-10 text-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                    checked={
                                      displayOpportunities.length > 0 &&
                                      selectedIds.length ===
                                        displayOpportunities.length
                                    }
                                    onChange={() =>
                                      handleSelectAll(displayOpportunities)
                                    }
                                  />
                                </th>
                                <th className="py-3 px-4 font-semibold">
                                  Name
                                </th>
                                {isMasterclassesPanel ? (
                                  <>
                                    <th className="py-3 px-4 font-semibold">
                                      Type
                                    </th>
                                    <th className="py-3 px-4 font-semibold">
                                      Category
                                    </th>
                                  </>
                                ) : (
                                  <>
                                    <th className="py-3 px-4 font-semibold">
                                      Company
                                    </th>
                                    <th className="py-3 px-4 font-semibold">
                                      Location
                                    </th>
                                  </>
                                )}
                                <th className="py-3 px-4 font-semibold">
                                  Date
                                </th>
                                <th className="py-3 px-4 font-semibold">
                                  Status
                                </th>
                                {/* <th className="py-3 px-4 font-semibold">
                                  Created By
                                </th> */}
                                <th className="py-3 px-4 font-semibold text-center">
                                  Responses
                                </th>
                                <th className="py-3 px-4 font-semibold text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2FF]">
                              {displayOpportunities.map((item) => {
                                const isClosed = isOpportunityClosed(item);
                                return (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        className="rounded border-slate-300"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() =>
                                          handleSelectItem(item.id)
                                        }
                                      />
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-800">
                                      {item.title}
                                    </td>
                                    {isMasterclassesPanel ? (
                                      <>
                                        <td className="py-3 px-4 font-semibold text-slate-700">
                                          {(item.isShortVideo || item.masterclassType === "Short Video" || item.category === "Short Video") ? "Short Video" : "Masterclass"}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                          {item.category === "Short Video" ? "-" : (item.category || "N/A")}
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="py-3 px-4 text-slate-600">
                                          {item.company}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                          {item.location}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-3 px-4 text-slate-600">
                                      {isMasterclassesPanel
                                        ? (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A")
                                        : (item.deadline ? new Date(item.deadline).toLocaleDateString() : "N/A")}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                                          isClosed
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-emerald-100 text-emerald-700"
                                        }`}
                                      >
                                        {isClosed ? "Inactive" : "Active"}
                                      </span>
                                    </td>
                                    {/* <td className="py-3 px-4 text-slate-600">
                                      {resolveOwnerName(item)}
                                    </td> */}

                                    <td className="py-3 px-4 text-center">
                                      {(() => {
                                        const responseCount =
                                          applications.filter((app) => {
                                            const oppId = String(
                                              app.opportunityId ||
                                                app.opportunity?._id ||
                                                app.opportunity ||
                                                "",
                                            );
                                            return (
                                              oppId ===
                                              String(item.id || item._id)
                                            );
                                          }).length;

                                        return responseCount > 0 ? (
                                          <button
                                            onClick={() =>
                                              handleViewResponses(
                                                item.id || item._id,
                                              )
                                            }
                                            className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-2 justify-center mx-auto group"
                                            title="View Responses"
                                          >
                                            <span className="font-bold">
                                              {responseCount}
                                            </span>
                                            <FiEye
                                              size={16}
                                              className="group-hover:scale-110 transition-transform"
                                            />
                                          </button>
                                        ) : (
                                          <span className="text-slate-300 flex items-center gap-2 justify-center">
                                            <span>0</span>
                                            <FiEye size={16} />
                                          </span>
                                        );
                                      })()}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          onClick={() => handleEditOpportunity(item)}
                                          className="text-blue-500 hover:text-blue-700 transition-colors"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(item.id)}
                                          className="text-rose-500 hover:text-rose-700 transition-colors"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        )}
                        </>
                      )}
                    </div>
                  )}
      {showCreationTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Create New...</h3>
              <button
                onClick={() => setShowCreationTypeModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <button
                onClick={() => {
                  setShowCreationTypeModal(false);
                  handleOpenCreateForm();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiFileText size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-lg">Masterclass</h4>
                  <p className="text-slate-500 text-sm">Create a new comprehensive masterclass</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowCreationTypeModal(false);
                  handleOpenCreateShortVideo();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FiPlay size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-lg">Short Video</h4>
                  <p className="text-slate-500 text-sm">Create a quick insight or short video</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default OpportunitiesTable;
