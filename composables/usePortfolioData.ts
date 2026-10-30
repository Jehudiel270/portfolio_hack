import type { CinematicIntroSettings } from '~/types/cinematic-intro';
import type { SocialLink } from '~/composables/socialNetworks';

export interface Profile {
  name: string;
  role: string;
  location: string;
  education: string;
  bio: string;
  avatarUrl: string | null;
  email: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  socialLinks: SocialLink[];
  available: boolean;
}
export interface ProjectMedia { url: string; alt: string; caption: string; sortOrder: number; }
export interface ProjectMetric { label: string; value: string; context?: string; unit?: string; period?: string; source?: string; evidenceUrl?: string; }
export interface ProjectCaseLayout { accentColor?: string; layout?: 'standard' | 'editorial'; showRole?: boolean; showContext?: boolean; showResponsibilities?: boolean; showOutcomes?: boolean; showMetrics?: boolean; showGallery?: boolean; }
export interface Project { id?: number; title: string; slug: string; description: string; tags: string[]; categories?: string[]; demoUrl: string | null; repoUrl: string | null; imageUrl: string | null; year: string | null; projectType?: string; metrics?: ProjectMetric[]; caseLayout?: ProjectCaseLayout | null; featured: boolean; caseRole?: string | null; caseContext?: string | null; responsibilities?: string[]; outcomes?: string | null; gallery?: ProjectMedia[]; publicationStatus?: 'draft' | 'published'; publishAt?: string | null; sortOrder: number; }
export interface Testimonial { id?: number; author: string; role: string | null; organization: string | null; projectId?: number | null; projectTitle?: string | null; projectSlug?: string | null; sourceUrl?: string | null; receivedAt?: string | null; quote: string; permissionConfirmed: boolean; publicationStatus: 'draft' | 'published'; sortOrder: number; }
export interface JourneyItem { id?: number; role: string; organization: string; location: string | null; startDate: string; endDate: string | null; description: string; imageUrl?: string | null; documentUrl?: string | null; documentPublic?: boolean; publicationStatus?: 'draft' | 'published'; sortOrder: number; }
export interface Education { id?: number; title: string; institution: string; degree: string; location: string | null; startDate: string; endDate: string | null; status: 'in_progress' | 'completed'; description: string; imageUrl: string | null; documentUrl?: string | null; documentPublic?: boolean; publicationStatus?: 'draft' | 'published'; sortOrder: number; }
export interface Certification { id?: number; title: string; issuer: string; issuedAt: string | null; expiresAt: string | null; credentialId: string | null; credentialUrl: string | null; skills: string[]; description: string; imageUrl: string | null; documentUrl?: string | null; documentPublic?: boolean; publicationStatus?: 'draft' | 'published'; sortOrder: number; }
export interface Achievement { id?: number; title: string; description: string; date: string | null; icon: string; sortOrder: number; }
export interface Skill { id?: number; name: string; icon?: string; level: number; category: string; sortOrder: number; }
export type AiType = 'provider' | 'model' | 'assistant' | 'tool';
export type AiAccessMode = 'web' | 'api' | 'local' | 'hybrid' | 'other';
export interface Technology { id?: number; name: string; icon: string; category: string; aiType?: AiType | null; aiProviderId?: number | null; aiAccessMode?: AiAccessMode | null; aiUseCases?: string[]; aiVerifiedAt?: string | null; description?: string | null; officialUrl?: string | null; sortOrder: number; }
export interface TechnologyCatalogItem { name: string; icon: string; category?: string; }
export interface PublicBackgroundSettings {
  showImage: boolean;
  showAmbient: boolean;
  showMaze: boolean;
  ambientIntensity: number;
  mazeIntensity: number;
  speed: number;
  darkCardOpacity: number;
}
export interface FloatingIconItem { name: string; icon: string; }
export type FloatingIconLayer = 'behind-background' | 'above-background' | 'foreground';
export interface FloatingIconSettings {
  enabled: boolean;
  maxIcons: number;
  opacity: number;
  speed: number;
  layer: FloatingIconLayer;
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
  minSpawnIntervalMs: number;
  maxSpawnIntervalMs: number;
  maxRotation: number;
  floatDistance: number;
  icons: FloatingIconItem[];
}
export interface ProjectTechnologySlot { name: string; technologies: string[]; }
export interface RichTextSettings { enabled: boolean; fields: { projectDescription: boolean; projectContext: boolean; projectOutcomes: boolean; }; }
export interface ProjectDisplaySettings { defaultLayout: 'standard' | 'editorial'; showType: boolean; showYear: boolean; showMetrics: boolean; }
export const defaultPublicBackgroundSettings: PublicBackgroundSettings = {
  showImage: true,
  showAmbient: false,
  showMaze: false,
  ambientIntensity: 35,
  mazeIntensity: 45,
  speed: 1,
  darkCardOpacity: 58,
};
export const defaultFloatingIconSettings: FloatingIconSettings = {
  enabled: false,
  maxIcons: 8,
  opacity: 20,
  speed: 1,
  layer: 'above-background',
  minSize: 32,
  maxSize: 72,
  minDuration: 5,
  maxDuration: 11,
  minSpawnIntervalMs: 1400,
  maxSpawnIntervalMs: 2600,
  maxRotation: 18,
  floatDistance: 22,
  icons: [
    { name: 'JavaScript', icon: 'logos:javascript' },
    { name: 'TypeScript', icon: 'logos:typescript-icon' },
    { name: 'Vue.js', icon: 'logos:vue' },
    { name: 'GitHub', icon: 'logos:github-icon' },
    { name: 'Code', icon: 'text:<>' },
    { name: 'Terminal', icon: 'text:$_' },
  ],
};
export const defaultRichTextSettings: RichTextSettings = {
  enabled: false,
  fields: { projectDescription: false, projectContext: false, projectOutcomes: false },
};
export const defaultProjectDisplaySettings: ProjectDisplaySettings = {
  defaultLayout: 'standard',
  showType: true,
  showYear: true,
  showMetrics: true,
};
export interface PublicSiteSettings { visiblePages: Record<string,boolean>; appointmentUrl: string | null; cvUrl: string | null; missionTypes: string[]; background?: PublicBackgroundSettings; cinematicIntro?: CinematicIntroSettings; floatingIcons?: FloatingIconSettings; technologySlots?: ProjectTechnologySlot[]; richText?: RichTextSettings; projectDisplay?: ProjectDisplaySettings; }
export interface PortfolioData { profile: Profile; projects: Project[]; journey: JourneyItem[]; educations: Education[]; certifications: Certification[]; achievements: Achievement[]; testimonials: Testimonial[]; skills: Skill[]; technologies: Technology[]; publicSettings?: PublicSiteSettings; configured: boolean; source: 'database'|'demo'|'unavailable'; }
export const demoPortfolio: PortfolioData = {
  configured: false,
  source: 'demo',
  publicSettings: { visiblePages:{parcours:true,projets:true,competences:true,ia:true,certifications:true,contact:true},appointmentUrl:null,cvUrl:null,missionTypes:[],background:defaultPublicBackgroundSettings,floatingIcons:defaultFloatingIconSettings,technologySlots:[],richText:defaultRichTextSettings,projectDisplay:defaultProjectDisplaySettings },
  profile: { name: "Carrel DOSSO", role: "Développeur Full Stack", location: "Bénin", education: "Étudiant en ABM · HECM", bio: "Je conçois des expériences web utiles, élégantes et accessibles. Du premier wireframe à la mise en production, j’aime transformer une idée en produit qui fonctionne vraiment.", avatarUrl: null, email: null, githubUrl: null, linkedinUrl: null, socialLinks: [], available: true },
  projects: [
    { title: "Line Laurence", slug: "line-laurence", description: "Site e-commerce de mode, pensé autour d’une expérience mobile fluide.", tags: ["Nuxt", "Supabase", "Tailwind"], demoUrl: null, repoUrl: null, imageUrl: null, year: "2025", featured: true, sortOrder: 1 },
    { title: "Club Otaku ENEAM", slug: "club-otaku", description: "Plateforme pour faire vivre une communauté et partager sa programmation.", tags: ["Vue", "PostgreSQL", "Cloudinary"], demoUrl: null, repoUrl: null, imageUrl: null, year: "2025", featured: true, sortOrder: 2 },
    { title: "Cheetah Speed", slug: "cheetah-speed", description: "Une interface de réservation pour un service de transport local.", tags: ["Nuxt", "Node.js", "PostgreSQL"], demoUrl: null, repoUrl: null, imageUrl: null, year: "2024", featured: true, sortOrder: 3 },
  ],
  journey: [
    { role: "Étudiant en Administration et Management des Organisations", organization: "HECM", location: "Bénin", startDate: "2024", endDate: null, description: "Un parcours en management nourri par la pratique du développement et des projets numériques.", sortOrder: 1 },
    { role: "Développeur Full Stack en apprentissage", organization: "Projets personnels", location: "Bénin", startDate: "2023", endDate: null, description: "Conception de produits web, APIs, interfaces responsives et outils communautaires.", sortOrder: 2 },
  ],
  educations: [],
  certifications: [],
  achievements: [
    { title: "Première expérience de bout en bout", description: "Conception, développement et publication d’un produit web complet.", date: "2025", icon: "Code2", sortOrder: 1 },
    { title: "Construire pour une communauté", description: "Une plateforme conçue pour rapprocher les membres d’un club étudiant.", date: "2025", icon: "UsersRound", sortOrder: 2 },
  ],
  testimonials: [],
  skills: [
    { name: "HTML / CSS", level: 95, category: "Frontend", sortOrder: 1 },
    { name: "JavaScript / TypeScript", level: 85, category: "Frontend", sortOrder: 2 },
    { name: "Vue / Nuxt", level: 82, category: "Frontend", sortOrder: 3 },
    { name: "Node.js", level: 76, category: "Backend", sortOrder: 4 },
    { name: "PostgreSQL", level: 70, category: "Backend", sortOrder: 5 },
    { name: "Tailwind CSS", level: 89, category: "Design", sortOrder: 6 },
  ],
  technologies: [
    { name: "HTML5", icon: "logos:html-5", category: "Frontend", sortOrder: 1 }, { name: "CSS3", icon: "logos:css-3", category: "Frontend", sortOrder: 2 },
    { name: "JavaScript", icon: "logos:javascript", category: "Frontend", sortOrder: 3 }, { name: "Vue.js", icon: "logos:vue", category: "Frontend", sortOrder: 4 },
    { name: "Nuxt", icon: "logos:nuxt-icon", category: "Frontend", sortOrder: 5 }, { name: "Node.js", icon: "logos:nodejs-icon", category: "Backend", sortOrder: 6 },
    { name: "PostgreSQL", icon: "logos:postgresql", category: "Backend", sortOrder: 7 }, { name: "Cloudinary", icon: "logos:cloudinary", category: "Outils", sortOrder: 8 },
  ],
};
