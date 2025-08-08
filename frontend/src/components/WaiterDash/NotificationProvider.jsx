import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSound, setSoundEnabled } from '../../redux/notification/notificationSlice';
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
  const lastSeenOrderTimeRef = useRef(0);
  const lastSeenCallTimeRef = useRef(0);
  const dispatch = useDispatch();
  const soundEnabled = useSelector((state) => state.notification.soundEnabled);

  // Play notification sound
  const playNotificationSound = (type = 'order') => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(audioContext.destination);

      const playChime = (frequencies, duration = 0.5, type = 'sine', delay = 0) => {
        const now = audioContext.currentTime + delay;
        frequencies.forEach((freq, idx) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + idx * 0.01);
          osc.connect(gain);
          gain.connect(masterGain);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.9 / frequencies.length, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
          osc.start(now);
          osc.stop(now + duration + 0.02);
        });
      };

      // Pleasant, slightly longer tones, distinct per type
      switch (type) {
        case 'urgent-order':
          // Lower, assertive triad two-hit
          playChime([523.25, 659.25, 783.99], 0.45, 'square', 0);
          playChime([493.88, 659.25], 0.55, 'square', 0.25);
          break;
        case 'urgent-call':
          // Higher, assertive two-hit
          playChime([880, 1174.66], 0.45, 'square', 0.5);
          playChime([987.77, 1318.51], 0.55, 'square', 0.75);
          break;
        case 'pending-order':
          // Warm subtle chime
          playChime([659.25, 987.77], 1, 'sine', 0);
          playChime([659.25, 987.77], 0.5, 'sine', 0.25);
          break;
        case 'pending-call':
          playChime([739.99, 1108.73], 1, 'sine', 0.5);
          playChime([739.99, 1108.73], 0.5, 'sine', 0.75);
          break;
        case 'new-order':
          // Bright pleasant arpeggio
          playChime([659.25], 0.35, 'triangle', 0);
          playChime([880], 0.35, 'triangle', 0.18);
          playChime([987.77], 0.45, 'triangle', 0.36);
          break;
        case 'new-call':
          playChime([880], 0.35, 'triangle', 0);
          playChime([1046.5], 0.35, 'triangle', 0.18);
          playChime([1318.51], 0.45, 'triangle', 0.36);
          break;
        case 'order':
          playChime([600, 800], 0.4, 'sine', 0);
          break;
        case 'call':
        default:
          playChime([800, 1000], 0.45, 'sine', 0);
          break;
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

      const [ordersResponse, callsResponse] = await Promise.all([
        fetch('/api/order'),
        fetch('/api/table/waiter-calls')
      ]);

      const ordersData = await ordersResponse.json();
      const callsData = await callsResponse.json();

      if (ordersResponse.ok && callsResponse.ok) {
        const orders = ordersData.orders || [];
        const calls = callsData.waiterCalls || [];

        // Yeni gelen sipariş ve çağrıları ANINDA tespit et ve bildir (cooldown'a tabi değil)
        const latestOrderTime = orders.length > 0 ? Math.max(...orders.map(o => new Date(o.createdAt).getTime())) : lastSeenOrderTimeRef.current;
        const latestCallTime = calls.length > 0 ? Math.max(...calls.map(c => new Date(c.timestamp).getTime())) : lastSeenCallTimeRef.current;

        if (lastSeenOrderTimeRef.current === 0 && latestOrderTime) {
          lastSeenOrderTimeRef.current = latestOrderTime; // İlk yüklemede geçmişi bildirme
        } else {
          const newPendingOrders = orders.filter(o => new Date(o.createdAt).getTime() > lastSeenOrderTimeRef.current && o.status === 'pending');
          if (newPendingOrders.length > 0) {
            if (newPendingOrders.length === 1) {
              const o = newPendingOrders[0];
              addNotification(`Yeni sipariş: Masa ${o.tableNumber} (${o.orderNumber})`, 'order', 6000);
            } else {
              addNotification(`Yeni ${newPendingOrders.length} sipariş alındı`, 'order', 6000);
            }
            playNotificationSound('new-order');
            lastSeenOrderTimeRef.current = latestOrderTime;
          }
        }

        if (lastSeenCallTimeRef.current === 0 && latestCallTime) {
          lastSeenCallTimeRef.current = latestCallTime;
        } else {
          const newPendingCalls = calls.filter(c => new Date(c.timestamp).getTime() > lastSeenCallTimeRef.current && c.status === 'pending');
          if (newPendingCalls.length > 0) {
            if (newPendingCalls.length === 1) {
              const c = newPendingCalls[0];
              addNotification(`Yeni garson çağrısı: Masa ${c.tableNumber}`, 'call', 6000);
            } else {
              addNotification(`Yeni ${newPendingCalls.length} garson çağrısı`, 'call', 6000);
            }
            playNotificationSound('new-call');
            lastSeenCallTimeRef.current = latestCallTime;
          }
        }

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

        // 30 saniyede bir özet bildirimleri göster (spam önleme)
        if (now - lastNotificationTime >= 30000) {
          let anySummaryShown = false;

          // Acil siparişler için bildirim
          if (urgentOrders.length > 0) {
            addNotification(
              `ACİL: ${urgentOrders.length} sipariş 10+ dakikadır bekliyor!`,
              'error',
              8000
            );
            playNotificationSound('urgent-order');
            anySummaryShown = true;
          }

          // Bekleyen siparişler için bildirim (acil olanlar hariç)
          const normalPendingOrders = pendingOrders.length - urgentOrders.length;
          if (normalPendingOrders > 0) {
            addNotification(
              `${normalPendingOrders} sipariş bekliyor`,
              'warning',
              6000
            );
            // Ses ekle (acil olmayanlar için farklı)
            playNotificationSound('pending-order');
            anySummaryShown = true;
          }

          // Acil çağrılar için bildirim
          if (urgentCalls.length > 0) {
            addNotification(
              `ACİL: ${urgentCalls.length} garson çağrısı 5+ dakikadır bekliyor!`,
              'error',
              8000
            );
            playNotificationSound('urgent-call');
            anySummaryShown = true;
          }

          // Bekleyen çağrılar için bildirim (acil olanlar hariç)
          const normalPendingCalls = pendingCalls.length - urgentCalls.length;
          if (normalPendingCalls > 0) {
            addNotification(
              `${normalPendingCalls} garson çağrısı bekliyor`,
              'warning',
              6000
            );
            playNotificationSound('pending-call');
            anySummaryShown = true;
          }

          if (anySummaryShown) setLastNotificationTime(now);
        }
      }
    } catch (error) {
      console.error('Error checking pending items:', error);
    }
  };



  // Auto-check for pending items every 10 seconds
  useEffect(() => {
    // İlk kontrol
    checkPendingItems();

    const interval = setInterval(() => {
      checkPendingItems();
    }, 10000);

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

      {/* Sound toggle */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => dispatch(toggleSound())}
          className={`rounded-full px-3 py-2 shadow-md text-sm font-medium transition-colors ${soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
          title={soundEnabled ? 'Ses açık' : 'Ses kapalı'}
        >
          {soundEnabled ? '🔔 Ses Açık' : '🔕 Sessiz'}
        </button>
      </div>

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