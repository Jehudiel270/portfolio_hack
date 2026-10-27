import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { admins, profiles, projects, journey, achievements, skills, technologies } from '../server/utils/schema';
import { SUPER_ADMIN_EMAIL } from '../shared/adminPermissions';

const url = process.env.DATABASE_URL || '';
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!url) throw new Error('DATABASE_URL doit être configurée avant le bootstrap.');
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL doit contenir une adresse valide.');
if (email !== SUPER_ADMIN_EMAIL) throw new Error(`ADMIN_EMAIL doit être ${SUPER_ADMIN_EMAIL}, seul super-administrateur autorisé.`);
if (password.length < 8) throw new Error('ADMIN_PASSWORD doit contenir au moins 8 caractères.');
const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10, prepare: false });
const db = drizzle(sql);
try {
  for (const name of ['0001_portfolio.sql', '0002_portfolio_content_expansion.sql', '0003_profile_social_links.sql', '0004_education_certifications.sql', '0005_ai_catalog_metadata.sql', '0006_projects_testimonials.sql', '0007_admin_operations.sql', '0008_ai_usage_metadata.sql', '0009_admin_totp.sql', '0010_admin_permissions.sql', '0011_project_metrics_and_layout.sql', '0012_admin_display_names.sql']) {
    const migration = await readFile(resolve('drizzle', name), 'utf8');
    for (const statement of migration.split(';').map(s => s.trim()).filter(Boolean)) await sql.unsafe(statement);
  }
  const [existing] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
  if (existing) throw new Error('Ce compte administrateur existe déjà; aucune modification de mot de passe n’a été effectuée.');
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(admins).values({ email, displayName: 'Carrel DOSSOU', passwordHash, role: 'super_admin' });
  await db.insert(profiles).values({ id: 1, name: 'Carrel DOSSO', role: 'Développeur Full Stack', location: 'Bénin', education: 'Étudiant en ABM · HECM', bio: 'Je conçois des expériences web utiles, élégantes et accessibles. Du premier wireframe à la mise en production, j’aime transformer une idée en produit qui fonctionne vraiment.', email: process.env.CONTACT_FALLBACK_TO || email, available: true }).onConflictDoNothing({ target: profiles.id });
  await db.insert(projects).values([
    { title:'Line Laurence',slug:'line-laurence',description:'Site e-commerce de mode, pensé autour d’une expérience mobile fluide.',tags:['Nuxt','Supabase','Tailwind'],year:'2025',featured:true,sortOrder:1 },
    { title:'Club Otaku ENEAM',slug:'club-otaku',description:'Plateforme pour faire vivre une communauté et partager sa programmation.',tags:['Vue','PostgreSQL','Cloudinary'],year:'2025',featured:true,sortOrder:2 },
    { title:'Cheetah Speed',slug:'cheetah-speed',description:'Une interface de réservation pour un service de transport local.',tags:['Nuxt','Node.js','PostgreSQL'],year:'2024',featured:true,sortOrder:3 },
  ]).onConflictDoNothing({ target: projects.slug });
  await db.insert(journey).values([
    { role:'Étudiant en Administration et Management des Organisations',organization:'HECM',location:'Bénin',startDate:'2024',description:'Un parcours en management nourri par la pratique du développement et des projets numériques.',sortOrder:1 },
    { role:'Développeur Full Stack en apprentissage',organization:'Projets personnels',location:'Bénin',startDate:'2023',description:'Conception de produits web, APIs, interfaces responsives et outils communautaires.',sortOrder:2 },
  ]).onConflictDoNothing();
  await db.insert(achievements).values([
    { title:'Première expérience de bout en bout',description:'Conception, développement et publication d’un produit web complet.',date:'2025',icon:'Code2',sortOrder:1 },
    { title:'Construire pour une communauté',description:'Une plateforme conçue pour rapprocher les membres d’un club étudiant.',date:'2025',icon:'UsersRound',sortOrder:2 },
  ]).onConflictDoNothing();
  await db.insert(skills).values([
    {name:'HTML / CSS',level:95,category:'Frontend',sortOrder:1},{name:'JavaScript / TypeScript',level:85,category:'Frontend',sortOrder:2},{name:'Vue / Nuxt',level:82,category:'Frontend',sortOrder:3},{name:'Node.js',level:76,category:'Backend',sortOrder:4},{name:'PostgreSQL',level:70,category:'Backend',sortOrder:5},{name:'Tailwind CSS',level:89,category:'Design',sortOrder:6},
  ]).onConflictDoNothing();
  await db.insert(technologies).values([
    {name:'HTML5',icon:'H',category:'Frontend',sortOrder:1},{name:'CSS3',icon:'C',category:'Frontend',sortOrder:2},{name:'JavaScript',icon:'JS',category:'Frontend',sortOrder:3},{name:'Vue.js',icon:'V',category:'Frontend',sortOrder:4},{name:'Nuxt',icon:'N',category:'Frontend',sortOrder:5},{name:'Node.js',icon:'node',category:'Backend',sortOrder:6},{name:'PostgreSQL',icon:'pg',category:'Backend',sortOrder:7},{name:'Cloudinary',icon:'☁',category:'Outils',sortOrder:8},
  ]).onConflictDoNothing();
  console.log('Initialisation terminée. Le compte super-administrateur et les contenus initiaux sont en place. Retire ADMIN_PASSWORD de l’environnement maintenant.');
} finally { await sql.end({ timeout: 5 }); }
