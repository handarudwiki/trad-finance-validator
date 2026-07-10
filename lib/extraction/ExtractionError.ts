/**
 * Custom error class for extraction failures.
 * Provides structured error information for the orchestrator to handle.
 * Satisfies: Requirements 3.6, 6.4
 */

export class ExtractionError extends Error {
  public readonly code: string
  public readonly documentType?: string

  constructor(message: string, options?: { code?: string; documentType?: string; cause?: unknown }) {
    super(message)
    this.name = 'ExtractionError'
    this.code = options?.code ?? 'EXTRACTION_FAILED'
    this.documentType = options?.documentType
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}
