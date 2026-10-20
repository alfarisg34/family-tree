import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvironment() {
  for (const file of ['.env', '.env.local']) {
    const filename = resolve(file);
    if (existsSync(filename)) process.loadEnvFile(filename);
  }
}
