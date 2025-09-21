import { z } from 'zod';
export declare class ConfigError extends Error {
    cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare function loadConfig<T>(filename: string, schema: z.ZodSchema<T>): Promise<T>;
export declare function loadConfigSync<T>(filename: string, schema: z.ZodSchema<T>): T;
//# sourceMappingURL=config.d.ts.map