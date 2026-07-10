/**
 * Transaction Zod schema for request validation.
 * Satisfies: Requirements 1.1, 1.2
 */

import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  type: z.enum(['LC', 'SKBDN'], {
    error: 'Transaction type must be LC or SKBDN',
  }),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
