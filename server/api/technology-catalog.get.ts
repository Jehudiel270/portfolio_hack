import { defineEventHandler } from 'h3';
import { getTechnologyCatalog } from '~/server/utils/technologyCatalog';

export default defineEventHandler(() => getTechnologyCatalog());
