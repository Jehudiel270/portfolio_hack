import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3';

export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname.startsWith('/api/admin/')) {
    setResponseHeader(event, 'cache-control', 'no-store');
  }
});
