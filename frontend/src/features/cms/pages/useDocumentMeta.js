import { useEffect } from "react";

// Sets the document title / description / robots for a page and restores
// the previous values on unmount.
const setMeta = (name, content) => {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  const previous = tag?.getAttribute("content") ?? null;
  if (content == null) return () => {};
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
  return () => {
    if (previous === null) tag.remove();
    else tag.setAttribute("content", previous);
  };
};

const useDocumentMeta = ({ title, description, robots } = {}) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = `${title} | Edeco`;
    const restoreDescription = setMeta("description", description ? String(description).slice(0, 160) : null);
    const restoreRobots = setMeta("robots", robots || null);
    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreRobots();
    };
  }, [title, description, robots]);
};

export default useDocumentMeta;
