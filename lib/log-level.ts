export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const ERROR_PATTERNS = [
  /\berror\b/i,
  /\bfailed\b/i,
  /\bfatal\b/i,
  /\bexception\b/i,
  /ERR!/,
  /Cannot find/,
  /Cannot resolve/,
  /Module not found/,
  /ENOENT/,
  /panic/,
  /SyntaxError/,
  /ReferenceError/,
  /TypeError/,
];

const WARN_PATTERNS = [
  /\bwarn\b/i,
  /\bwarning\b/i,
  /deprecated/i,
  /experimental/i,
  /⚠/,
];

const DEBUG_PATTERNS = [
  /\bdebug\b/i,
  /\[debug\]/i,
];

export function detectLevel(line: string): LogLevel {
  if (ERROR_PATTERNS.some((p) => p.test(line))) return 'error';
  if (WARN_PATTERNS.some((p) => p.test(line))) return 'warn';
  if (DEBUG_PATTERNS.some((p) => p.test(line))) return 'debug';
  return 'info';
}

export function levelClass(level: LogLevel): string {
  return `log-${level}`;
}
