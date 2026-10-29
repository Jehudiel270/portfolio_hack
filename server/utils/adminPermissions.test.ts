import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_PERMISSION_GROUPS, ADMIN_PERMISSION_KEYS, normalizeAdminPermissions, requiredViewPermission, resolveAdminPermission } from '../../shared/adminPermissions';

test('permission groups expose every supported permission exactly once', () => {
  const groupedKeys = ADMIN_PERMISSION_GROUPS.flatMap((group) => group.actions.map((action) => action.key));
  assert.deepEqual([...groupedKeys].sort(), [...ADMIN_PERMISSION_KEYS].sort());
});

test('admin permission resolution maps content actions precisely', () => {
  assert.equal(resolveAdminPermission('/api/admin/content/projects', 'GET'), 'projects.view');
  assert.equal(resolveAdminPermission('/api/admin/content/projects', 'POST'), 'projects.create');
  assert.equal(resolveAdminPermission('/api/admin/content/projects/42', 'PATCH'), 'projects.update');
  assert.equal(resolveAdminPermission('/api/admin/content/projects/42', 'DELETE'), 'projects.delete');
  assert.equal(resolveAdminPermission('/api/admin/content/projects/reorder', 'PUT'), 'projects.reorder');
  assert.equal(resolveAdminPermission('/api/admin/projects/my-project/preview', 'GET'), 'projects.preview');
});

test('admin permission resolution covers operational actions', () => {
  assert.equal(resolveAdminPermission('/api/admin/profile', 'PUT'), 'profile.update');
  assert.equal(resolveAdminPermission('/api/admin/messages', 'GET'), 'messages.view');
  assert.equal(resolveAdminPermission('/api/admin/messages/42', 'PATCH'), 'messages.update');
  assert.equal(resolveAdminPermission('/api/admin/messages/purge', 'POST'), 'messages.purge');
  assert.equal(resolveAdminPermission('/api/admin/settings', 'PUT'), 'settings.update');
  assert.equal(resolveAdminPermission('/api/admin/analytics', 'GET'), 'analytics.view');
  assert.equal(resolveAdminPermission('/api/admin/activity/42/undo', 'POST'), 'activity.undo');
  assert.equal(resolveAdminPermission('/api/admin/services', 'GET'), 'services.view');
  assert.equal(resolveAdminPermission('/api/admin/upload', 'POST'), 'uploads.create');
  assert.equal(resolveAdminPermission('/api/admin/cv/preview', 'POST'), 'cv.preview');
  assert.equal(resolveAdminPermission('/api/admin/ai/draft', 'POST'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/draft', 'GET'), null);
  assert.equal(resolveAdminPermission('/api/admin/ai/image', 'POST'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/capture', 'POST'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/github-accounts', 'GET'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/github-accounts', 'POST'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/github-accounts/0f8fad5bd9cb469fa16570867728950e', 'DELETE'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/providers', 'GET'), 'ai.generate');
  assert.equal(resolveAdminPermission('/api/admin/ai/usage', 'GET'), 'ai.generate');
});

test('admin permission resolution fails closed for unknown routes and methods', () => {
  assert.equal(resolveAdminPermission('/api/admin/unknown', 'GET'), null);
  assert.equal(resolveAdminPermission('/api/admin/settings', 'POST'), null);
  assert.equal(resolveAdminPermission('/api/admin/accounts', 'GET'), null);
});

test('permission normalization only allows known explicit grants', () => {
  const permissions = normalizeAdminPermissions({ 'projects.view': true, 'projects.delete': 1, 'admin.accounts': true, 'messages.view': 'yes' });
  assert.equal(permissions['projects.view'], true);
  assert.equal(permissions['projects.delete'], false);
  assert.equal(permissions['messages.view'], false);
  assert.equal('admin.accounts' in permissions, false);
});

test('permission dependencies map AI generation to technology consultation', () => {
  assert.equal(requiredViewPermission('ai.generate'), 'technologies.view');
  assert.equal(requiredViewPermission('projects.update'), 'projects.view');
  assert.equal(requiredViewPermission('uploads.create'), null);
});
