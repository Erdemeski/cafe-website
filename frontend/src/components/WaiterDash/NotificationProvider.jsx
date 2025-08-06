import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Toast } from 'flowbite-react';
import { HiCheck, HiX, HiBell, HiClock, HiExclamation } from 'react-icons/hi';
import { MdRestaurant } from 'react-icons/md';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const audioRef = useRef(null);

  // Play notification sound
  const playNotificationSound = (type = 'order') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'order') {
        // Order notification sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'call') {
        // Waiter call notification sound (higher pitch)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      }
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  };

  // Add notification
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      message,
      type,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Check for pending orders and calls
  const checkPendingItems = async () => {
    try {
      const now = Date.now();
      
      // 60 saniyede bir bildirim göster (spam önleme)
      if (now - lastNotificationTime < 60000) {
        return;
      }

      const [ordersResponse, callsResponse] = await Promise.all([
        fetch('/api/order'),
        fetch('/api/table/waiter-calls')
      ]);

      const ordersData = await ordersResponse.json();
      const callsData = await callsResponse.json();

      if (ordersResponse.ok && callsResponse.ok) {
        const orders = ordersData.orders || [];
        const calls = callsData.waiterCalls || [];

        // Bekleyen siparişler
        const pendingOrders = orders.filter(order => order.status === 'pending');
        // Bekleyen çağrılar
        const pendingCalls = calls.filter(call => call.status === 'pending');

        // Acil siparişler (10+ dakika)
        const urgentOrders = pendingOrders.filter(order => {
          const orderTime = new Date(order.createdAt);
          const diffMins = Math.floor((now - orderTime) / 60000);
          return diffMins > 10;
        });

        // Acil çağrılar (5+ dakika)
        const urgentCalls = pendingCalls.filter(call => {
          const callTime = new Date(call.timestamp);
          const diffMins = Math.floor((now - callTime) / 60000);
          return diffMins > 5;
        });

        // Acil siparişler için bildirim
        if (urgentOrders.length > 0) {
          addNotification(
            `🔴 ACİL: ${urgentOrders.length} sipariş 10+ dakikadır bekliyor!`,
            'error',
            8000
          );
          playNotificationSound('order');
        }

        // Bekleyen siparişler için bildirim (acil olanlar hariç)
        const normalPendingOrders = pendingOrders.length - urgentOrders.length;
        if (normalPendingOrders > 0) {
          addNotification(
            `⏰ ${normalPendingOrders} sipariş bekliyor`,
            'warning',
            5000
          );
        }

        // Acil çağrılar için bildirim
        if (urgentCalls.length > 0) {
          addNotification(
            `🔴 ACİL: ${urgentCalls.length} garson çağrısı 5+ dakikadır bekliyor!`,
            'error',
            8000
          );
          playNotificationSound('call');
        }

        // Bekleyen çağrılar için bildirim (acil olanlar hariç)
        const normalPendingCalls = pendingCalls.length - urgentCalls.length;
        if (normalPendingCalls > 0) {
          addNotification(
            `🔔 ${normalPendingCalls} garson çağrısı bekliyor`,
            'warning',
            5000
          );
        }

        // Bildirim zamanını güncelle (herhangi bir bildirim gösterildiyse)
        if (urgentOrders.length > 0 || normalPendingOrders > 0 || urgentCalls.length > 0 || normalPendingCalls > 0) {
          setLastNotificationTime(now);
        }
      }
    } catch (error) {
      console.error('Error checking pending items:', error);
    }
  };



  // Auto-check for pending items every 30 seconds
  useEffect(() => {
    // İlk kontrol
    checkPendingItems();
    
    const interval = setInterval(() => {
      checkPendingItems();
    }, 30000);

    return () => clearInterval(interval);
  }, [lastNotificationTime]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <HiCheck className="h-4 w-4" />;
      case 'warning':
        return <HiBell className="h-4 w-4" />;
      case 'error':
        return <HiExclamation className="h-4 w-4" />;
      case 'order':
        return <MdRestaurant className="h-4 w-4" />;
      case 'call':
        return <HiBell className="h-4 w-4" />;
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  const getNotificationClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-500 dark:bg-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200';
      case 'order':
        return 'bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200';
      case 'call':
        return 'bg-orange-100 text-orange-500 dark:bg-orange-800 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      {/* Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Toast key={notification.id} className="min-w-80">
            <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getNotificationClasses(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className="ml-3 text-sm font-normal dark:text-gray-300">
              {notification.message}
            </div>
            <Toast.Toggle onClick={() => removeNotification(notification.id)} />
          </Toast>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}; 