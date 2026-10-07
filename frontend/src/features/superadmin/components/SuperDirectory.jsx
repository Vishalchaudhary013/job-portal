import React, { useState } from "react";
import { FiFileText, FiTrash2, FiEdit2, FiCheck, FiX, FiCheckCircle, FiEye, FiEyeOff, FiExternalLink, FiKey, FiDownload } from "react-icons/fi";
import { useAdminContext } from "../../admin/context/AdminContext";
import { API_BASE_URL } from "../../../services/apiClient";
import ExportSheetConfig from "../../admin/components/ExportSheetConfig";

const SuperDirectory = () => {
  const [viewingMentor, setViewingMentor] = useState(null);

  const {
    isSuperDashboard,
    user, isAdmin, isSuperAdmin, isBootstrapping, isImpersonating,
    filteredOpportunities, sorted,
    scopedApplications, paginatedApplications, totalPages, recentApplications,
    form, editingId, showOpportunityForm, requiredSkillInputs, benefitInputs,
    currentStep, setCurrentStep, showPreviewModal, showSuccessMessage,
    activeSection,
    isInternshipPanel, isGlobalProgramPanel, isJobsPanel, isBootcampsPanel,
    isSuperStatsSection, isSuperPostSection, isSuperUsersSection, isSuperAdminsSection,
    isSuperMentorsSection,
    isSuperApprovedRequestsSection, isAnySuperDirectorySection,
    currentPage, setCurrentPage, itemsPerPage, totalClosedPages, paginatedClosedItems,
    closedApplicationView, setClosedApplicationView, closedApplicationItems, closedApplicationTitle,
    selectedIds,
    directory,
    userCount, adminCount, superAdminCount, totalAccountCount, userPercent, adminPercent, superAdminPercent,
    isWhatsAppConnected, whatsAppStatusText,
    passwordEditorAdminId, adminPasswordForm, showAdminPassword,
    changingPasswordAdminId, passwordChangeMessage, adminApprovalMessage, approvingAdminId,
    visiblePasswords, setVisiblePasswords, openingAdminId, deletingUserId,
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
    handleStatusChange, handleExport, fetchDecryptedPassword, refreshDirectory,
    handleExportStakeholders, stakeholderExportBusy, exportSheetMessage, exportSheetUrl,
    handleSyncStakeholdersToSheet, sheetSyncBusy,
  } = useAdminContext();

  // Which stakeholder list the current section maps to (its own Google Sheet +
  // Excel file). Approved Requests is still an admin list.
  const exportType = isSuperUsersSection
    ? "users"
    : isSuperMentorsSection
      ? "mentors"
      : isSuperAdminsSection || isSuperApprovedRequestsSection
        ? "admins"
        : null;

  return (
    <>
              {!showOpportunityForm && isAnySuperDirectorySection ? (
                <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5">
                  <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-800">
                        {isSuperStatsSection
                          ? "Overview"
                          : isSuperPostSection
                            ? "Post Opportunity"
                            : isSuperAdminsSection
                              ? "Admins"
                              : isSuperMentorsSection
                                ? "Mentors"
                                : isSuperApprovedRequestsSection
                                  ? "Approved Requests"
                                  : "Users"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {isSuperStatsSection
                          ? "Overview of all account totals."
                          : isSuperPostSection
                            ? "Open the post panel to create internships or global programs."
                            : isSuperAdminsSection
                              ? "View and manage admin accounts."
                              : isSuperMentorsSection
                                ? "View and manage mentor accounts."
                                : isSuperApprovedRequestsSection
                                  ? "View already approved admin requests."
                                  : "View and manage user accounts."}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="flex items-center gap-2">
                        {exportType && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleExportStakeholders(exportType)}
                              disabled={Boolean(stakeholderExportBusy)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                            >
                              <FiDownload size={14} />
                              {stakeholderExportBusy === exportType
                                ? "Exporting..."
                                : "Download Excel"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSyncStakeholdersToSheet(exportType)}
                              disabled={sheetSyncBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                            >
                              {sheetSyncBusy ? "Updating..." : "Update Google Sheet"}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={refreshDirectory}
                          className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-semibold"
                        >
                          Refresh
                        </button>
                      </div>
                      {exportType && exportSheetMessage && (
                        <p className="text-xs text-slate-500 max-w-xs sm:text-right break-words">
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
                    </div>
                  </div>

                  {exportType && (
                    <div className="mb-4">
                      <ExportSheetConfig />
                    </div>
                  )}

                  {/* {isSuperStatsSection && (
                    // <div className="space-y-4">
                    //   <p className="text-sm text-slate-500">
                    //     Select Users or Admins from the left menu to open each list separately.
                    //   </p>

                    //   <div className="grid grid-cols-3 gap-3">
                    //     <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFF] p-3">
                    //       <p className="text-xs text-slate-500 font-semibold tracking-wide">
                    //         USERS SHARE
                    //       </p>
                    //       <p className="text-2xl font-bold text-slate-800 mt-1">
                    //         {userPercent}%
                    //       </p>
                    //       <p className="text-xs text-slate-500 mt-1">
                    //         {userCount} of {totalAccountCount} accounts
                    //       </p>
                    //     </div>
                    //     <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFF] p-3">
                    //       <p className="text-xs text-slate-500 font-semibold tracking-wide">
                    //         ADMINS SHARE
                    //       </p>
                    //       <p className="text-2xl font-bold text-slate-800 mt-1">
                    //         {adminPercent}%
                    //       </p>
                    //       <p className="text-xs text-slate-500 mt-1">
                    //         {adminCount} of {totalAccountCount} accounts
                    //       </p>
                    //     </div>
                    //     <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFF] p-3">
                    //       <p className="text-xs text-slate-500 font-semibold tracking-wide">
                    //         SUPER ADMINS SHARE
                    //       </p>
                    //       <p className="text-2xl font-bold text-slate-800 mt-1">
                    //         {superAdminPercent}%
                    //       </p>
                    //       <p className="text-xs text-slate-500 mt-1">
                    //         {superAdminCount} of {totalAccountCount} accounts
                    //       </p>
                    //     </div>
                    //   </div>

                    //   <div className="space-y-2">
                    //     <div>
                    //       <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    //         <span>Users</span>
                    //         <span>{userPercent}%</span>
                    //       </div>
                    //       <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    //         <div
                    //           className="h-full bg-slate-700"
                    //           style={{ width: `${userPercent}%` }}
                    //         />
                    //       </div>
                    //     </div>
                    //     <div>
                    //       <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    //         <span>Admins</span>
                    //         <span>{adminPercent}%</span>
                    //       </div>
                    //       <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    //         <div
                    //           className="h-full bg-red-600"
                    //           style={{ width: `${adminPercent}%` }}
                    //         />
                    //       </div>
                    //     </div>
                    //     <div>
                    //       <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    //         <span>Super Admins</span>
                    //         <span>{superAdminPercent}%</span>
                    //       </div>
                    //       <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    //         <div
                    //           className="h-full bg-emerald-600"
                    //           style={{ width: `${superAdminPercent}%` }}
                    //         />
                    //       </div>
                    //     </div>
                    //   </div>

                    //   <div className="flex items-center gap-2 pt-1">
                    //     <button
                    //       type="button"
                    //       onClick={() => handleSectionChange("Users")}
                    //       className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-800 text-sm font-semibold"
                    //     >
                    //       Open Users
                    //     </button>
                    //     <button
                    //       type="button"
                    //       onClick={() => handleSectionChange("Admins")}
                    //       className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-semibold"
                    //     >
                    //       Open Admins
                    //     </button>
                    //   </div>
                    // </div>
                  )} */}

                  {(isSuperAdminsSection || isSuperApprovedRequestsSection || isSuperMentorsSection) && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {isSuperApprovedRequestsSection
                            ? "Approved Admin Requests"
                            : "Admins"}
                        </h3>
                        {/* <button
                          type="button"
                          onClick={() => navigate("/admin-dashboard")}
                          className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold"
                        >
                          Open Admin Dashboard
                        </button> */}
                      </div>
                      {(isSuperApprovedRequestsSection
                        ? directory.admins?.filter(
                            (item) => item.adminApprovalStatus === "approved",
                          )
                        : isSuperMentorsSection
                          ? directory.mentors
                          : directory.admins
                      )?.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          {isSuperApprovedRequestsSection
                            ? "No approved admin requests found."
                            : isSuperMentorsSection
                            ? "No mentors found."
                            : "No admins found."}
                        </p>
                      ) : (
                        <div className="overflow-x-auto scrollbar-hide border border-[#E2E8F0] rounded-lg">
                          <table className="min-w-215 w-full text-sm">
                            <thead>
                              <tr className="text-left border-b border-[#EEF2FF] text-slate-500">
                                <th className="py-2 px-3">Name</th>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Phone</th>
                                {isSuperMentorsSection ? (
                                  <th className="py-2 px-3">Domain</th>
                                ) : (
                                  <th className="py-2 px-3">Organization</th>
                                )}
                                <th className="py-2 px-3">Password</th>
                                {!isSuperMentorsSection && <th className="py-2 px-3">Status</th>}
                                <th className="py-2 px-3 ">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(isSuperApprovedRequestsSection
                                ? directory.admins?.filter(
                                    (item) =>
                                      item.adminApprovalStatus === "approved",
                                  )
                                : isSuperMentorsSection
                                ? directory.mentors
                                : directory.admins).map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-[#EEF2FF]"
                                >
                                  <td className="py-2 px-3 font-medium text-slate-800 wrap-break-word">
                                    {isSuperMentorsSection ? (
                                      <button 
                                        type="button"
                                        onClick={() => setViewingMentor(item)} 
                                        className="text-blue-700 font-bold hover:underline"
                                      >
                                        {item.fullName}
                                      </button>
                                    ) : (
                                      item.fullName
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 break-all">
                                    {item.email}
                                  </td>

                                  <td className="py-2 px-3 text-slate-600 break-all">
                                    {item.whatsappNumber || (
                                      <span className="text-slate-400">
                                        N/A
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {isSuperMentorsSection ? (
                                      item.experiencedDomain || (
                                        <span className="text-slate-400">N/A</span>
                                      )
                                    ) : (
                                      item.organizationName || (
                                        <span className="text-slate-400">N/A</span>
                                      )
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono">
                                        {visiblePasswords[item.id] === true
                                          ? "••••••••"
                                          : visiblePasswords[item.id] ===
                                              "loading"
                                            ? "Loading..."
                                            : visiblePasswords[item.id] ===
                                                "error"
                                              ? "Error"
                                              : visiblePasswords[item.id] ===
                                                  "N/A"
                                                ? "N/A"
                                                : visiblePasswords[item.id] ||
                                                  "••••••••"}
                                      </span>
                                      {isSuperAdmin ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (
                                              !visiblePasswords[item.id] ||
                                              visiblePasswords[item.id] ===
                                                true ||
                                              visiblePasswords[item.id] ===
                                                "error" ||
                                              visiblePasswords[item.id] ===
                                                "N/A"
                                            ) {
                                              fetchDecryptedPassword(item.id);
                                            } else {
                                              setVisiblePasswords((prev) => ({
                                                ...prev,
                                                [item.id]: true,
                                              }));
                                            }
                                          }}
                                          className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                          {visiblePasswords[item.id] &&
                                          visiblePasswords[item.id] !== true &&
                                          visiblePasswords[item.id] !==
                                            "loading" &&
                                          visiblePasswords[item.id] !==
                                            "error" &&
                                          visiblePasswords[item.id] !==
                                            "N/A" ? (
                                            <FiEyeOff size={14} />
                                          ) : (
                                            <FiEye size={14} />
                                          )}
                                        </button>
                                      ) : (
                                        <FiEyeOff
                                          size={14}
                                          className="text-slate-300"
                                        />
                                      )}
                                    </div>
                                  </td>
                                  {!isSuperMentorsSection && (
                                    <td className="py-2 px-3 text-slate-600">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          item.adminApprovalStatus === "pending"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-emerald-100 text-emerald-800"
                                        }`}
                                      >
                                        {item.adminApprovalStatus === "pending"
                                          ? "Pending Approval"
                                          : "Approved"}
                                      </span>
                                    </td>
                                  )}
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-3">
                                      {item.adminApprovalStatus ===
                                        "pending" && (
                                        <div className="relative group">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleApproveAdminAccess(item.id)
                                            }
                                            disabled={
                                              approvingAdminId === item.id ||
                                              !item.isEmailVerified ||
                                              !item.isPhoneVerified
                                            }
                                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                          >
                                            {approvingAdminId === item.id ? (
                                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <FiCheck size={16} />
                                            )}
                                          </button>
                                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                                            {!item.isEmailVerified ||
                                            !item.isPhoneVerified
                                              ? "Verify Email & Phone First"
                                              : "Approve Access"}
                                          </span>
                                        </div>
                                      )}

                                      <div className="relative group">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenAdminDashboard(item.id)
                                          }
                                          disabled={
                                            item.adminApprovalStatus ===
                                              "pending" ||
                                            openingAdminId === item.id ||
                                            deletingUserId === item.id
                                          }
                                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                                        >
                                          {openingAdminId === item.id ? (
                                            <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <FiExternalLink size={16} />
                                          )}
                                        </button>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                                          {openingAdminId === item.id
                                            ? "Opening..."
                                            : "Open Dashboard"}
                                        </span>
                                      </div>

                                      <div className="relative group">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartPasswordEditor(item.id)
                                          }
                                          disabled={
                                            openingAdminId === item.id ||
                                            deletingUserId === item.id ||
                                            changingPasswordAdminId === item.id
                                          }
                                          className="p-2 rounded-lg bg-blue-50 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                        >
                                          <FiKey size={16} />
                                        </button>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                                          Change Password
                                        </span>
                                      </div>

                                      <div className="relative group">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteAccount(item)
                                          }
                                          disabled={deletingUserId === item.id}
                                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                        >
                                          {deletingUserId === item.id ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <FiTrash2 size={16} />
                                          )}
                                        </button>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                                          Delete Account
                                        </span>
                                      </div>
                                    </div>

                                    {passwordEditorAdminId === item.id && (
                                      <div className="mt-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFF] p-2.5">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          <div className="relative">
                                            <input
                                              type={
                                                showAdminPassword.newPassword
                                                  ? "text"
                                                  : "password"
                                              }
                                              name="newPassword"
                                              value={
                                                adminPasswordForm.newPassword
                                              }
                                              onChange={
                                                handleAdminPasswordInputChange
                                              }
                                              placeholder="New password"
                                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 pr-8 text-xs text-slate-800"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleAdminPasswordVisibility(
                                                  "newPassword",
                                                )
                                              }
                                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                                              aria-label={
                                                showAdminPassword.newPassword
                                                  ? "Hide new password"
                                                  : "Show new password"
                                              }
                                            >
                                              {showAdminPassword.newPassword ? (
                                                <FiEyeOff size={14} />
                                              ) : (
                                                <FiEye size={14} />
                                              )}
                                            </button>
                                          </div>
                                          <div className="relative">
                                            <input
                                              type={
                                                showAdminPassword.confirmPassword
                                                  ? "text"
                                                  : "password"
                                              }
                                              name="confirmPassword"
                                              value={
                                                adminPasswordForm.confirmPassword
                                              }
                                              onChange={
                                                handleAdminPasswordInputChange
                                              }
                                              placeholder="Confirm password"
                                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 pr-8 text-xs text-slate-800"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleAdminPasswordVisibility(
                                                  "confirmPassword",
                                                )
                                              }
                                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                                              aria-label={
                                                showAdminPassword.confirmPassword
                                                  ? "Hide confirm password"
                                                  : "Show confirm password"
                                              }
                                            >
                                              {showAdminPassword.confirmPassword ? (
                                                <FiEyeOff size={14} />
                                              ) : (
                                                <FiEye size={14} />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-slate-500">
                                          Password must be at least 8 characters
                                          and include letters, numbers, and
                                          special characters.
                                        </p>
                                        <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              adminPasswordForm.notifyAdmin,
                                            )}
                                            onChange={handleNotifyAdminToggle}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-900"
                                          />
                                          Notify admin by email about password
                                          change
                                        </label>
                                        <div className="mt-2 flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleChangeAdminPassword(item.id)
                                            }
                                            disabled={
                                              changingPasswordAdminId ===
                                              item.id
                                            }
                                            className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-semibold disabled:opacity-60"
                                          >
                                            {changingPasswordAdminId === item.id
                                              ? "Saving..."
                                              : "Save Password"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelPasswordEditor}
                                            disabled={
                                              changingPasswordAdminId ===
                                              item.id
                                            }
                                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-60"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {isSuperUsersSection && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Users
                      </h3>
                      {directory.users?.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No users found.
                        </p>
                      ) : (
                        <div className="overflow-x-auto scrollbar-hide border border-[#E2E8F0] rounded-lg">
                          <table className="min-w-[950px] w-full text-sm">
                            <thead>
                              <tr className="text-left border-b border-[#EEF2FF] text-slate-500">
                                <th className="py-2 px-3">Name</th>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Phone</th>
                                <th className="py-2 px-3">Qualification</th>
                                <th className="py-2 px-3">Resume</th>
                                <th className="py-2 px-3">Resume Builder</th>
                                <th className="py-2 px-3">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {directory.users.map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-[#EEF2FF]"
                                >
                                  <td className="py-2 px-3 font-medium text-slate-800 wrap-break-word">
                                    {item.fullName}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 break-all">
                                    {item.email}
                                  </td>

                                  <td className="py-2 px-3 text-slate-600">
                                    {item.whatsappNumber || (
                                      <span className="text-slate-400">
                                        N/A
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2 px-3 text-slate-600">
                                    {item.latestQualification || (
                                      <span className="text-slate-400">
                                        N/A
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2 px-3">
                                    {item.resumeFilePath ? (
                                      <a
                                        href={`${API_BASE_URL}${item.resumeFilePath.startsWith("/") ? "" : "/"}${item.resumeFilePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2853] text-white text-xs font-semibold hover:bg-[#162040] transition shadow-sm"
                                      >
                                        <FiFileText size={14} />
                                        View
                                      </a>
                                    ) : (
                                      <span className="text-slate-400">
                                        N/A
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    {item.builderResume?.fileUrl ? (
                                      <div className="flex flex-col gap-0.5 ">
                                        <a
                                          href={`${API_BASE_URL}${item.builderResume.fileUrl.startsWith("/") ? "" : "/"}${item.builderResume.fileUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm w-fit"
                                        >
                                          <FiFileText size={14} />
                                          View
                                        </a>
                                        {/* {item.builderResume.finalizedAt && (
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(item.builderResume.finalizedAt).toLocaleDateString()}
                                          </span>
                                        )} */}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">N/A</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="relative group">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteAccount(item)
                                        }
                                        disabled={deletingUserId === item.id}
                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                      >
                                        {deletingUserId === item.id ? (
                                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <FiTrash2 size={16} />
                                        )}
                                      </button>
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm z-10">
                                        Delete Account
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {isSuperPostSection && (
                    <div>
                      {!showOpportunityForm ? (
                        <div className="text-sm text-slate-500">
                          Click Post Internship or Post Global Program above to
                          open the form.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

        {viewingMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-slate-800">Mentor Details</h2>
                <button
                  onClick={() => setViewingMentor(null)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">{viewingMentor.fullName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-slate-600">Email:</span> {viewingMentor.email}</div>
                    <div><span className="font-semibold text-slate-600">Phone:</span> {viewingMentor.whatsappNumber || "N/A"}</div>
                    <div><span className="font-semibold text-slate-600">Domain:</span> {viewingMentor.experiencedDomain || "N/A"}</div>
                    <div>
                      <span className="font-semibold text-slate-600">LinkedIn:</span>{" "}
                      {viewingMentor.linkedinProfile ? (
                        <a href={viewingMentor.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                          {viewingMentor.linkedinProfile}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-slate-700 text-base">Mentorship Questionnaire</h4>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Years of Experience</p>
                    <p className="text-slate-600">{viewingMentor.yearsOfExperience || "N/A"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Companies Worked At</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingMentor.companiesWorkedAt || "N/A"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Prior Teaching Experience</p>
                    <p className="text-slate-600">{viewingMentor.teachingExperience || "N/A"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Preferred Engagement Types</p>
                    <div className="text-slate-600">
                      {viewingMentor.engagementType && viewingMentor.engagementType.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {viewingMentor.engagementType.map((type, i) => (
                            <li key={i}>{type}</li>
                          ))}
                        </ul>
                      ) : "N/A"}
                      {viewingMentor.otherEngagementIdea && (
                        <p className="mt-2 text-sm italic">Other Idea: {viewingMentor.otherEngagementIdea}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Topics They Want to Teach</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingMentor.topicsToTeach || "N/A"}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Motivation for Teaching</p>
                    <div className="text-slate-600">
                      {viewingMentor.motivationForTeaching && viewingMentor.motivationForTeaching.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {viewingMentor.motivationForTeaching.map((motivation, i) => (
                            <li key={i}>{motivation}</li>
                          ))}
                        </ul>
                      ) : "N/A"}
                      {viewingMentor.otherMotivationIdea && (
                        <p className="mt-2 text-sm italic">Other Motivation: {viewingMentor.otherMotivationIdea}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">Social Media Followers</p>
                    <p className="text-slate-600">{viewingMentor.socialMediaFollowers || "N/A"}</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

    </>
  );
};

export default SuperDirectory;
