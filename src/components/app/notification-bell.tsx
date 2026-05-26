import { Bell, Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { cn } from '../../lib/utils'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle size={16} className="text-green-500" />
      case 'WARNING':
        return <AlertTriangle size={16} className="text-amber-500" />
      default:
        return <Info size={16} className="text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in fade-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                  <Bell size={24} />
                </div>
                <p className="text-sm font-medium text-slate-900">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">We'll notify you when something important happens.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={cn(
                    'flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative',
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50 border-l-2 border-blue-500 rounded-l-none'
                  )}
                >
                  <div className="mt-1 shrink-0">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-tight break-words transition-colors',
                        notif.read ? 'text-slate-600' : 'text-slate-900 font-semibold'
                      )}
                    >
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors">
                      <Clock size={10} />
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
