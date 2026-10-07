import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import Icon from "../Icon";
import { useStudio } from "../StudioContext";
import { Badge, Button, Card, EmptyState, PageHeader } from "../ui";

// Entry points for "Card builder", "Detail page builder" and "Presentation":
// pick a content type, land on that builder tab.
const COPY = {
  card: { title: "Card builder", description: "Choose a content type to design how its entries appear as cards in listings." },
  page: { title: "Detail page builder", description: "Choose a content type to design its entries' detail pages." },
  presentation: { title: "Presentation on Edeco", description: "Listing page heading, search, filters, sorting and URLs — per content type." },
};

const BuilderPickerPage = ({ target }) => {
  const { types } = useStudio();
  const navigate = useNavigate();
  const copy = COPY[target];
  const active = types.filter((type) => type.status !== "archived");

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      {!active.length ? (
        <EmptyState icon={Layers} title="No content types yet" description="Create a content type and add fields to its form first." action={<Button variant="primary" onClick={() => navigate("/form-builder/forms/new?kind=content")}>Create content type</Button>} />
      ) : (
        <Card className="divide-y divide-slate-100">
          {active.map((type) => {
            const version = type.published?.[target]?.version;
            return (
              <Link key={type.id} to={`/form-builder/types/${type.id}/${target}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-slate-100 text-slate-600"><Icon name={type.icon} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{type.name}</span>
                  <span className="text-xs text-slate-500">/{type.slug}</span>
                </span>
                {version ? <Badge tone={type.dirty?.[target] ? "amber" : "green"}>v{version}{type.dirty?.[target] ? " · draft changes" : ""}</Badge> : <Badge>not published</Badge>}
                <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
};

export default BuilderPickerPage;
