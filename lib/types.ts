import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise
  | Result
  | {
      error: string
    }
>

export interface AuthResult {
  type: string
  message: string
}

export enum SandboxTemplate {
  CodeInterpreterMultilang = 'code-interpreter-multilang',
  NextJS = 'nextjs-developer',
  Streamlit = 'streamlit-developer',
}

export interface CodeExecResult {
  url: string
  stdout: string[]
  stderr: string[]
  runtimeError?: {
    name: string
    value: string
    tracebackRaw: string
  }
  cellResults: any[]
  template: SandboxTemplate
}