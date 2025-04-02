import { z } from 'zod'

export const providerEnum = z.enum(['openai', 'anthropic', 'groq', 'ollama'])

export const baseModelSchema = z.object({
    provider: providerEnum,
    model: z.string().min(1),
    overrideApiKey: z.string().optional(),
    overrideBaseURL: z.string().url().optional(),
})

export const iffyConfigSchema = z.object({
    moderationModel: baseModelSchema,
    judgeModel: baseModelSchema,
})

export type Provider = z.infer<typeof providerEnum>
export type BaseModel = z.infer<typeof baseModelSchema>
export type IffyConfig = z.infer<typeof iffyConfigSchema>


const rawConfig = {
    moderationModel: {
        provider: 'groq',
        model: 'llama3-8192',
        overrideApiKey: undefined,
        overrideBaseURL: undefined,
    },
    judgeModel: {
        provider: 'groq',
        model: 'llama3-8b-8192',
        overrideApiKey: undefined,
        overrideBaseURL: undefined,
    },
}

export const config = iffyConfigSchema.parse(rawConfig)