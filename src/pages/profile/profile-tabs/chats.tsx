import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageSquare, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react'

import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardBody, CardDescription, CardTitle } from '../../../components/ui/card'
import { TaskChatPanel } from '../../../components/app/task-chat-panel'
import { fetchAllAssignments } from '../../../lib/assignment-storage'
import { readStoredProfileDashboard } from '../../../lib/dashboard-storage'
import type { TaskAssignmentResponse, User } from '../../../types/app'

export function ChatsTab({ 
  user 
}: { 
  user: User 
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chats, setChats] = useState<TaskAssignmentResponse[]>([])
  const [selectedChat, setSelectedChat] = useState<TaskAssignmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedProjectIds, setOwnedProjectIds] = useState<number[]>([])

  const loadChats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Get owned projects to identify when current user is the owner
      const dashboard = readStoredProfileDashboard()
      const projectIds = dashboard?.projectLookups?.map((p) => p.id) || []
      setOwnedProjectIds(projectIds)

      // 2. Fetch all assignments and filter those where user is developer or project owner
      const response = await fetchAllAssignments({ page: 0, size: 100 })
      if (response.status === 'success' && response.data) {
        const filtered = response.data.content.filter(
          (a) => a.userId === user.id || projectIds.includes(a.projectId)
        )
        setChats(filtered)
        
        // Auto-select chat from URL
        const chatIdFromUrl = searchParams.get('chat_id')
        if (chatIdFromUrl) {
          const found = filtered.find(c => c.id.toString() === chatIdFromUrl)
          if (found) setSelectedChat(found)
        }
      } else {
        setError(response.message || 'Failed to load conversations.')
      }
    } catch (err) {
      console.error('Failed to load chats', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    void loadChats()
  }, [loadChats])

  const handleSelectChat = (chat: TaskAssignmentResponse) => {
    setSelectedChat(chat)
    setSearchParams({ tab: 'chats', chat_id: chat.id.toString() })
  }

  if (isLoading) {
    return (
      <Card className="w-full flex-1">
        <CardBody className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <CardTitle className="text-xl font-semibold">Loading conversations...</CardTitle>
          <CardDescription>Establishing connection and retrieving active chats.</CardDescription>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-red-100 bg-red-50/70 shadow-none flex-1">
        <CardBody className="p-8 text-center flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="text-red-600" size={36} />
          <CardTitle className="text-2xl font-bold text-slate-800">Unable to load Chats</CardTitle>
          <CardDescription className="text-red-700 max-w-sm">{error}</CardDescription>
          <Button variant="outline" onClick={() => void loadChats()} className="w-fit">
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </CardBody>
      </Card>
    )
  }

  if (chats.length === 0) {
    return (
      <Card className="w-full flex-1 bg-white">
        <CardBody className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <MessageSquare size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">No active conversations</CardTitle>
          <CardDescription className="max-w-md">
            Once you assign yourself to a task, or when developers assign themselves to tasks in your projects, you will see real-time chats here.
          </CardDescription>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 w-full h-full items-stretch">
      {/* Chats Sidebar */}
      <Card className="h-full flex flex-col overflow-hidden bg-white/80 backdrop-blur-md border border-slate-200/80">
        <CardBody className="flex flex-col h-full p-0">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">Your Conversations</h3>
            <p className="text-[11px] text-slate-400 font-medium">Select a room to begin chatting</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {chats.map((chat) => {
              const isSelected = selectedChat?.id === chat.id
              const isOwner = ownedProjectIds.includes(chat.projectId)
              const statusLower = chat.status.toLowerCase()
              const isCompleted = statusLower === 'completed'
              
              let badgeClass = "bg-amber-50 text-amber-700 border-amber-200"
              if (isCompleted) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
              else if (statusLower === 'active') badgeClass = "bg-blue-50 text-blue-700 border-blue-200"

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`group relative flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-200 shadow-sm shadow-blue-50'
                      : 'bg-white/70 border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className={`font-semibold text-sm line-clamp-1 group-hover:text-blue-700 transition-colors ${
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    }`}>
                      {chat.taskTitle}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{chat.projectName}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50/60">
                    <span className="text-[11px] font-medium text-slate-400">
                      {isOwner ? `Dev: ${chat.username}` : 'Role: Developer'}
                    </span>
                    <Badge className={`text-[10px] px-1.5 py-0.5 border ${badgeClass}`}>
                      {chat.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Chat Area */}
      <div className="h-full">
        {selectedChat ? (
          <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-5 py-2.5 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Related Task</span>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{selectedChat.taskTitle}</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/task/${selectedChat.taskId}`)}
                className="text-xs h-7 px-3 font-semibold border-blue-200 text-blue-600 hover:bg-blue-50/50 hover:border-blue-300 flex items-center gap-1"
              >
                Go to Task
                <ArrowRight size={12} />
              </Button>
            </div>
            
            <div className="flex-1 min-h-0">
              <TaskChatPanel
                assignmentId={selectedChat.id}
                currentUser={user}
                otherUserUsername={
                  ownedProjectIds.includes(selectedChat.projectId)
                    ? selectedChat.username
                    : 'Project Owner'
                }
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <Card className="h-full flex flex-col justify-center items-center text-center p-12 border border-slate-200/80 bg-white/60 backdrop-blur-md">
            <CardBody className="flex flex-col justify-center items-center max-w-sm space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
                <MessageSquare size={28} />
              </div>
              <CardTitle className="text-lg font-bold text-slate-700">No Chat Selected</CardTitle>
              <CardDescription className="text-xs leading-5">
                Choose a conversation from the list on the left to start exchanging real-time messages.
              </CardDescription>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
