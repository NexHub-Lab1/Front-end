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
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && <span className="text-xs text-slate-500">{unreadCount} unread</span>}
          </div>

          <div className="space-y-1">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={cn(
                    'flex gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  )}
                >
                  <div className="mt-1 shrink-0">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm leading-tight break-words',
                        notif.read ? 'text-slate-600' : 'text-slate-900 font-medium'
                      )}
                    >
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock size={10} />
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
