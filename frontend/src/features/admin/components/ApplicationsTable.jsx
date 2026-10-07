import React from "react";
import { FiFileText, FiTrash2, FiEdit2, FiCheck, FiX, FiCheckCircle } from "react-icons/fi";
import { useAdminContext } from "../context/AdminContext";
import { API_BASE_URL } from "../../../services/apiClient";
import ExportSheetConfig from "./ExportSheetConfig";

const ApplicationsTable = () => {
  const {
    isSuperDashboard,
    user, isAdmin, isSuperAdmin, isBootstrapping, isImpersonating,
    filteredOpportunities, sorted,
    scopedApplications, paginatedApplications, totalPages, recentApplications,
    form, editingId, showOpportunityForm, requiredSkillInputs, benefitInputs,
    currentStep, setCurrentStep, showPreviewModal, showSuccessMessage,
    activeSection,
    isInternshipPanel, isGlobalProgramPanel, isJobsPanel, isBootcampsPanel,
    isMasterclassesPanel, isDegreeProgramsPanel, isPGProgramsPanel, isClosedApplicationPanel,
    isSuperStatsSection, isSuperPostSection, isSuperUsersSection, isSuperAdminsSection,
    isSuperApprovedRequestsSection, isAnySuperDirectorySection,
    currentPage, setCurrentPage, itemsPerPage, totalClosedPages, paginatedClosedItems,
    closedApplicationView, setClosedApplicationView, closedApplicationItems, closedApplicationTitle,
    selectedIds,
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
    handleOpenCreateForm, handleSuperCreateInternship, handleSuperCreateGlobalProgram,
    handleSubmit, handleConfirmSubmit,
    handleEdit, handleViewResponses, handleDelete, handleBulkDelete,
    handleSelectAll, handleSelectItem,
    handleViewResume,
    handleSectionChange, handleLogout, handleReturnToSuperAdmin,
    handleOpenAdminDashboard, handleApproveAdminAccess, handleDeleteAccount,
    handleStartPasswordEditor, handleCancelPasswordEditor, toggleAdminPasswordVisibility,
    handleAdminPasswordInputChange, handleNotifyAdminToggle, handleChangeAdminPassword,
    handleStatusChange, handleExport, fetchDecryptedPassword, filterOpportunityId, setFilterOpportunityId,
    exportSheetMessage, exportSheetUrl, handleSyncToSheet, sheetSyncBusy,
  } = useAdminContext();

  return (
    <>
      {activeSection === "Applications" && (
        <div className="bg-white  border border-[#E2E8F0] p-4 sm:p-5">
          <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                Application Forms
                {filterOpportunityId && (
                  <span className="ml-3 text-sm font-normal text-red-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Filtered for:{" "}
                    {filteredOpportunities.find(
                      (o) => (o.id || o._id) === filterOpportunityId,
                    )?.title || "Selected Opportunity"}
                    <button
                      onClick={() => setFilterOpportunityId(null)}
                      className="ml-2 text-blue-800 hover:text-blue-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-500">
                Review and manage submitted applications.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-semibold"
              >
                Download Excel
              </button>
              <button
                type="button"
                onClick={handleSyncToSheet}
                disabled={sheetSyncBusy}
                className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {sheetSyncBusy ? "Updating..." : "Update Google Sheet"}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <ExportSheetConfig />
          </div>

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

          {scopedApplications.length === 0 ? (
            <p className="text-slate-500">
              No applications submitted yet.
            </p>
          ) : (
            <>
              {statusChangeMessage && (
                <div className="mb-4 px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {statusChangeMessage}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-245 w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-[#EEF2FF] text-slate-500">
                      <th className="py-2 pr-3">Applicant</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Opportunity</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Applied Resume</th>
                      <th className="py-2 pr-3">Account Resumes</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedApplications.map((application) => (
                      <tr
                        key={application.id}
                        className="border-b border-[#EEF2FF] align-top"
                      >
                        <td className="py-2 pr-3 font-medium text-slate-800 wrap-break-word">
                          {application.name}
                        </td>
                        <td className="py-2 pr-3 text-slate-600 break-all">
                          {application.email}
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {application.phone}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">
                          {application.opportunityTitle}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">
                          {application.opportunityType}
                        </td>
                        <td className="py-2 pr-3 text-slate-700">
                          {application.resumeFileName ? (
                            <div className="flex items-center gap-2">
                              <span>{application.resumeFileName}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleViewResume(application)
                                }
                                className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200"
                              >
                                View Resume
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Not uploaded
                            </span>
                          )}
                        </td>

                        <td className="py-2 pr-3">
                          <div className="flex flex-col gap-1">
                            {application.applicantAccountResumeUrl ? (
                              <a
                                href={application.applicantAccountResumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded-md bg-[#1F2853] text-white text-xs font-semibold hover:bg-[#162040]"
                              >
                                <FiFileText size={12} /> Signup resume
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">No signup resume</span>
                            )}
                            {application.applicantBuilderResumeUrl ? (
                              <a
                                href={application.applicantBuilderResumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                              >
                                <FiFileText size={12} /> Builder resume
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">No builder resume</span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 pr-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${application.status === "Accepted" || application.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : application.status === "Rejected" || application.status === "Not Approved"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                          >

                            {application.status === "Approved" ? "Accepted"
                              : application.status === "Not Approved" ? "Rejected"
                                : application.status || "New"}
                          </span>
                        </td>

                        <td className="py-2 pr-3">
                          {(!application.status || application.status === "New") ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStatusChange(application.id || application._id, "Accepted")}
                                disabled={statusChangingId === (application.id || application._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusChangingId === (application.id || application._id)
                                    ? "bg-emerald-200 text-emerald-800 cursor-wait"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                              >
                                {statusChangingId === (application.id || application._id) ? "..." : "Accept"}
                              </button>
                              <button
                                onClick={() => handleStatusChange(application.id || application._id, "Rejected")}
                                disabled={statusChangingId === (application.id || application._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusChangingId === (application.id || application._id)
                                    ? "bg-rose-200 text-rose-800 cursor-wait"
                                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                                  }`}
                              >
                                {statusChangingId === (application.id || application._id) ? "..." : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-[#EEF2FF] pt-4">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * itemsPerPage,
                        scopedApplications.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {scopedApplications.length}
                    </span>{" "}
                    results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center px-4">
                      <span className="text-sm font-medium text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages),
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ApplicationsTable;
