import apiClient from "./apiClient";

// --- Super Admin: question bank management + AI generation (scoped to one Test) ---

export const getQuestionAiStatus = async () => {
  const response = await apiClient.get("/api/questions/ai-status");
  return response.data;
};

export const getQuestions = async (params = {}) => {
  const response = await apiClient.get("/api/questions", { params });
  return response.data;
};

export const generateQuestions = async (payload) => {
  const response = await apiClient.post("/api/questions/generate", payload);
  return response.data;
};

export const regenerateQuestion = async (id) => {
  const response = await apiClient.post(`/api/questions/${id}/regenerate`);
  return response.data;
};

export const updateQuestion = async (id, payload) => {
  const response = await apiClient.put(`/api/questions/${id}`, payload);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await apiClient.delete(`/api/questions/${id}`);
  return response.data;
};

export const setQuestionStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/questions/${id}/publish`, { status });
  return response.data;
};

// --- Super Admin: bulk "whole section" actions (testId required, optionally narrowed by difficulty) ---

export const setSectionStatus = async (testId, sectionId, status, difficulty) => {
  const response = await apiClient.patch(`/api/questions/section/${sectionId}/status`, { testId, status, difficulty });
  return response.data;
};

export const setSectionDifficulty = async (testId, sectionId, newDifficulty, difficulty) => {
  const response = await apiClient.patch(`/api/questions/section/${sectionId}/difficulty`, {
    testId,
    newDifficulty,
    difficulty,
  });
  return response.data;
};

export const regenerateSection = async (testId, sectionId, difficulty) => {
  const response = await apiClient.post(`/api/questions/section/${sectionId}/regenerate`, { testId, difficulty });
  return response.data;
};

// --- Super Admin: Test management (each Test is its own named exam with its own public link) ---

export const createTest = async (payload) => {
  const response = await apiClient.post("/api/tests", payload);
  return response.data;
};

export const listTests = async () => {
  const response = await apiClient.get("/api/tests");
  return response.data;
};

export const getTestAdmin = async (id) => {
  const response = await apiClient.get(`/api/tests/${id}`);
  return response.data;
};

export const updateTestAdmin = async (id, payload) => {
  const response = await apiClient.patch(`/api/tests/${id}`, payload);
  return response.data;
};

export const addTestSection = async (id, payload) => {
  const response = await apiClient.post(`/api/tests/${id}/sections`, payload);
  return response.data;
};

export const deleteTestSection = async (id, sectionId) => {
  const response = await apiClient.delete(`/api/tests/${id}/sections/${sectionId}`);
  return response.data;
};

export const setTestStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/tests/${id}/status`, { status });
  return response.data;
};

export const deleteTest = async (id) => {
  const response = await apiClient.delete(`/api/tests/${id}`);
  return response.data;
};

// --- Super Admin: "Responses" tab — student attempts for one Test ---

export const listTestResponses = async (testId) => {
  const response = await apiClient.get(`/api/tests/${testId}/attempts`);
  return response.data;
};

// Super Admin marks one manually-reviewed answer (coding, or a short answer with
// no reference) right or wrong. `correct` is true | false | null, where null
// clears a previous mark. Returns the attempt's recomputed score and counts.
export const gradeAttemptResult = async (testId, attemptId, questionId, correct) => {
  const response = await apiClient.patch(
    `/api/tests/${testId}/attempts/${attemptId}/results/${questionId}`,
    { correct },
  );
  return response.data;
};

export const getTestResponseDetail = async (testId, attemptId) => {
  const response = await apiClient.get(`/api/tests/${testId}/attempts/${attemptId}`);
  return response.data;
};

// --- Public: browsing tests before the student is logged in ---

export const listPublishedTests = async () => {
  const response = await apiClient.get("/api/tests/published");
  return response.data;
};

export const getPublicTestBySlug = async (slug) => {
  const response = await apiClient.get(`/api/tests/by-slug/${slug}`);
  return response.data;
};

// --- Logged-in: taking a specific Test, scoped by its public slug ---

export const getTestStatus = async (slug, sessionId) => {
  const response = await apiClient.get(`/api/tests/${slug}/status`, {
    params: sessionId ? { sessionId } : undefined,
  });
  return response.data;
};

export const startTest = async (slug) => {
  const response = await apiClient.post(`/api/tests/${slug}/start`);
  return response.data;
};

// Pick an in-progress attempt back up on a new device/session (e.g. the first
// laptop lost power). Never creates or revives — returns the same questions +
// saved answers, or the finished status so the caller can route away. 409
// `{ blocked }` while the previous device is still communicating.
export const resumeTest = async (slug, sessionId) => {
  const response = await apiClient.post(`/api/tests/${slug}/resume`, { sessionId });
  return response.data;
};

// The owning device voluntarily gives up the attempt so another device can pick
// it up right away (used on a prolonged connection drop). `payload` =
// { sessionId, reason }.
export const releaseTestSession = async (slug, payload) => {
  const response = await apiClient.post(`/api/tests/${slug}/release-session`, payload);
  return response.data;
};

// `answer` is one item from the submit payload shape: {questionId, selectedOption}
// | {questionId, selectedOptions} | {questionId, booleanAnswer} | {questionId, textAnswer}
// | {questionId, language, code}
// `sessionId` (when set) proves this device still owns the attempt.
export const autosaveTestAnswer = async (slug, answer, sessionId) => {
  const response = await apiClient.post(`/api/tests/${slug}/autosave`, { ...answer, sessionId });
  return response.data;
};

export const submitTest = async (slug, answers, sessionId) => {
  const response = await apiClient.post(`/api/tests/${slug}/submit`, { answers, sessionId });
  return response.data;
};

// [CODING-AUTOGRADE-DISABLED 2026-09-03] runTestCode() lived here — it POSTed to
// /api/tests/:slug/run-code so a student could execute their code against the
// hidden test cases mid-exam. Coding answers are now reviewed by an admin
// instead, so the endpoint and this caller are both gone.

export const getTestHeartbeat = async (slug, sessionId) => {
  const response = await apiClient.get(`/api/tests/${slug}/heartbeat`, {
    params: sessionId ? { sessionId } : undefined,
  });
  return response.data;
};

// --- Logged-in: secure-assessment lockdown (see useAssessmentLockdown.js) ---

// Fire-and-forget audit signal. `payload` = { type, metadata, sessionId }.
export const logTestSecurityEvent = async (slug, payload) => {
  const response = await apiClient.post(`/api/tests/${slug}/security-event`, payload);
  return response.data;
};

// Central termination — idempotent server-side. `payload` = { reason, sessionId }.
export const terminateTest = async (slug, payload) => {
  const response = await apiClient.post(`/api/tests/${slug}/terminate`, payload);
  return response.data;
};
