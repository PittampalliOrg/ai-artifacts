'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { useLocalStorage } from 'usehooks-ts'

import { Chat } from '@/components/chat/chat'
import { SideView } from '@/components/side-view'
import { SandboxTemplate } from '@/lib/types'
import NavBar from '@/components/navbar'

import { AuthDialog } from '@/components/AuthDialog'
import { useAuth } from '@/lib/auth'

import { LLMModel, LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { signOut } from '@/auth'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage('template', SandboxTemplate.CodeInterpreterMultilang)
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-20240620'
  })

  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const { session, apiKey } = useAuth(setAuthDialog)

  const filteredModels = modelsList.models.filter((model: LLMModel) => {
    if (process.env.NEXT_PUBLIC_USE_HOSTED_MODELS === 'true') {
      return model.hosted
    }
    return true
  })

  const currentModel = filteredModels.find((model: LLMModel) => model.id === languageModel.model)

  const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
    api: '/api/chat',
    body: {
      userID: session?.user.id,
      template: selectedTemplate,
      model: currentModel,
      config: languageModel,
      apiKey,
    },
  })

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    setChatInput(e.target.value)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    append({
      content: input,
      role: 'user',
    })
    setChatInput('')
    setInput('')
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {session && <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} />}
      <NavBar
        session={session}
        showLogin={() => setAuthDialog(true)}
        signOut={() => signOut()}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        models={filteredModels}
        languageModel={languageModel}
        onLanguageModelChange={handleLanguageModelChange}
        apiKeyConfigurable={!process.env.NEXT_PUBLIC_USE_HOSTED_MODELS}
      />

      <div className="flex-1 flex space-x-8 w-full pt-36 pb-8 px-4">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          reload={reload}
          stop={stop}
        />
        <SideView
          toolInvocation={messages.find(m => m.role === 'assistant')?.content}
          selectedTemplate={selectedTemplate}
        />
      </div>
    </main>
  )
}