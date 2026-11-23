import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Vercel Zero-Backend & Bundle Configuration (US-6.1 & US-6.3)', () => {
  it('vercel.json is configured correctly for static Vite deployment', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
    expect(config.framework).toBe('vite');
    expect(config.outputDirectory).toBe('dist');
    expect(config.buildCommand).toBe('npm run build');
  });

  it('GitHub Actions CI workflow exists for automated test & build validation', () => {
    const ciPath = path.resolve(process.cwd(), '.github/workflows/ci.yml');
    expect(fs.existsSync(ciPath)).toBe(true);

    const ciContent = fs.readFileSync(ciPath, 'utf-8');
    expect(ciContent).toContain('npm run test');
    expect(ciContent).toContain('npm run build');
  });
});
