'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat/chat-list'
import { ChatPanel } from '@/components/chat/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { Message } from '@/lib/types'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { EnrichedSession } from '@/auth'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: EnrichedSession
  isLoading: boolean
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  reload: () => void
  stop: () => void
}

export function Chat({ 
  id, 
  initialMessages, 
  className, 
  session, 
  isLoading,
  input,
  handleInputChange,
  handleSubmit,
  reload,
  stop,
}: ChatProps) {
  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  return (
    <div className={cn('flex w-full flex-col overflow-hidden', className)}>
      <div
        ref={scrollRef}
        className="flex-grow group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      >
        <div
          className={cn('pb-[200px] pt-4 md:pt-10')}
          ref={messagesRef}
        >
          {initialMessages?.length ? (
            <ChatList messages={initialMessages} isShared={false} session={session} />
          ) : (
            <EmptyScreen />
          )}
          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </div>
      <ChatPanel
        id={id}
        input={input}
        setInput={handleInputChange}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        reload={reload}
        stop={stop}
      />
    </div>
  )
}