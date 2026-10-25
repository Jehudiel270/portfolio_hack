export const ADMIN_PERMISSION_KEYS = [
  'overview.view',
  'projects.view', 'projects.create', 'projects.update', 'projects.delete', 'projects.reorder', 'projects.preview',
  'journey.view', 'journey.create', 'journey.update', 'journey.delete', 'journey.reorder',
  'educations.view', 'educations.create', 'educations.update', 'educations.delete', 'educations.reorder',
  'certifications.view', 'certifications.create', 'certifications.update', 'certifications.delete', 'certifications.reorder',
  'achievements.view', 'achievements.create', 'achievements.update', 'achievements.delete', 'achievements.reorder',
  'testimonials.view', 'testimonials.create', 'testimonials.update', 'testimonials.delete', 'testimonials.reorder',
  'skills.view', 'skills.create', 'skills.update', 'skills.delete', 'skills.reorder',
  'technologies.view', 'technologies.create', 'technologies.update', 'technologies.delete', 'technologies.reorder',
  'profile.view', 'profile.update',
  'messages.view', 'messages.update', 'messages.purge',
  'settings.view', 'settings.update',
  'analytics.view',
  'activity.view', 'activity.undo',
  'services.view',
  'uploads.create',
  'cv.preview',
] as const;

export type AdminPermission = typeof ADMIN_PERMISSION_KEYS[number];
export type AdminPermissions = Partial<Record<AdminPermission, boolean>>;
export const SUPER_ADMIN_EMAIL = 'dossoucarrel@gmail.com';

export const ADMIN_PERMISSION_GROUPS: { id: string; label: string; actions: { key: AdminPermission; label: string }[] }[] = [
  { id: 'overview', label: 'Vue d’ensemble', actions: [{ key: 'overview.view', label: 'Consulter' }] },
  ...([
    ['projects', 'Projets'],
    ['journey', 'Expériences & parcours'],
    ['educations', 'Formations & diplômes'],
    ['certifications', 'Certifications'],
    ['achievements', 'Réalisations'],
    ['testimonials', 'Témoignages'],
    ['skills', 'Compétences'],
    ['technologies', 'Technologies & IA'],
  ] as const).map(([id, label]) => ({
    id,
    label,
    actions: [
      { key: `${id}.view` as AdminPermission, label: 'Consulter' },
      { key: `${id}.create` as AdminPermission, label: 'Créer' },
      { key: `${id}.update` as AdminPermission, label: 'Modifier' },
      { key: `${id}.delete` as AdminPermission, label: 'Supprimer' },
      { key: `${id}.reorder` as AdminPermission, label: 'Réordonner' },
      ...(id === 'projects' ? [{ key: 'projects.preview' as AdminPermission, label: 'Prévisualiser' }] : []),
    ],
  })),
  { id: 'profile', label: 'Profil & image', actions: [{ key: 'profile.view', label: 'Consulter' }, { key: 'profile.update', label: 'Modifier' }] },
  { id: 'messages', label: 'Messages', actions: [{ key: 'messages.view', label: 'Consulter' }, { key: 'messages.update', label: 'Traiter / archiver' }, { key: 'messages.purge', label: 'Purger' }] },
  { id: 'settings', label: 'Réglages', actions: [{ key: 'settings.view', label: 'Consulter' }, { key: 'settings.update', label: 'Modifier' }] },
  { id: 'analytics', label: 'Statistiques', actions: [{ key: 'analytics.view', label: 'Consulter' }] },
  { id: 'activity', label: 'Journal admin', actions: [{ key: 'activity.view', label: 'Consulter' }, { key: 'activity.undo', label: 'Restaurer une action' }] },
  { id: 'services', label: 'Services', actions: [{ key: 'services.view', label: 'Vérifier l’état' }] },
  { id: 'uploads', label: 'Médias & CV', actions: [{ key: 'uploads.create', label: 'Téléverser des médias' }, { key: 'cv.preview', label: 'Analyser un CV' }] },
];

export function normalizeAdminPermissions(value: unknown): AdminPermissions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(ADMIN_PERMISSION_KEYS.map((key) => [key, source[key] === true])) as AdminPermissions;
}

export function resolveAdminPermission(path: string, method: string): AdminPermission | null {
  const contentMatch = path.match(/^\/api\/admin\/content\/(projects|journey|educations|certifications|achievements|testimonials|skills|technologies)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (contentMatch) {
    const [, resource, segment, trailing] = contentMatch;
    if (!segment) return `${resource}.${method === 'GET' ? 'view' : method === 'POST' ? 'create' : 'view'}` as AdminPermission;
    if (segment === 'reorder' && method === 'PUT') return `${resource}.reorder` as AdminPermission;
    if (trailing && /^\d+$/u.test(segment)) return `${resource}.${method === 'PATCH' ? 'update' : 'view'}` as AdminPermission;
    if (/^\d+$/u.test(segment)) return `${resource}.${method === 'PATCH' ? 'update' : method === 'DELETE' ? 'delete' : 'view'}` as AdminPermission;
    return null;
  }

  if (path === '/api/admin/profile') return method === 'GET' ? 'profile.view' : method === 'PUT' ? 'profile.update' : null;
  if (path === '/api/admin/messages') return method === 'GET' ? 'messages.view' : null;
  if (path === '/api/admin/messages/purge') return method === 'POST' ? 'messages.purge' : null;
  if (/^\/api\/admin\/messages\/\d+$/u.test(path)) return method === 'PATCH' ? 'messages.update' : null;
  if (path === '/api/admin/settings') return method === 'GET' ? 'settings.view' : method === 'PUT' ? 'settings.update' : null;
  if (path === '/api/admin/analytics') return method === 'GET' ? 'analytics.view' : null;
  if (path === '/api/admin/activity') return method === 'GET' ? 'activity.view' : null;
  if (/^\/api\/admin\/activity\/\d+\/undo$/u.test(path)) return method === 'POST' ? 'activity.undo' : null;
  if (path === '/api/admin/services') return method === 'GET' ? 'services.view' : null;
  if (path === '/api/admin/upload') return method === 'POST' ? 'uploads.create' : null;
  if (path === '/api/admin/cv/preview') return method === 'POST' ? 'cv.preview' : null;
  if (/^\/api\/admin\/projects\/[^/]+\/preview$/u.test(path)) return method === 'GET' ? 'projects.preview' : null;
  return null;
}
