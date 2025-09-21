import { describe, it, expect } from 'vitest';
import { redact, redactObject } from '../src/utils/redact.js';

describe('Redaction Utility', () => {
  describe('redact function', () => {
    describe('email redaction', () => {
      it('should redact standard email addresses', () => {
        const text = 'Contact me at john.doe@example.com for more info';
        const result = redact(text);
        expect(result).toBe('Contact me at [REDACTED] for more info');
      });

      it('should redact multiple email addresses', () => {
        const text = 'Send to alice@company.org and bob@test.net';
        const result = redact(text);
        expect(result).toBe('Send to [REDACTED] and [REDACTED]');
      });

      it('should redact emails with plus addressing', () => {
        const text = 'Use john.doe+newsletter@example.com for signup';
        const result = redact(text);
        expect(result).toBe('Use [REDACTED] for signup');
      });

      it('should redact emails with numbers and underscores', () => {
        const text = 'Contact support_team123@company-name.co.uk';
        const result = redact(text);
        expect(result).toBe('Contact [REDACTED]');
      });

      it('should not redact when email masking is disabled', () => {
        const text = 'Email: john@example.com';
        const result = redact(text, { maskEmails: false });
        expect(result).toBe('Email: john@example.com');
      });
    });

    describe('phone number redaction', () => {
      it('should redact US phone numbers with parentheses', () => {
        const text = 'Call me at (555) 123-4567 tomorrow';
        const result = redact(text);
        expect(result).toBe('Call me at [REDACTED] tomorrow');
      });

      it('should redact US phone numbers with dashes', () => {
        const text = 'My number is 555-123-4567';
        const result = redact(text);
        expect(result).toBe('My number is [REDACTED]');
      });

      it('should redact US phone numbers with dots', () => {
        const text = 'Phone: 555.123.4567';
        const result = redact(text);
        expect(result).toBe('Phone: [REDACTED]');
      });

      it('should redact US phone numbers with spaces', () => {
        const text = 'Call 555 123 4567 for support';
        const result = redact(text);
        expect(result).toBe('Call [REDACTED] for support');
      });

      it('should redact phone numbers with +1 prefix', () => {
        const text = 'International: +1 555 123 4567';
        const result = redact(text);
        expect(result).toBe('International: [REDACTED]');
      });

      it('should redact phone numbers with 1- prefix', () => {
        const text = 'Toll free: 1-555-123-4567';
        const result = redact(text);
        expect(result).toBe('Toll free: [REDACTED]');
      });

      it('should redact multiple phone numbers', () => {
        const text = 'Office: (555) 123-4567, Mobile: 555.987.6543';
        const result = redact(text);
        expect(result).toBe('Office: [REDACTED], Mobile: [REDACTED]');
      });

      it('should not redact when phone masking is disabled', () => {
        const text = 'Phone: (555) 123-4567';
        const result = redact(text, { maskPhones: false });
        expect(result).toBe('Phone: (555) 123-4567');
      });
    });

    describe('URL redaction', () => {
      it('should redact HTTP URLs', () => {
        const text = 'Visit http://example.com/path?query=value for details';
        const result = redact(text);
        expect(result).toBe('Visit [REDACTED] for details');
      });

      it('should redact HTTPS URLs', () => {
        const text = 'Check out https://secure.example.com/login';
        const result = redact(text);
        expect(result).toBe('Check out [REDACTED]');
      });

      it('should redact URLs with complex paths and parameters', () => {
        const text = 'API endpoint: https://api.example.com/v1/users?id=123&format=json';
        const result = redact(text);
        expect(result).toBe('API endpoint: [REDACTED]');
      });

      it('should redact multiple URLs', () => {
        const text = 'Visit https://example.com and http://test.org';
        const result = redact(text);
        expect(result).toBe('Visit [REDACTED] and [REDACTED]');
      });

      it('should not redact when URL masking is disabled', () => {
        const text = 'Visit https://example.com';
        const result = redact(text, { maskUrls: false });
        expect(result).toBe('Visit https://example.com');
      });
    });

    describe('LinkedIn URL redaction', () => {
      it('should redact LinkedIn profile URLs', () => {
        const text = 'Connect with me on https://linkedin.com/in/john-doe';
        const result = redact(text);
        expect(result).toBe('Connect with me on [REDACTED]');
      });

      it('should redact LinkedIn URLs with www', () => {
        const text = 'Profile: https://www.linkedin.com/in/jane-smith/';
        const result = redact(text);
        expect(result).toBe('Profile: [REDACTED]');
      });

      it('should redact LinkedIn URLs with trailing slash', () => {
        const text = 'Find me at https://linkedin.com/in/professional-name-123/';
        const result = redact(text);
        expect(result).toBe('Find me at [REDACTED]');
      });

      it('should redact multiple LinkedIn URLs', () => {
        const text = 'Connections: https://linkedin.com/in/person1 and https://www.linkedin.com/in/person2';
        const result = redact(text);
        expect(result).toBe('Connections: [REDACTED] and [REDACTED]');
      });

      it('should not redact when LinkedIn masking is disabled', () => {
        const text = 'Profile: https://linkedin.com/in/john-doe';
        const result = redact(text, { maskLinkedIn: false });
        expect(result).toBe('Profile: https://linkedin.com/in/john-doe');
      });
    });

    describe('custom replacement text', () => {
      it('should use custom replacement text', () => {
        const text = 'Email john@example.com and call (555) 123-4567';
        const result = redact(text, { replacement: '***' });
        expect(result).toBe('Email *** and call ***');
      });

      it('should use empty string as replacement', () => {
        const text = 'Contact: john@example.com';
        const result = redact(text, { replacement: '' });
        expect(result).toBe('Contact: ');
      });
    });

    describe('selective masking', () => {
      it('should only mask emails when specified', () => {
        const text = 'Email john@example.com, call (555) 123-4567, visit https://example.com';
        const result = redact(text, {
          maskEmails: true,
          maskPhones: false,
          maskUrls: false,
          maskLinkedIn: false
        });
        expect(result).toBe('Email [REDACTED], call (555) 123-4567, visit https://example.com');
      });

      it('should only mask phones when specified', () => {
        const text = 'Email john@example.com, call (555) 123-4567, visit https://example.com';
        const result = redact(text, {
          maskEmails: false,
          maskPhones: true,
          maskUrls: false,
          maskLinkedIn: false
        });
        expect(result).toBe('Email john@example.com, call [REDACTED], visit https://example.com');
      });
    });

    describe('complex scenarios', () => {
      it('should handle mixed PII in single text', () => {
        const text = 'Contact John Doe at john.doe@company.com or (555) 123-4567. LinkedIn: https://linkedin.com/in/john-doe. Website: https://johndoe.com';
        const result = redact(text);
        expect(result).toBe('Contact John Doe at [REDACTED] or [REDACTED]. LinkedIn: [REDACTED]. Website: [REDACTED]');
      });

      it('should handle edge cases with punctuation', () => {
        const text = 'Email: john@example.com. Phone: (555) 123-4567! Visit https://example.com/path for more info.';
        const result = redact(text);
        expect(result).toBe('Email: [REDACTED]. Phone: [REDACTED]! Visit [REDACTED] for more info.');
      });

      it('should handle text with no PII', () => {
        const text = 'This is a regular message with no sensitive information.';
        const result = redact(text);
        expect(result).toBe('This is a regular message with no sensitive information.');
      });

      it('should handle empty string', () => {
        const result = redact('');
        expect(result).toBe('');
      });
    });
  });

  describe('redactObject function', () => {
    it('should redact strings in objects', () => {
      const obj = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        website: 'https://johndoe.com'
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        name: 'John Doe',
        email: '[REDACTED]',
        phone: '[REDACTED]',
        website: '[REDACTED]'
      });
    });

    it('should redact strings in nested objects', () => {
      const obj = {
        user: {
          contact: {
            email: 'user@example.com',
            phone: '555-123-4567'
          },
          profile: {
            linkedin: 'https://linkedin.com/in/user'
          }
        }
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        user: {
          contact: {
            email: '[REDACTED]',
            phone: '[REDACTED]'
          },
          profile: {
            linkedin: '[REDACTED]'
          }
        }
      });
    });

    it('should redact strings in arrays', () => {
      const obj = {
        emails: ['john@example.com', 'jane@example.com'],
        phones: ['(555) 123-4567', '555.987.6543']
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        emails: ['[REDACTED]', '[REDACTED]'],
        phones: ['[REDACTED]', '[REDACTED]']
      });
    });

    it('should redact mixed content in complex structures', () => {
      const obj = {
        users: [
          {
            name: 'John',
            contact: 'john@example.com',
            social: ['https://linkedin.com/in/john', 'https://twitter.com/john']
          },
          {
            name: 'Jane',
            contact: 'jane@example.com',
            phone: '(555) 987-6543'
          }
        ],
        metadata: {
          timestamp: '2023-01-01',
          adminEmail: 'admin@company.com'
        }
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        users: [
          {
            name: 'John',
            contact: '[REDACTED]',
            social: ['[REDACTED]', '[REDACTED]']
          },
          {
            name: 'Jane',
            contact: '[REDACTED]',
            phone: '[REDACTED]'
          }
        ],
        metadata: {
          timestamp: '2023-01-01',
          adminEmail: '[REDACTED]'
        }
      });
    });

    it('should handle non-object types', () => {
      expect(redactObject('john@example.com')).toBe('[REDACTED]');
      expect(redactObject(123)).toBe(123);
      expect(redactObject(true)).toBe(true);
      expect(redactObject(null)).toBe(null);
      expect(redactObject(undefined)).toBe(undefined);
    });

    it('should handle arrays of primitives', () => {
      const arr = ['john@example.com', '(555) 123-4567', 'regular text', 123];
      const result = redactObject(arr);
      expect(result).toEqual(['[REDACTED]', '[REDACTED]', 'regular text', 123]);
    });

    it('should pass through redaction options', () => {
      const obj = {
        email: 'john@example.com',
        phone: '(555) 123-4567'
      };

      const result = redactObject(obj, { maskEmails: false, replacement: '***' });

      expect(result).toEqual({
        email: 'john@example.com',
        phone: '***'
      });
    });
  });
});