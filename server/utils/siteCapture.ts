export type SiteCaptureMode = 'desktop' | 'mobile' | 'fullpage';

export const MAX_SITE_CAPTURE_BYTES = 4 * 1024 * 1024;

export function buildScreenshotRequest(url: string, mode: SiteCaptureMode) {
  const viewport = mode === 'mobile'
    ? { viewport_width: 390, viewport_height: 844 }
    : { viewport_width: 1440, viewport_height: 900 };
  return {
    url,
    format: 'jpeg',
    response_type: 'by_format',
    ...viewport,
    full_page: mode === 'fullpage',
    wait_until: ['load'],
  };
}
