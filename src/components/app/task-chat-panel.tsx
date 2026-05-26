import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardBody, CardTitle } from '../ui/card'
import { readStoredUserToken } from '../../lib/auth-storage'
import { fetchChatHistory, sendChatMessage, type ChatMessageResponse } from '../../lib/chat-storage'
import type { User } from '../../types/app'

interface TaskChatPanelProps {
  assignmentId: number
  currentUser: User
  otherUserUsername: string
}

export function TaskChatPanel({
  assignmentId,
  currentUser,
  otherUserUsername,
}: TaskChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const token = readStoredUserToken()

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      try {
        const response = await fetchChatHistory(assignmentId)
        if (response.status === 'success' && response.data) {
          setMessages(response.data)
        }
      } catch (err) {
        console.error('Failed to load chat history', err)
      } finally {
        setIsLoading(false)
        setTimeout(scrollToBottom, 50)
      }
    }
    
    void loadHistory()
  }, [assignmentId])

  // Setup WebSocket / STOMP Connection
  useEffect(() => {
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP: ' + str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = () => {
      setWsConnected(true)
      client.subscribe(`/topic/chat/${assignmentId}`, (message) => {
        const newMsg: ChatMessageResponse = JSON.parse(message.body)
        setMessages((prev) => {
          // Prevent duplicates if already added locally
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        setTimeout(scrollToBottom, 50)
      })
    }

    client.onDisconnect = () => {
      setWsConnected(false)
    }

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [assignmentId, token])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message handler
  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    const messageText = content.trim()
    setContent('')
    setIsSending(true)

    try {
      const response = await sendChatMessage(assignmentId, messageText)
      if (response.status === 'success' && response.data) {
        const sentMsg = response.data
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev
          return [...prev, sentMsg]
        })
        setTimeout(scrollToBottom, 50)
      }
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="flex flex-col h-[550px] shadow-lg border border-slate-200/80 bg-white/90 backdrop-blur-md overflow-hidden">
      <CardBody className="flex flex-col h-full p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Chat with {otherUserUsername}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[11px] text-slate-400 font-medium">
                {wsConnected ? 'Live Connection Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="text-xs text-slate-400">Loading chat history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-1">
              <p className="text-sm font-semibold text-slate-700">No messages yet</p>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Send a message to kick off the conversation with the {otherUserUsername}!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm shadow-blue-100'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none shadow-sm shadow-slate-100'
                    }`}
                  >
                    <p className="leading-relaxed break-words">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {isMe ? 'You' : msg.senderUsername} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-slate-50/50 hover:bg-slate-50"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={isLoading || isSending || !content.trim()}
              className="h-10 w-10 shrink-0 rounded-xl"
              aria-label="Send message"
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
