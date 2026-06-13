import { useState, useEffect, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { readStoredUser, readStoredUserToken } from '../lib/auth-storage'
import { fetchNotifications, markNotificationAsRead } from '../lib/notification-storage'
import type { Notification } from '../types/app'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const user = readStoredUser()
  const token = readStoredUserToken()

  const loadNotifications = useCallback(async () => {
    if (!user || !token) return
    const response = await fetchNotifications()
    if (response.status === 'success' && response.data) {
      setNotifications(response.data)
      setUnreadCount(response.data.filter((n) => !n.read).length)
    }
  }, [user, token])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!token || !user) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log(str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = () => {
      console.log('Connected to WebSocket')
      client.subscribe(`/user/${user.email}/queue/notifications`, (message) => {
        const newNotif: Notification = JSON.parse(message.body)
        setNotifications((prev) => [newNotif, ...prev])
        setUnreadCount((prev) => prev + 1)
      })
    }

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message'])
      console.error('Additional details: ' + frame.body)
    }

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [token, user])

  const markAsRead = async (id: number) => {
    const response = await markNotificationAsRead(id)
    if (response.status === 'success') {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return { notifications, unreadCount, markAsRead }
}
