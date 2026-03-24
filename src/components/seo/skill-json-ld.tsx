/** Skill 详情页 JSON-LD（SoftwareApplication + aggregateRating） */
export function SkillJsonLd({
  name,
  description,
  slug,
  author,
  siteOrigin,
  rating,
  reviewCount,
}: {
  name: string;
  description: string;
  slug: string;
  author: string;
  siteOrigin: string;
  rating: number;
  reviewCount: number;
}) {
  const url = `${siteOrigin.replace(/\/$/, "")}/skills/${slug}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description: description.slice(0, 5000),
    url,
    author: { "@type": "Person", name: author },
    applicationCategory: "AgentSkill",
    operatingSystem: "Any",
  };

  if (reviewCount > 0 && Number.isFinite(rating)) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.min(5, Math.max(1, rating)),
      ratingCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
