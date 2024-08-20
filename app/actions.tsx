'use server'

import { createAI, createStreamableUI, Message } from 'ai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { z } from 'zod'
import { auth, EnrichedSession } from '@/auth'
import { ArtifactView } from '@/components/artifact-view'
import { SandboxTemplate } from '@/lib/types'
import { runPython, writeToPage, writeToApp } from '@/lib/sandbox'
import { nanoid } from 'nanoid'

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export const AI = createAI({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})

async function submitUserMessage(content: string) {
  const aiState = AI.getAIState()
  const session = (await auth()) as EnrichedSession

  if (!session) {
    throw new Error('Not authenticated')
  }

  aiState.messages.push({
    id: nanoid(),
    role: 'user',
    content
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: aiState.messages,
    stream: true
  })

  const stream = OpenAIStream(response)
  
  return new StreamingTextResponse(stream)
}

export const getUIStateFromAIState = (aiState: AIState) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display: message.content
    }))
}