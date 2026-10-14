import { describe, expect, it } from 'vitest';
import { buildLeads, detectMapping, normalizeLinkedInUrl } from './import';

describe('detectMapping', () => {
  it('maps common Sales Navigator headers', () => {
    const mapping = detectMapping([
      'First Name',
      'Last Name',
      'Title',
      'Company',
      'Profile URL',
      'Email',
    ]);
    expect(mapping).toEqual({
      first_name: 'First Name',
      last_name: 'Last Name',
      title: 'Title',
      company: 'Company',
      linkedin_url: 'Profile URL',
      email: 'Email',
    });
  });
});

describe('normalizeLinkedInUrl', () => {
  it('canonicalizes profile URLs and rejects other hosts', () => {
    expect(normalizeLinkedInUrl('linkedin.com/in/jane-doe/?trk=x')).toBe(
      'https://www.linkedin.com/in/jane-doe'
    );
    expect(normalizeLinkedInUrl('https://example.com/in/jane')).toBeNull();
    expect(normalizeLinkedInUrl('')).toBeNull();
  });
});

describe('buildLeads', () => {
  it('skips invalid rows and merges duplicates by profile URL', () => {
    const mapping = { first_name: 'First', last_name: 'Last', linkedin_url: 'URL', company: 'Co' };
    const rows = [
      { First: 'Ana', Last: 'Khan', URL: 'https://linkedin.com/in/ana/', Co: 'Acme' },
      { First: 'Ana', Last: 'Khan (new)', URL: 'linkedin.com/in/ana', Co: 'Acme 2' },
      { First: '', Last: '', URL: '', Co: 'Ghost' },
    ];
    const result = buildLeads(rows, mapping);
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0].last_name).toBe('Khan (new)');
    expect(result.errors).toEqual([{ row: 4, reason: expect.any(String) }]);
    expect(result.duplicatesInFile).toBe(1);
  });
});
