import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Workspace Rules & Constraints Validation (US-1.2)', () => {
  it('AGENTS.md exists and enforces core architecture rules', () => {
    const agentsPath = path.resolve(process.cwd(), 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);

    const content = fs.readFileSync(agentsPath, 'utf-8');
    expect(content).toContain('Zero-Backend Architecture');
    expect(content).toContain('Native Context Menu Rule');
    expect(content).toContain('Eye-Comfort Design Tokens');
    expect(content).toContain('Chrome 15-Second Stall Fix');
    expect(content).toContain('Android Chrome Pause Fix');
    expect(content).toContain('Performance & Bundle Budgets');
  });

  it('Default eye-comfort dark tokens are defined in index.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--bg-canvas: #0F1117');
    expect(css).toContain('--bg-surface: #161B22');
    expect(css).toContain('--bg-elevated: #1E2530');
    expect(css).toContain('--border-subtle: #2A3241');
    expect(css).toContain('--text-primary: #E2E8F0');
    expect(css).toContain('--text-muted: #94A3B8');
    expect(css).toContain('--accent: #38BDF8');
  });
});
