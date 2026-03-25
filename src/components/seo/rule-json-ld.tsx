import { rulePath } from "@/lib/slug-url";

/** Rule 详情页 JSON-LD（CreativeWork） */
export function RuleJsonLd({
  name,
  description,
  slug,
  author,
  siteOrigin,
}: {
  name: string;
  description: string;
  slug: string;
  author: string;
  siteOrigin: string;
}) {
  const url = `${siteOrigin.replace(/\/$/, "")}${rulePath(slug)}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    description: description.slice(0, 5000),
    url,
    author: { "@type": "Person", name: author },
    genre: "Agent Rule",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
