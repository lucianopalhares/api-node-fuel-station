// emitir logs JSON em stdout/stderr, consumíveis pelo Dozzle e por coletores futuros.

type LogContext = Record<string, unknown>;

const serialize = (value: unknown): unknown => {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serialize(nestedValue)]),
    );
  }
  return value;
};

const write = (level: 'info' | 'warn' | 'error', message: string, context: LogContext = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: process.env.OBSERVABILITY_SERVICE ?? 'ipdv-api',
    message,
    ...(serialize(context) as LogContext),
  };

  const output = JSON.stringify(entry);
  if (level === 'error') console.error(output);
  else console.log(output);
};

export const logger = {
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
