import { defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { and, asc, eq, isNull, lte, or } from 'drizzle-orm';
import { demoPortfolio } from '~/composables/usePortfolioData';
import { resolveSocialLinks } from '~/composables/socialNetworks';
import { getDatabase } from '~/server/utils/database';
import { defaultPublicSiteSettings, readSiteSetting } from '~/server/utils/siteSettings';
import { achievements, certifications, educations, journey, profiles, projects, skills, technologies, testimonials } from '~/server/utils/schema';

export default defineEventHandler(async () => {
  if (!useRuntimeConfig().databaseUrl) return demoPortfolio;
  try {
    const db=getDatabase();const [profile]=await db.select().from(profiles).limit(1);
    if(!profile)return {...demoPortfolio,source:'unavailable' as const};
    const [projectRows,journeyRows,educationRows,certificationRows,achievementRows,testimonialRows,skillRows,technologyRows]=await Promise.all([
      db.select().from(projects).where(and(eq(projects.publicationStatus,'published'),or(isNull(projects.publishAt),lte(projects.publishAt,new Date())))).orderBy(asc(projects.sortOrder)),db.select().from(journey).orderBy(asc(journey.sortOrder)),db.select().from(educations).orderBy(asc(educations.sortOrder)),db.select().from(certifications).orderBy(asc(certifications.sortOrder)),db.select().from(achievements).orderBy(asc(achievements.sortOrder)),db.select().from(testimonials).where(and(eq(testimonials.publicationStatus,'published'),eq(testimonials.permissionConfirmed,true))).orderBy(asc(testimonials.sortOrder)),db.select().from(skills).orderBy(asc(skills.sortOrder)),db.select().from(technologies).orderBy(asc(technologies.sortOrder)),
    ]);
    const publicSettings = await readSiteSetting('public', defaultPublicSiteSettings);
    return {configured:true,source:'database' as const,profile:{name:profile.name,role:profile.role,location:profile.location,education:profile.education,bio:profile.bio,avatarUrl:profile.avatarUrl,email:profile.email,githubUrl:profile.githubUrl,linkedinUrl:profile.linkedinUrl,socialLinks:resolveSocialLinks(profile.socialLinks,profile),available:profile.available},projects:projectRows.map(p=>({...p,createdAt:undefined})),journey:journeyRows,educations:educationRows,certifications:certificationRows,achievements:achievementRows,testimonials:testimonialRows,skills:skillRows,technologies:technologyRows,publicSettings};
  } catch (error) { console.warn('[Portfolio] Database unavailable; using non-persistent preview content.', error); return {...demoPortfolio,source:'unavailable' as const}; }
});
