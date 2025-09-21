import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

export class ConfigError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ConfigError';
  }
}

export async function loadConfig<T>(
  filename: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const configPath = path.join(process.cwd(), 'src', 'config', filename);
  
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
    
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new ConfigError(
        `Invalid JSON in config file "${filename}": ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        parseError instanceof Error ? parseError : undefined
      );
    }
    
    const result = schema.safeParse(jsonData);
    if (!result.success) {
      const errorMessages = result.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new ConfigError(
        `Config validation failed for "${filename}":\n${errorMessages.join('\n')}`
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new ConfigError(`Config file not found: "${filename}"`);
    }
    
    throw new ConfigError(
      `Failed to load config file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

export function loadConfigSync<T>(
  filename: string,
  schema: z.ZodSchema<T>
): T {
  const configPath = path.join(process.cwd(), 'src', 'config', filename);
  
  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new ConfigError(
        `Invalid JSON in config file "${filename}": ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        parseError instanceof Error ? parseError : undefined
      );
    }
    
    const result = schema.safeParse(jsonData);
    if (!result.success) {
      const errorMessages = result.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new ConfigError(
        `Config validation failed for "${filename}":\n${errorMessages.join('\n')}`
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new ConfigError(`Config file not found: "${filename}"`);
    }
    
    throw new ConfigError(
      `Failed to load config file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}