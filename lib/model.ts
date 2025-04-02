import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai'
import { createAnthropic, AnthropicProvider } from '@ai-sdk/anthropic'
import { createGroq, GroqProvider } from '@ai-sdk/groq'
import { createOllama, OllamaProvider } from 'ollama-ai-provider'
import { Provider, config } from '@/iffy.config'
import { type LanguageModelV1 } from 'ai'

type ProviderMap = {
    openai: OpenAIProvider
    anthropic: AnthropicProvider
    groq: GroqProvider
    ollama: OllamaProvider
}

type ProviderRegistryOptions = {
    apiKey?: string
    baseURL?: string
}

const providerRegistry: {
    [P in Provider]: (options?: ProviderRegistryOptions) => ProviderMap[P]
} = {
    openai: createOpenAI,
    anthropic: createAnthropic,
    groq: createGroq,
    ollama: createOllama,
}

export enum ModelType {
    Moderation = 'moderationModel',
    Judge = 'judgeModel',
}

type LoadModelProps = {
    type: ModelType,
}

export function loadModel(
    { type }: LoadModelProps,
): LanguageModelV1 {
    const modelConfig = config[type]
    const provider = modelConfig.provider
    const factory = providerRegistry[provider]
    const providerInstance = factory({
        apiKey: modelConfig.overrideApiKey,
        baseURL: modelConfig.overrideBaseURL,
    })

    return providerInstance.languageModel(modelConfig.model) as unknown as LanguageModelV1
}