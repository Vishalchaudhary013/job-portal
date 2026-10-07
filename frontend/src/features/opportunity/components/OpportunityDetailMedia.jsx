import { useCallback, useEffect, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuExternalLink,
  LuPlay,
  LuX,
} from "react-icons/lu";
import { resolveAssetUrl } from "../../../services/apiClient";

// "Office Photos" / "Video" / "Office Tour" gallery for the detail page,
// stacked in that order down the page rather than in side-by-side columns —
// two columns always left one short and the other tall. Every tile and frame
// is `rounded-sm`, matching the rest of the new detail layout.
//
// Sources are `officePhotos` and `cultureVideos` on the opportunity (one URL
// per line in the admin form), with `virtualTour` folded in as a video when it
// is set — it is the same kind of link and there is no separate slot for it.

// YouTube / Vimeo links have to be embedded in an iframe; a direct media file
// is handed to <video>. Anything else is an ordinary web page (the virtualTour
// field is documented as "360 view or video", so it is often a page) and must
// NOT be fed to a player — doing so renders a permanently black box.
const toEmbedUrl = (url) => {
  const raw = String(url || "").trim();

  const youtube = raw.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;

  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return "";
};

const VIDEO_FILE_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;

const isPlayable = (url) => Boolean(toEmbedUrl(url)) || VIDEO_FILE_RE.test(String(url || ""));

const OpportunityDetailMedia = ({ opportunity }) => {
  const item = opportunity || {};

  // Uploaded files are stored as backend-relative paths ("/uploads/..."), so
  // they have to be prefixed with the API origin — a bare relative path would
  // otherwise resolve against the frontend's own host. `resolveAssetUrl`
  // leaves pasted absolute links alone.
  const photos = (item.officePhotos || []).filter(Boolean).map(resolveAssetUrl);

  const videoSources = [...(item.cultureVideos || []), item.virtualTour].filter(Boolean);
  const videos = videoSources.filter(isPlayable).map(resolveAssetUrl);

  // Non-playable entries keep their provenance so each can be labelled: a
  // virtual-tour page is not the same thing as a stray video link.
  const links = [
    ...(item.cultureVideos || [])
      .filter((url) => url && !isPlayable(url))
      .map((url) => ({ url, label: "Open video link" })),
    item.virtualTour && !isPlayable(item.virtualTour)
      ? { url: item.virtualTour, label: "Virtual office tour" }
      : null,
  ].filter(Boolean);

  const [selectedVideo, setSelectedVideo] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  // Index, not the URL: the viewer steps through the set, and duplicate URLs
  // would otherwise be indistinguishable.
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const photoCount = photos.length;
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const stepLightbox = useCallback(
    (delta) => {
      if (!photoCount) return;
      setLightboxIndex((current) =>
        current === null ? null : (current + delta + photoCount) % photoCount,
      );
    },
    [photoCount],
  );

  // Escape closes, arrows step — and the page behind must not scroll while the
  // viewer is up.
  useEffect(() => {
    if (lightboxIndex === null) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") stepLightbox(1);
      if (event.key === "ArrowLeft") stepLightbox(-1);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, stepLightbox]);

  if (!photos.length && !videos.length && !links.length) return null;

  // Falls back to the first video rather than holding the initial state: the
  // opportunity can arrive after this mounts, and a stale "" would leave the
  // player blank with no way to recover.
  const activeVideo = videos.includes(selectedVideo) ? selectedVideo : videos[0] || "";
  const embedUrl = toEmbedUrl(activeVideo);

  return (
    <>
      {/* Own top margin rather than a wrapper in the parent: this component
          renders nothing when there is no media, and a wrapper would leave a
          stray gap after the last description block. */}
      <div className="mt-7 flex flex-col gap-8">

         {/* URLs no player can handle (a 360-tour page, a bare youtube.com link
            with no video id) are offered as links instead of a black <video>
            box that can never play. */}
        {links.length > 0 && (
          <div>
            <h2 className="text-[20px] font-bold text-primary sm:text-[24px]">
              Office Tour
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map(({ url, label }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-sm border border-primary px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  {label}
                  <LuExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Small fixed-size thumbnails rather than a fixed column count: in the
            description column a 6-track grid still made each tile ~190px. The
            lightbox carries the full-size view, so the grid only has to be
            browsable. */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-[20px] font-bold text-primary sm:text-[24px]">
              Office Photos
            </h2>
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
              {photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="aspect-square overflow-hidden rounded-sm border border-black/10 transition-colors "
                >
                  <img
                    src={photo}
                    alt={`${item.company || "Office"} photo ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <h2 className="text-[20px] font-bold text-primary sm:text-[24px]">
              {videos.length > 1 ? "Videos" : "Video"}
            </h2>

            {/* Capped: 16:9 across the full description column is still tall
                enough to swallow everything around it. */}
            <div className="mt-4 max-w-[520px] overflow-hidden rounded-sm border border-black/10 bg-black">
              <div className="relative aspect-video w-full">
                {embedUrl ? (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title={`${item.company || "Company"} office video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                ) : isPlaying ? (
                  <video
                    key={activeVideo}
                    src={activeVideo}
                    controls
                    autoPlay
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  // Poster state for a direct video file: a still with a
                  // centred play control. The "#t=0.1" media fragment is what
                  // makes the browser actually paint that frame —
                  // preload="metadata" on its own leaves the box black.
                  <>
                    <video
                      src={`${activeVideo}#t=0.1`}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      aria-label="Play video"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white ring-4 ring-white/20 transition-colors hover:bg-secondary">
                        <LuPlay className="ml-0.5 h-5 w-5" />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {videos.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {videos.map((video, index) => (
                  <button
                    key={`${video}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedVideo(video);
                      setIsPlaying(false);
                    }}
                    className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      video === activeVideo
                        ? "border-primary bg-primary text-white"
                        : "border-black/10 text-primary hover:bg-primary/5"
                    }`}
                  >
                    Video {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}


      </div>

      {/* Full-screen viewer: covers the whole viewport (above the fixed navbar
          at z-50), dismissed by the backdrop, the close button or Escape, and
          steppable through the set with the arrow keys or the side controls. */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          role="presentation"
          onClick={closeLightbox}
          className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center bg-black/90"
        >
          <button
            type="button"
            aria-label="Close photo"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-sm bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
          >
            <LuX className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(-1);
                }}
                className="absolute left-3 z-10 rounded-sm bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 sm:left-6"
              >
                <LuChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(1);
                }}
                className="absolute right-3 z-10 rounded-sm bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 sm:right-6"
              >
                <LuChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[13px] font-medium text-white/70">
                {lightboxIndex + 1} / {photos.length}
              </span>
            </>
          )}

          <img
            src={photos[lightboxIndex]}
            alt={`${item.company || "Office"} photo ${lightboxIndex + 1}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </>
  );
};

export default OpportunityDetailMedia;
