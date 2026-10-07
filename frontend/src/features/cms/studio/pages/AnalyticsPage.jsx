import React, { useState } from "react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import { BarList, ColumnChart, StatTile } from "../charts";
import { useLoader } from "../hooks";
import { Card, ErrorState, PageHeader, Select, Skeleton } from "../ui";

const shortDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");

const AnalyticsPage = () => {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.analytics(days), [days]);
  const byStatus = Object.fromEntries((data?.contentByStatus || []).map((row) => [row.status, row.count]));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Responses and publishing activity across the Form Builder."
        actions={
          <Select aria-label="Time range" className="!w-40" value={days} onChange={(event) => setDays(Number(event.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
          </Select>
        }
      />
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? (
        <div className="space-y-4"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      ) : data && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["published", "draft", "review", "unpublished", "archived"].map((status) => (
              <StatTile key={status} label={status === "review" ? "In review" : status} value={byStatus[status] || 0} />
            ))}
          </div>
          <Card className="p-5">
            <ColumnChart title="Responses per day" valueLabel="responses" data={data.submissionsPerDay.map((point) => ({ label: point.date, value: point.count }))} formatLabel={shortDate} />
          </Card>
          <Card className="p-5">
            <ColumnChart title="Entries published per day" valueLabel="publishes" data={data.publishesPerDay.map((point) => ({ label: point.date, value: point.count }))} formatLabel={shortDate} height={110} />
          </Card>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-5">
              <BarList title="Responses by form" data={data.submissionsByForm.map((row) => ({ label: row.form, value: row.count }))} emptyText="No responses in this period." />
            </Card>
            <Card className="p-5">
              <BarList title="Responses by status" data={data.submissionsByStatus.map((row) => ({ label: row.status, value: row.count }))} />
            </Card>
            <Card className="p-5">
              <BarList title="Entries by content type" data={data.contentByType.map((row) => ({ label: row.name, value: row.total, detail: `${row.published} live` }))} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyticsPage;
