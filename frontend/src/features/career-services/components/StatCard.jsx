// Floating stat badge over the hero photo (e.g. "12K+ Companies Jobs").
// `icon` accepts either a react-icons component or an image src string
// (for the asset-based icons in assets/images, e.g. icon-1.webp).
const StatCard = ({ icon: Icon, value, label, accent, className = "" }) => (
  <div
    className={`absolute flex items-center gap-3 rounded-sm border border-slate-100 bg-white px-4 py-3  ${className}`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
        accent === "secondary" ? "text-secondary" : "text-primary"
      }`}
    >
      {typeof Icon === "string" ? (
        <img src={Icon} alt="" className="h-6 w-6 object-contain" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </div>
    <div className="min-w-0">
      <p className={`text-[18px] font-extrabold leading-none ${accent === "secondary" ? "text-secondary" : "text-primary"}`}>
        {value}
      </p>
      <p className="mt-1 whitespace-nowrap text-[12px] text-slate-500">{label}</p>
    </div>
  </div>
);

export default StatCard;
