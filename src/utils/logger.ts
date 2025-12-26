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

// Generic user-friendly error messages (don't expose internal details)
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  network: 'Error de conexión. Verifica tu internet.',
  validation: 'Los datos ingresados no son válidos.',
  notfound: 'El recurso solicitado no existe.',
  unauthorized: 'No tienes permisos para esta acción.',
  default: 'Ocurrió un error. Intenta nuevamente.',
}

// Classify error type for user-friendly messaging
function classifyError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
      return 'network'
    }
    if (msg.includes('validation') || msg.includes('invalid')) {
      return 'validation'
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return 'notfound'
    }
    if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) {
      return 'unauthorized'
    }
  }
  return 'default'
}

// Error helper that logs internally but returns a safe user-friendly message
export function handleError(error: unknown, context: string): string {
  // Log the full error internally for debugging (only visible in console)
  const internalMessage = error instanceof Error ? error.message : 'Error desconocido'
  logger.error(internalMessage, context, error)

  // Return a safe, user-friendly message (no internal details exposed)
  const errorType = classifyError(error)
  return USER_FRIENDLY_MESSAGES[errorType]
}
