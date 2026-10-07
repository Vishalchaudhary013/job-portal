import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { Mail, QrCode, Link as LucideLink } from "lucide-react";
import { FaCopy, FaLinkedinIn } from "react-icons/fa";
import { FaFacebookF, FaWhatsapp, FaXTwitter, FaInstagram } from "react-icons/fa6";

const ShareModal = ({
  isOpen = true,
  onClose,
  eventTitle,
  shareUrl,
  inline = false,
  title = "Share Event"
}) => {
  const [activeTab, setActiveTab] = useState("Share Link");
  const [copied, setCopied] = useState(false);

  if (!isOpen && !inline) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareUrl)}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = eventTitle ? eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'event';
      a.download = `${safeTitle}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download QR code", error);
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareUrl)}`, "_blank");
    }
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    if (!inline) {
      e.stopPropagation();
    }
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[22px] font-semibold ${inline ? 'text-gray-800' : 'text-[#1F2853]'}`}>{title}</h3>
        {!inline && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose && onClose();
            }}
            className="rounded-full p-2 text-black/55 hover:bg-black/5 hover:text-black cursor-pointer transition"
          >
            <IoClose size={20} />
          </button>
        )}
      </div>

      <div className="min-h-[160px] flex flex-col justify-center">
        <div className="animate-in fade-in duration-150">
          <div className="flex items-start gap-4 overflow-x-auto pb-2 px-2 hide-scrollbar">
            <a href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Check out this event: " + eventTitle)}&body=${encodeURIComponent("Check it out here: " + shareUrl)}`} onClick={(e) => e.stopPropagation()} className="group flex min-w-18 flex-col items-center gap-2 text-sm text-black/80 cursor-pointer">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-black/5 text-black group-hover:bg-black/10 duration-300"><Mail size={20} /></span><span className="font-medium ">Email</span>
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out: " + eventTitle + " - " + shareUrl)}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="group flex min-w-18 flex-col items-center gap-2 text-sm text-black/80 cursor-pointer">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#22BE74] text-white"><FaWhatsapp size={28} /></span><span className="font-medium ">WhatsApp</span>
            </a>
            <button onClick={(e) => { e.stopPropagation(); copyLink(); alert("Link copied! Paste in Instagram."); }} className="group flex min-w-18 flex-col items-center gap-2 text-sm text-black/80 cursor-pointer">
              <span className="grid h-14 w-14 place-items-center rounded-full text-white bg-gradient-to-tr from-[#FF4E45] via-[#ee2a7b] to-[#6228d7]"><FaInstagram size={22} /></span><span className="font-medium ">Instagram</span>
            </button>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                shareUrl
              )}`}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noreferrer"
              className="group flex min-w-18 flex-col items-center gap-2 text-sm text-black/80 cursor-pointer"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#1F2853] text-white">
                <FaLinkedinIn size={22} />
              </span>

              <span className="font-medium">
                LinkedIn
              </span>
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out: " + eventTitle)}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="group flex min-w-18 flex-col items-center gap-2 text-sm text-black/80 cursor-pointer">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><FaXTwitter size={22} /></span><span className="font-medium ">X</span>
            </a>
          </div>
          <div className="flex items-center gap-2 mb-2 mt-4">
            <div className="flex-1 border border-black/10 rounded-lg overflow-hidden flex items-center bg-gray-50/50">
              <input type="text" readOnly value={shareUrl} onClick={(e) => e.stopPropagation()} className="px-3 py-2 text-sm text-black/70 flex-1 bg-transparent outline-none" />
              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); copyLink(); }} className="flex items-center gap-2 bg-white border-l border-black/20 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition cursor-pointer">
                <FaCopy /> <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center animate-in fade-in duration-150 py-2">
            <p className="text-gray-500 text-sm mb-3 text-center font-medium">Scan or download this QR code to Share</p>
            <div className="p-3 bg-white border border-black/10 rounded-2xl shadow-xs mb-4 hover:shadow-md hover:border-[#1F2853]/30 transition-all duration-300">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`} alt="Event QR Code" className="w-36 h-36" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                downloadQRCode();
              }}
              className="bg-[#1F2853] hover:bg-[#160079] hover:-translate-y-0.5 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <QrCode size={16} />
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow p-5 mb-8 rounded-2xl w-full">
        {content}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClose && onClose();
      }}
    >
      <div
        className="relative w-[90%] max-w-[490px] rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={handleModalClick}
      >
        {content}
      </div>
    </div>
  );
};

export default ShareModal;
