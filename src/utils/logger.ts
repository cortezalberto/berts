type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatLogEntry(entry: LogEntry): string {
  const prefix = entry.context ? `[${entry.context}]` : ''
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown
): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }
}

function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  if (!shouldLog(level)) return

  const entry = createLogEntry(level, message, context, data)
  const formattedMessage = formatLogEntry(entry)

  switch (level) {
    case 'debug':
      console.debug(formattedMessage, data ?? '')
      break
    case 'info':
      console.info(formattedMessage, data ?? '')
      break
    case 'warn':
      console.warn(formattedMessage, data ?? '')
      break
    case 'error':
      console.error(formattedMessage, data ?? '')
      break
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: unknown) =>
    log('debug', message, context, data),
  info: (message: string, context?: string, data?: unknown) =>
    log('info', message, context, data),
  warn: (message: string, context?: string, data?: unknown) =>
    log('warn', message, context, data),
  error: (message: string, context?: string, data?: unknown) =>
    log('error', message, context, data),
}

// Error helper that logs and returns a user-friendly message
export function handleError(error: unknown, context: string): string {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  logger.error(message, context, error)
  return message
}
