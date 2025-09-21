import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadConfig, loadConfigSync, ConfigError } from '../src/utils/config.js';

const TestConfigSchema = z.object({
  blacklist_phrases: z.array(z.string()),
  slang_regex: z.string(),
});

const InvalidConfigSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const testConfigDir = path.join(process.cwd(), 'src', 'config');

describe('Config Utils', () => {
  beforeAll(async () => {
    await fs.mkdir(testConfigDir, { recursive: true });
    
    // Create a test invalid config file
    await fs.writeFile(
      path.join(testConfigDir, 'test-invalid.json'),
      JSON.stringify({ name: 'test', value: 'not-a-number' })
    );
  });

  afterAll(async () => {
    try {
      await fs.unlink(path.join(testConfigDir, 'malformed.json'));
      await fs.unlink(path.join(testConfigDir, 'test-invalid.json'));
    } catch {
      // ignore if file doesn't exist
    }
  });

  describe('loadConfig (async)', () => {
    it('should load valid JSON config', async () => {
      const config = await loadConfig('guardrails.json', TestConfigSchema);
      expect(config).toHaveProperty('blacklist_phrases');
      expect(config).toHaveProperty('slang_regex');
      expect(Array.isArray(config.blacklist_phrases)).toBe(true);
      expect(typeof config.slang_regex).toBe('string');
    });

    it('should throw ConfigError for non-existent file', async () => {
      await expect(
        loadConfig('nonexistent.json', TestConfigSchema)
      ).rejects.toThrow(ConfigError);
      
      await expect(
        loadConfig('nonexistent.json', TestConfigSchema)
      ).rejects.toThrow('Config file not found: "nonexistent.json"');
    });

    it('should throw ConfigError for invalid JSON syntax', async () => {
      await fs.writeFile(
        path.join(testConfigDir, 'malformed.json'),
        '{ "name": "test", invalid json }'
      );

      await expect(
        loadConfig('malformed.json', TestConfigSchema)
      ).rejects.toThrow(ConfigError);
      
      await expect(
        loadConfig('malformed.json', TestConfigSchema)
      ).rejects.toThrow(/Invalid JSON in config file "malformed.json"/);
    });

    it('should throw ConfigError for schema validation failure', async () => {
      try {
        await loadConfig('test-invalid.json', InvalidConfigSchema);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect(error.message).toMatch(/Config validation failed for "test-invalid.json"/);
        expect(error.message).toMatch(/value: Expected number, received string/);
      }
    });
  });

  describe('loadConfigSync', () => {
    it('should load valid JSON config synchronously', () => {
      const config = loadConfigSync('guardrails.json', TestConfigSchema);
      expect(config).toHaveProperty('blacklist_phrases');
      expect(config).toHaveProperty('slang_regex');
      expect(Array.isArray(config.blacklist_phrases)).toBe(true);
      expect(typeof config.slang_regex).toBe('string');
    });

    it('should throw ConfigError for non-existent file', () => {
      expect(() =>
        loadConfigSync('nonexistent.json', TestConfigSchema)
      ).toThrow(ConfigError);
      
      expect(() =>
        loadConfigSync('nonexistent.json', TestConfigSchema)
      ).toThrow('Config file not found: "nonexistent.json"');
    });

    it('should throw ConfigError for schema validation failure', () => {
      expect(() =>
        loadConfigSync('test-invalid.json', InvalidConfigSchema)
      ).toThrow(ConfigError);
      
      try {
        loadConfigSync('test-invalid.json', InvalidConfigSchema);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigError);
        expect(error.message).toMatch(/Config validation failed for "test-invalid.json"/);
      }
    });
  });

  describe('ConfigError', () => {
    it('should be instanceof Error', () => {
      const error = new ConfigError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigError');
      expect(error.message).toBe('test message');
    });

    it('should store cause when provided', () => {
      const cause = new Error('original error');
      const error = new ConfigError('wrapper message', cause);
      expect(error.cause).toBe(cause);
    });
  });
});