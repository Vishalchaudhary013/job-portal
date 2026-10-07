import { FormBuilderProvider } from "./context/FormBuilderContext";
import FormBuilder from "./FormBuilder";

const ApplicationFormBuilder = ({ programId, initialTemplateId }) => {
  return (
    <div className="h-full">
      <FormBuilder initialTemplateId={initialTemplateId} />
    </div>
  );
};

export default ApplicationFormBuilder;