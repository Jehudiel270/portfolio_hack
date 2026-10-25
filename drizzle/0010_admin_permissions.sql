ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS role varchar(24) NOT NULL DEFAULT 'admin';
ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS permissions jsonb;
ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

UPDATE portfolio_admins
SET role = 'super_admin'
WHERE lower(email) = 'dossoucarrel@gmail.com';

UPDATE portfolio_admins
SET permissions = CASE
      WHEN lower(email) = 'dossoucarrel@gmail.com' THEN '{}'::jsonb
      ELSE jsonb_build_object(
        'overview.view', true,
        'projects.view', true, 'projects.create', true, 'projects.update', true, 'projects.delete', true, 'projects.reorder', true, 'projects.preview', true,
        'journey.view', true, 'journey.create', true, 'journey.update', true, 'journey.delete', true, 'journey.reorder', true,
        'educations.view', true, 'educations.create', true, 'educations.update', true, 'educations.delete', true, 'educations.reorder', true,
        'certifications.view', true, 'certifications.create', true, 'certifications.update', true, 'certifications.delete', true, 'certifications.reorder', true,
        'achievements.view', true, 'achievements.create', true, 'achievements.update', true, 'achievements.delete', true, 'achievements.reorder', true
      ) || jsonb_build_object(
        'testimonials.view', true, 'testimonials.create', true, 'testimonials.update', true, 'testimonials.delete', true, 'testimonials.reorder', true,
        'skills.view', true, 'skills.create', true, 'skills.update', true, 'skills.delete', true, 'skills.reorder', true,
        'technologies.view', true, 'technologies.create', true, 'technologies.update', true, 'technologies.delete', true, 'technologies.reorder', true,
        'profile.view', true, 'profile.update', true,
        'messages.view', true, 'messages.update', true, 'messages.purge', true,
        'settings.view', true, 'settings.update', true,
        'analytics.view', true, 'activity.view', true, 'activity.undo', true, 'services.view', true,
        'uploads.create', true, 'cv.preview', true
      )
    END
WHERE permissions IS NULL;

ALTER TABLE portfolio_admins ALTER COLUMN permissions SET DEFAULT '{}'::jsonb;
ALTER TABLE portfolio_admins ALTER COLUMN permissions SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_admins_single_super_admin
  ON portfolio_admins (role)
  WHERE role = 'super_admin';
