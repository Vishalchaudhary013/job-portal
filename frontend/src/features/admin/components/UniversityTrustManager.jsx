import React, { useEffect, useState } from "react";
import { FiShield, FiArrowLeft, FiRefreshCw, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { getUniversityPortfolios } from "../../../services/universityPortfolioAPI";
import { getMethodology } from "../../../services/universityTrustAPI";
import {
  getAdminTrustScore,
  addEvidence,
  updateEvidence,
  deleteEvidence,
  recalculateTrustScore,
} from "../../../services/adminUniversityTrustAPI";
import { getErrorMessage } from "../../../services/apiClient";
import { EVIDENCE_STATUS_LABELS, EVIDENCE_STATUS_STYLES, formatMonthYear } from "../../universityTrust/utils/trustFormatting";
import UniversityTrustEvidenceForm from "./UniversityTrustEvidenceForm";

const UniversityListView = ({ universities, loading, error, onSelect }) => (
  <div className="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
    <div className="px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <FiShield /> Trust Score
      </h2>
    </div>
    <div className="p-6">
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading universities...</div>
      ) : universities.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-500">
          No university portfolios exist yet — create one under University Portfolio first.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((u) => (
            <button
              key={u._id}
              onClick={() => onSelect(u._id)}
              className="text-left rounded-xl border border-slate-200 p-4 hover:border-[#1F2853] hover:bg-slate-50"
            >
              <div className="font-semibold text-slate-800 text-sm truncate">{u.universityName}</div>
              <div className="mt-1 text-[12px] font-semibold text-[#1F2853]">Manage Trust Score →</div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

const CategoryRow = ({ category, score, evidence, onAdd, onEdit, onDelete, isAdding, addForm }) => (
  <div className="rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-[13.5px] font-bold text-slate-900">{category.label}</div>
        <div className="text-[11px] text-slate-400">{category.mode === "computed" ? "System-computed — no manual evidence" : "Evidence-based"}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-extrabold text-slate-900">
          {score}/{category.weight}
        </span>
        {category.mode === "evidence" && (
          <button onClick={onAdd} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 hover:border-[#1F2853] hover:text-[#1F2853]">
            <FiPlus /> Add
          </button>
        )}
      </div>
    </div>

    {category.mode === "evidence" && (
      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
        {isAdding && <div className="mb-2">{addForm}</div>}
        {evidence?.length ? (
          evidence.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${EVIDENCE_STATUS_STYLES[item.status]}`}>
                  {EVIDENCE_STATUS_LABELS[item.status]}
                </span>
                {item.sourceName && <span className="ml-2 text-[12.5px] font-semibold text-slate-700">{item.sourceName}</span>}
                {item.verifiedAt && <div className="mt-0.5 text-[11px] text-slate-400">Verified {formatMonthYear(item.verifiedAt)}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => onEdit(item)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#1F2853]">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => onDelete(item)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          !isAdding && <p className="text-[12px] text-slate-400">No evidence on file yet.</p>
        )}
      </div>
    )}
  </div>
);

const UniversityDetailView = ({ universityId, methodology, onBack }) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [formState, setFormState] = useState(null); // { criterion, evidence? }
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getAdminTrustScore(universityId);
      setBreakdown(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Trust Score."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateTrustScore(universityId);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to recalculate."));
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveEvidence = async (payload) => {
    setSaving(true);
    try {
      if (formState.evidence) {
        await updateEvidence(universityId, formState.evidence.id, payload);
      } else {
        await addEvidence(universityId, payload);
      }
      setFormState(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save evidence."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvidence = async (criterion, evidence) => {
    if (!window.confirm("Delete this evidence record?")) return;
    try {
      await deleteEvidence(universityId, evidence.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete evidence."));
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
          <FiArrowLeft /> Back
        </button>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F2853] text-white rounded-lg font-semibold text-sm hover:bg-[#141c3d] disabled:opacity-60"
        >
          <FiRefreshCw className={recalculating ? "animate-spin" : ""} /> {recalculating ? "Recalculating..." : "Recalculate"}
        </button>
      </div>

      <div className="p-6">
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">{breakdown.university.name}</h3>
                <p className="text-[12px] text-slate-500">Methodology version {methodology?.version}</p>
              </div>
              {breakdown.trustScore ? (
                <div className="text-right">
                  <div className="text-[22px] font-extrabold text-slate-900">{breakdown.trustScore.totalScore}/100</div>
                  <div className="text-[12px] font-semibold text-slate-500">
                    {breakdown.trustScore.trustLevel} · Evidence Confidence: {breakdown.trustScore.evidenceConfidence}
                  </div>
                </div>
              ) : (
                <p className="text-[12.5px] text-slate-500">No score calculated yet — add evidence, then Recalculate.</p>
              )}
            </div>

            <div className="space-y-2">
              {methodology?.categories.map((category) => (
                <CategoryRow
                  key={category.key}
                  category={category}
                  score={breakdown.trustScore?.categoryScores?.[category.key] ?? 0}
                  evidence={breakdown.evidenceByCategory?.[category.key]}
                  isAdding={formState?.criterion === category.key}
                  onAdd={() => setFormState({ criterion: category.key })}
                  onEdit={(evidenceItem) => setFormState({ criterion: category.key, evidence: evidenceItem })}
                  onDelete={(evidenceItem) => handleDeleteEvidence(category.key, evidenceItem)}
                  addForm={
                    formState?.criterion === category.key ? (
                      <UniversityTrustEvidenceForm
                        criterion={category.key}
                        initialValues={formState.evidence}
                        submitting={saving}
                        onCancel={() => setFormState(null)}
                        onSubmit={handleSaveEvidence}
                      />
                    ) : null
                  }
                />
              ))}
            </div>

            {!!breakdown.history?.length && (
              <div className="mt-8">
                <h4 className="text-[13px] font-bold text-slate-900">Score History</h4>
                <div className="mt-2 space-y-1">
                  {breakdown.history.map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-[12.5px]">
                      <span className="text-slate-500">{formatMonthYear(entry.calculatedAt)}</span>
                      <span className="font-bold text-slate-800">
                        {entry.totalScore}/100 · {entry.trustLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const UniversityTrustManager = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [methodology, setMethodology] = useState(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [portfoliosRes, methodologyRes] = await Promise.all([getUniversityPortfolios(), getMethodology()]);
        setUniversities(portfoliosRes?.data || []);
        setMethodology(methodologyRes.data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (selectedUniversityId) {
    return <UniversityDetailView universityId={selectedUniversityId} methodology={methodology} onBack={() => setSelectedUniversityId(null)} />;
  }

  return <UniversityListView universities={universities} loading={loading} error={error} onSelect={setSelectedUniversityId} />;
};

export default UniversityTrustManager;
