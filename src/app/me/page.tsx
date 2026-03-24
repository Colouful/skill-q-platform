import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, findAgentBySessionCookie } from "@/lib/agent-auth";
import { MeAuthPanel } from "@/components/me/me-auth-panel";
import { MeProfilePanel } from "@/components/me/me-profile-panel";

export const dynamic = "force-dynamic";

const REVIEWS_PER_PAGE = 6;

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; revPage?: string }>;
}) {
  const sp = await searchParams;
  const initialTab = sp.tab === "login" ? "login" : "register";
  const revPageRaw = Number.parseInt(sp.revPage ?? "1", 10);
  const revPage = Number.isFinite(revPageRaw) && revPageRaw >= 1 ? revPageRaw : 1;
  const reviewsSkip = (revPage - 1) * REVIEWS_PER_PAGE;

  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  const hit = await findAgentBySessionCookie(sid);

  if (!hit) {
    return (
      <div className="mx-auto w-full max-w-screen-md px-3 py-10 sm:px-4">
        <MeAuthPanel key={initialTab} initialTab={initialTab} />
      </div>
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id: hit.agent.id },
    select: {
      id: true,
      name: true,
      slug: true,
      avatar: true,
      level: true,
      levelName: true,
      experience: true,
      uploadsCount: true,
      downloadsCount: true,
      apiCallsTotal: true,
    },
  });

  if (!agent) {
    return (
      <div className="mx-auto w-full max-w-screen-md px-3 py-10 sm:px-4">
        <MeAuthPanel />
      </div>
    );
  }

  const [recentSkills, recentRules, reviewsBatch, skillRatings, ruleRatings] = await Promise.all([
    prisma.skill.findMany({
      where: { authorAgentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { slug: true, name: true, createdAt: true },
    }),
    prisma.rule.findMany({
      where: { authorAgentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { slug: true, name: true, createdAt: true },
    }),
    prisma.review.findMany({
      where: { authorAgentId: agent.id },
      orderBy: { createdAt: "desc" },
      skip: reviewsSkip,
      take: REVIEWS_PER_PAGE + 1,
      select: {
        id: true,
        resourceType: true,
        rating: true,
        content: true,
        createdAt: true,
        skill: { select: { slug: true } },
        rule: { select: { slug: true } },
      },
    }),
    prisma.skill.findMany({
      where: { authorAgentId: agent.id },
      select: { rating: true },
    }),
    prisma.rule.findMany({
      where: { authorAgentId: agent.id },
      select: { rating: true },
    }),
  ]);

  const reviewHasMore = reviewsBatch.length > REVIEWS_PER_PAGE;
  const recentReviews = reviewHasMore ? reviewsBatch.slice(0, REVIEWS_PER_PAGE) : reviewsBatch;

  const ratingValues = [
    ...skillRatings.map((s) => s.rating),
    ...ruleRatings.map((r) => r.rating),
  ];
  const avgResourceRating =
    ratingValues.length > 0
      ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
      : null;

  return (
    <div className="mx-auto w-full max-w-screen-md px-3 py-10 sm:px-4">
      <MeProfilePanel
        agent={{ ...agent, avgResourceRating }}
        activity={{
          skills: recentSkills,
          rules: recentRules,
          reviews: recentReviews,
          reviewsPagination: { page: revPage, hasMore: reviewHasMore },
        }}
      />
    </div>
  );
}
