import { PageId, PAGES, PageDefinition } from '../types';

export function getPageDefinition(pageId: string): PageDefinition {
  if (pageId in PAGES) {
    return PAGES[pageId as PageId];
  }
  return PAGES.home;
}

export function isValidPageId(id: string): id is PageId {
  return id in PAGES;
}

export function getAllPageList(): PageDefinition[] {
  return Object.values(PAGES);
}

export function getNextPage(current: PageId): PageId {
  const keys: PageId[] = ['home', 'the-god-cypher', 'chi-siamo', 'prenota-sessione', 'plugin-innovation', 'strumenti-online', 'il-mio-account'];
  const idx = keys.indexOf(current);
  if (idx === -1 || idx === keys.length - 1) return keys[0];
  return keys[idx + 1];
}

export function formatStudioBadge(text: string): string {
  return text.trim().toUpperCase();
}
