import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FilePlus2, FormInput, Inbox, Layers } from "lucide-react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import Icon from "../Icon";
import { StatTile } from "../charts";
import { useStudio } from "../StudioContext";
import { useLoader } from "../hooks";
import { Badge, Button, Card, ErrorState, PageHeader, Skeleton, StatusBadge, timeAgo } from "../ui";

const describeAction = (item) => {
  const verb = item.action.split(".").pop().replace(/([A-Z])/g, " $1").toLowerCase();
  return `${verb} ${item.entityType.replace(/([A-Z])/g, " $1").toLowerCase()}`;
};

const DashboardPage = () => {
  const { me, can } = useStudio();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.dashboard(), []);

  return (
    <>
      <PageHeader
        title={`Welcome, ${me.name?.split(" ")[0] || "admin"}`}
        description="Design forms, create content and decide how it appears on Edeco."
        actions={
          can("schema.write") && (
            <>
              <Link to="/form-builder/forms/new?kind=content"><Button variant="primary" icon={FilePlus2}>New content type</Button></Link>
              <Link to="/form-builder/forms/new?kind=response"><Button icon={FormInput}>New response form</Button></Link>
            </>
          )
        }
      />
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-24" />)}</div>
      ) : data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Content types" value={data.counts.contentTypes} />
            <StatTile label="Published entries" value={data.counts.content.published || 0} hint={`${data.counts.content.draft || 0} drafts · ${data.counts.content.review || 0} in review`} />
            <StatTile label="Response forms" value={data.counts.forms} />
            <StatTile label="Responses" value={data.counts.submissions.total} hint={`${data.counts.submissions.new} new · ${data.counts.submissions.last7Days} this week`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Content types</h2>
                <Link to="/form-builder/forms" className="text-sm font-medium text-[#1F2853] hover:underline">All forms</Link>
              </div>
              {!data.contentTypes.length ? (
                <div className="py-6 text-center">
                  <Layers className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No content types yet. Create one to start — the form begins blank.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.contentTypes.map((type) => (
                    <li key={type.id}>
                      <Link to={`/form-builder/types/${type.id}/form`} className="group flex items-center gap-3 py-2.5">
                        <Icon name={type.icon} className="text-slate-500" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{type.name}</span>
                        {Object.values(type.dirty || {}).some(Boolean) && type.status === "published" && <Badge tone="amber">draft changes</Badge>}
                        <StatusBadge status={type.status} />
                        <ArrowRight size={15} className="text-slate-300 group-hover:text-slate-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Latest responses</h2>
                {can("submissions.read") && <Link to="/form-builder/submissions" className="text-sm font-medium text-[#1F2853] hover:underline">All responses</Link>}
              </div>
              {!data.recentSubmissions.length ? (
                <div className="py-6 text-center">
                  <Inbox className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No responses yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentSubmissions.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-800">{item.userName || item.userEmail || "Anonymous"}</span>
                        <span className="block truncate text-xs text-slate-500">{item.formSlug}{item.contentTitle ? ` · ${item.contentTitle}` : ""}</span>
                      </span>
                      <StatusBadge status={item.status} />
                      <span className="w-16 text-right text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">{can("audit.read") ? "Recent activity" : "Your recent activity"}</h2>
            {!data.recentActivity.length ? (
              <p className="text-sm text-slate-500">Nothing yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentActivity.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium text-slate-800">{item.actor?.name || "System"}</span>
                    <span className="text-slate-600">{describeAction(item)}</span>
                    {item.entityLabel && <span className="truncate text-slate-800">“{item.entityLabel}”</span>}
                    <span className="ml-auto text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card> */}
        </div>
      )}
    </>
  );
};

export default DashboardPage;
