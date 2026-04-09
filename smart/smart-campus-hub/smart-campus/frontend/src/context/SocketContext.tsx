// @refresh reset
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { getStoredToken } from '@/lib/authStorage';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

interface SocketContextType {
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConnected(false);
      return;
    }

    const socketUrl = `${API_BASE_URL}/ws-campus`;
    const token = getStoredToken();
    
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket');
      setConnected(true);

      // Subscribe to user-specific notifications
      // In Spring Boot UserRegistry, the prefix /user is mapped automatically
      client.subscribe(`/user/queue/notifications`, (message) => {
        const notification = JSON.parse(message.body) as Notification;
        console.log('Received notification:', notification);
        
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show live toast popup
        toast(notification.title, {
          description: notification.message,
          action: {
            label: 'View',
            onClick: () => console.log('Viewing notification', notification.id),
          },
        });
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ connected, notifications, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
}

