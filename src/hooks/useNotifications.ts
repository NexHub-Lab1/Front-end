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
      // Mock notifications for testing scroll
      const mockNotifs: Notification[] = [
        { id: -1, message: 'Welcome to NexHub! Explore your first task.', type: 'INFO', read: false, createdAt: new Date().toISOString() },
        { id: -2, message: 'Your submission was approved! +50 points.', type: 'SUCCESS', read: false, createdAt: new Date().toISOString() },
        { id: -3, message: 'Someone mentioned you in a comment.', type: 'INFO', read: true, createdAt: new Date().toISOString() },
        { id: -4, message: 'Project "NexHub" has a new open task.', type: 'INFO', read: false, createdAt: new Date().toISOString() },
        { id: -5, message: 'Warning: Your deadline is approaching in 2 hours.', type: 'WARNING', read: false, createdAt: new Date().toISOString() },
        { id: -6, message: 'GitHub repository synced successfully.', type: 'SUCCESS', read: true, createdAt: new Date().toISOString() },
        { id: -7, message: 'New follower: "dev_master" started following you.', type: 'INFO', read: false, createdAt: new Date().toISOString() },
      ];
      setNotifications([...mockNotifs, ...response.data])
      setUnreadCount(mockNotifs.filter(n => !n.read).length + response.data.filter((n) => !n.read).length)
    }
  }, [user, token])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!token || !user) return

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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
