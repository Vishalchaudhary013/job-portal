import React, { useEffect, useState } from "react";
import { FiFileText, FiRefreshCw } from "react-icons/fi";
import { useAdminContext } from "../../admin/context/AdminContext";
import { adminListBuilderResumes } from "../../../services/builderResumeAPI";
import { API_BASE_URL, getErrorMessage } from "../../../services/apiClient";

// Super-admin record of every resume students have finished in the Resume Builder,
// with the author — the "which user built a resume" view.
const ResumeBuilderList = () => {
  const { activeSection } = useAdminContext();
  const isActive = activeSection === "Resume Builder";

  const [state, setState] = useState({ status: "idle", resumes: [], total: 0, error: "" });

  const load = () => {
    setState((prev) => ({ ...prev, status: "loading", error: "" }));
    adminListBuilderResumes()
      .then((data) => setState({ status: "ready", resumes: data.resumes || [], total: data.total || 0, error: "" }))
      .catch((error) =>
        setState({ status: "error", resumes: [], total: 0, error: getErrorMessage(error, "Failed to load resume builder records.") }),
      );
  };

  useEffect(() => {
    if (isActive && state.status === "idle") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (!isActive) return null;

  const fileHref = (fileUrl) => `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

  return (
    <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5">
      <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Resume Builder</h2>
          <p className="text-sm text-slate-500">
            {state.status === "ready"
              ? `${state.total} resume${state.total === 1 ? "" : "s"} built and finished by students.`
              : "Resumes students created with the Resume Builder tool."}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-semibold"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {state.status === "loading" && <p className="text-sm text-slate-500">Loading…</p>}
      {state.status === "error" && <p className="text-sm text-red-600">{state.error}</p>}

      {state.status === "ready" && (
        state.resumes.length === 0 ? (
          <p className="text-sm text-slate-500">No resumes have been built yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-hide border border-[#E2E8F0] rounded-lg">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#EEF2FF] text-slate-500">
                  <th className="py-2 px-3">Student</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Finished</th>
                  <th className="py-2 px-3">Synced to profile</th>
                  <th className="py-2 px-3">Resume</th>
                </tr>
              </thead>
              <tbody>
                {state.resumes.map((resume) => (
                  <tr key={resume.id} className="border-b border-[#EEF2FF]">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {resume.author?.fullName || <span className="text-slate-400">Unknown</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-600 break-all">
                      {resume.author?.email || <span className="text-slate-400">N/A</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{resume.title}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {resume.finalizedAt ? new Date(resume.finalizedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{resume.syncedToProfile ? "Yes" : "No"}</td>
                    <td className="py-2 px-3">
                      {resume.fileUrl ? (
                        <a
                          href={fileHref(resume.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                        >
                          <FiFileText size={14} /> View
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default ResumeBuilderList;
