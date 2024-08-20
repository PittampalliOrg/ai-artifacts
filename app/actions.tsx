'use server'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage
} from '@/components/stocks'

import { z } from 'zod'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth, EnrichedSession } from '@/auth'
import { ArtifactView } from '@/components/artifact-view'
import { SandboxTemplate } from '@/lib/types'
import { runPython, writeToPage, writeToApp } from '@/lib/sandbox'

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = (await auth()) as EnrichedSession;

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.userId
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      // Save chat to your database here
    } else {
      return
    }
  }
})

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  const result = await streamUI({
    model: openai('gpt-4'),
    initial: <SpinnerMessage />,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      return <BotMessage content={content} />
    },
    tools: {
      runPython: {
        description: 'Runs Python code.',
        parameters: z.object({
          code: z.string().describe('The code to run.'),
        }),
        async execute({ code }) {
          const execOutput = await runPython('user-id', code, SandboxTemplate.CodeInterpreterMultilang, 'api-key')
          return (
            <BotCard>
              <ArtifactView result={execOutput} template={SandboxTemplate.CodeInterpreterMultilang} />
            </BotCard>
          )
        },
      },
      writeCodeToPageTsx: {
        description: 'Writes TSX code to the page.tsx file. You can use tailwind classes.',
        parameters: z.object({
          code: z.string().describe('The TSX code to write.'),
        }),
        async execute({ code }) {
          const { url } = await writeToPage('user-id', code, SandboxTemplate.NextJS, 'api-key')
          return (
            <BotCard>
              <iframe src={url} className="w-full h-[600px]" />
            </BotCard>
          )
        },
      },
      writeCodeToAppPy: {
        description: 'Writes Streamlit code to the app.py file.',
        parameters: z.object({
          code: z.string().describe('The Streamlit code to write.'),
        }),
        async execute({ code }) {
          const { url } = await writeToApp('user-id', code, SandboxTemplate.Streamlit, 'api-key')
          return (
            <BotCard>
              <iframe src={url} className="w-full h-[600px]" />
            </BotCard>
          )
        },
      },
    },
  })

  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'assistant',
        content: result.value
      }
    ]
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}