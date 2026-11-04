export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — P.O.I | Person of Interest` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — P.O.I` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
