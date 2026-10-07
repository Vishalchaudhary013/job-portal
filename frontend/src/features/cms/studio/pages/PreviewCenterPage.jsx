import React, { useEffect, useState } from "react";
import { CreditCard, Eye, PanelsTopLeft } from "lucide-react";
import { useStudio } from "../StudioContext";
import PreviewModal from "../preview/PreviewModal";
import { Button, Card, EmptyState, FormRow, PageHeader, Select } from "../ui";

// Edeco > Preview: see any content type's DRAFT card or detail page exactly
// as Edeco would render it, with sample data or a real entry.
const PreviewCenterPage = () => {
  const { types } = useStudio();
  const active = types.filter((type) => type.status !== "archived");
  const [typeId, setTypeId] = useState(active[0]?.id || "");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!typeId && active[0]) setTypeId(active[0].id);
  }, [active, typeId]);

  if (!active.length) return <EmptyState icon={Eye} title="Nothing to preview yet" description="Create a content type and configure its card or page first." />;

  return (
    <>
      <PageHeader title="Preview on Edeco" description="Uses the current DRAFT configuration — nothing is published. Links expire after a short time and only work for admins who created them." />
      <Card className="max-w-xl space-y-4 p-5">
        <FormRow label="Content type">
          <Select value={typeId} onChange={(event) => setTypeId(event.target.value)}>
            {active.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </Select>
        </FormRow>
        <div className="flex flex-wrap gap-2">
          <Button icon={CreditCard} onClick={() => setTarget("card")} disabled={!typeId}>Preview card</Button>
          <Button icon={PanelsTopLeft} onClick={() => setTarget("page")} disabled={!typeId}>Preview detail page</Button>
        </div>
        <p className="text-xs text-slate-500">Inside the preview, switch between sample data and existing entries, and between desktop, tablet and mobile widths.</p>
      </Card>
      {typeId && <PreviewModal open={Boolean(target)} onClose={() => setTarget(null)} contentTypeId={typeId} target={target} />}
    </>
  );
};

export default PreviewCenterPage;
