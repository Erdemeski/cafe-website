import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Textarea } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiRefresh, HiChartBar, HiBell, HiArrowRight } from 'react-icons/hi';
import { MdRestaurant, MdLocalShipping, MdDone, MdCancel } from 'react-icons/md';
import { BiDish } from 'react-icons/bi';
import { useNotification } from './NotificationProvider';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function DashboardMain() {
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalOrdersMonth: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    servedOrdersToday: 0,
    servedOrdersMonth: 0,
    activeCalls: 0,
    urgentCalls: 0
  });

  const { addNotification } = useNotification();
  const { currentUser } = useSelector((state) => state.user);

  // Modal states for quick detail views
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [updatingCallStatus, setUpdatingCallStatus] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');

  // Status maps (aligned with other screens)
  const orderStatusConfig = {
    pending: { color: 'warning', icon: HiClock, text: 'Bekliyor', bg: 'bg-yellow-100 text-yellow-800' },
    preparing: { color: 'info', icon: MdRestaurant, text: 'Hazırlanıyor', bg: 'bg-blue-100 text-blue-800' },
    ready: { color: 'success', icon: MdLocalShipping, text: 'Hazır', bg: 'bg-green-100 text-green-800' },
    served: { color: 'success', icon: MdDone, text: 'Servis Edildi', bg: 'bg-green-100 text-green-800' },
    cancelled: { color: 'failure', icon: MdCancel, text: 'İptal Edildi', bg: 'bg-red-100 text-red-800' }
  };

  const callStatusConfig = {
    pending: { color: 'warning', icon: HiClock, text: 'Bekliyor', bg: 'bg-yellow-100 text-yellow-800' },
    attended: { color: 'success', icon: HiCheck, text: 'Yanıtlandı', bg: 'bg-green-100 text-green-800' },
    cancelled: { color: 'failure', icon: HiX, text: 'İptal Edildi', bg: 'bg-red-100 text-red-800' }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders and waiter calls in parallel
      const [ordersResponse, callsResponse] = await Promise.all([
        fetch('/api/order'),
        fetch('/api/table/waiter-calls')
      ]);

      const ordersData = await ordersResponse.json();
      const callsData = await callsResponse.json();

      if (ordersResponse.ok && callsResponse.ok) {
        const ordersList = (ordersData.orders || []).map(order => ({
          ...order,
          totalPrice: order.totalPrice || 0
        }));
        const callsList = callsData.waiterCalls || [];

        setOrders(ordersList);
        setWaiterCalls(callsList);

        // Date calculations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter orders by date using local timezone
        const todayString = today.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
        const monthStartString = monthStart.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format

        const ordersToday = ordersList.filter(order => {
          const orderDate = new Date(order.createdAt);
          const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
          return orderDateString === todayString;
        });

        const ordersThisMonth = ordersList.filter(order => {
          const orderDate = new Date(order.createdAt);
          const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
          return orderDateString >= monthStartString;
        });

        // Calculate stats
        const pendingOrders = ordersList.filter(order => order.status === 'pending').length;
        const preparingOrders = ordersList.filter(order => order.status === 'preparing').length;
        const readyOrders = ordersList.filter(order => order.status === 'ready').length;

        const servedOrdersToday = ordersToday.filter(order => order.status === 'served').length;
        const servedOrdersThisMonth = ordersThisMonth.filter(order => order.status === 'served').length;

        const activeCalls = callsList.filter(call => call.status === 'pending').length;

        // Calculate urgent calls (more than 5 minutes old)
        const urgentCalls = callsList.filter(call => {
          if (call.status !== 'pending') return false;
          const callTime = new Date(call.timestamp);
          const diffMins = Math.floor((now - callTime) / 60000);
          return diffMins > 5;
        }).length;

        setStats({
          totalOrdersToday: ordersToday.length,
          totalOrdersMonth: ordersThisMonth.length,
          pendingOrders,
          preparingOrders,
          readyOrders,
          servedOrdersToday,
          servedOrdersMonth: servedOrdersThisMonth,
          activeCalls,
          urgentCalls
        });
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      addNotification('Dashboard verileri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh faster and refresh on tab focus
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
    addNotification('Dashboard yenilendi', 'info');
  };

  // Get recent orders (last 5)
  const recentOrders = orders
    .filter(order => order.status === 'pending' || order.status === 'preparing' || order.status === 'ready')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const activeOrders = orders
    .filter(order => order.status === 'pending' || order.status === 'preparing' || order.status === 'ready')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Get recent calls (last 5)
  const recentCalls = waiterCalls
    .filter(call => call.status === 'pending')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const activeCalls = waiterCalls
    .filter(call => call.status === 'pending')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time elapsed
  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const itemTime = new Date(dateString);
    const diffMs = now - itemTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} sa`;
  };

  // Urgency helpers for sorting Active lists
  const getOrderUrgencyMinutes = (order) => {
    if (order.status !== 'pending') return 0;
    const now = new Date();
    const created = new Date(order.createdAt);
    return Math.floor((now - created) / 60000);
  };
  const isOrderUrgent = (order) => getOrderUrgencyMinutes(order) > 10;
  const compareActiveOrders = (a, b) => {
    const ua = isOrderUrgent(a);
    const ub = isOrderUrgent(b);
    if (ua !== ub) return ua ? -1 : 1; // urgent first
    if (ua && ub) {
      // both urgent: older first (more minutes waited)
      return getOrderUrgencyMinutes(b) - getOrderUrgencyMinutes(a);
    }
    // non-urgent: newest first
    return new Date(b.createdAt) - new Date(a.createdAt);
  };

  const getCallUrgencyMinutes = (call) => {
    if (call.status !== 'pending') return 0;
    const now = new Date();
    const ts = new Date(call.timestamp);
    return Math.floor((now - ts) / 60000);
  };
  const isCallUrgent = (call) => getCallUrgencyMinutes(call) > 5;
  const compareActiveCalls = (a, b) => {
    const ua = isCallUrgent(a);
    const ub = isCallUrgent(b);
    if (ua !== ub) return ua ? -1 : 1; // urgent first
    if (ua && ub) {
      // both urgent: older first
      return getCallUrgencyMinutes(b) - getCallUrgencyMinutes(a);
    }
    // non-urgent: newest first
    return new Date(b.timestamp) - new Date(a.timestamp);
  };

  const listedActiveOrders = [...activeOrders].sort(compareActiveOrders).slice(0, 5);
  const listedActiveCalls = [...activeCalls].sort(compareActiveCalls).slice(0, 5);

  // Update order status (for modal in dashboard)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderStatus(true);
      const response = await fetch(`/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o)));
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : prev));
        addNotification(`Sipariş durumu "${orderStatusConfig[newStatus].text}" olarak güncellendi`, 'success');
        setShowOrderModal(false);
      } else {
        addNotification(data.message || 'Sipariş durumu güncellenemedi', 'error');
      }
    } catch (err) {
      addNotification('Sipariş durumu güncellenirken hata oluştu', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Update waiter call status (for modal in dashboard)
  const updateWaiterCallStatus = async (callId, newStatus) => {
    try {
      setUpdatingCallStatus(true);
      const response = await fetch(`/api/table/waiter-calls/${callId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          attendedBy: newStatus === 'attended' ? currentUser.firstName + ' ' + currentUser.lastName : undefined,
          notes: responseNotes || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setWaiterCalls(prev => prev.map(c => (c._id === callId ? { ...c, status: newStatus, attendedBy: currentUser.firstName + ' ' + currentUser.lastName, notes: responseNotes } : c)));
        setSelectedCall(prev => (prev ? { ...prev, status: newStatus, attendedBy: currentUser.firstName + ' ' + currentUser.lastName, notes: responseNotes } : prev));
        addNotification(`Garson çağrısı "${callStatusConfig[newStatus].text}" olarak güncellendi`, 'success');
        setShowCallModal(false);
        setResponseNotes('');
      } else {
        addNotification(data.message || 'Garson çağrısı güncellenemedi', 'error');
      }
    } catch (err) {
      addNotification('Garson çağrısı güncellenirken hata oluştu', 'error');
    } finally {
      setUpdatingCallStatus(false);
    }
  };

  return (
    <div className='relative isolate flex-1 p-4 md:p-7'>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 85% 110%, 90% 125%, 95% 140%, 98% 155%, 100% 170%, 100% 200%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#48ff00] to-[#0f63e2] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
        />
      </div>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-semibold text-gray-800 dark:text-white'>Garson Dashboard</h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Hoş geldiniz! Bugünkü işlerinizi buradan takip edebilirsiniz.
          </p>
        </div>

        <Button onClick={handleRefresh} color="gray" size="sm">
          <HiRefresh className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {/* Orders Stats */}
        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-2 p-4',
              base: 'flex rounded-lg dark:border shadow-lg dark:border-gray-800 bg-gradient-to-br from-cyan-300/10 to-blue-300/30 dark:from-cyan-900/50 dark:to-blue-900/50'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-200'>Toplam Sipariş</p>
              <div className='flex items-baseline gap-3'>
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-50'>{stats.totalOrdersToday}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Bugün</p>
                </div>
              </div>
              <div className='flex items-baseline gap-3 mt-1'>
                <p className='text-base font-semibold text-gray-500 dark:text-gray-400'>{stats.totalOrdersMonth}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Bu Ay</p>
                </div>
              </div>
            </div>
            <div className='bg-blue-600 rounded-full p-2 flex items-center justify-center'>
              <MdRestaurant className='h-8 w-8 text-white' />
            </div>
          </div>
          <div className='mt-2'>
            {(() => {
              const totalActive = stats.pendingOrders + stats.preparingOrders + stats.readyOrders;
              const pendingPct = totalActive > 0 ? (stats.pendingOrders / totalActive) * 100 : 0;
              const preparingPct = totalActive > 0 ? (stats.preparingOrders / totalActive) * 100 : 0;
              const readyPct = totalActive > 0 ? (stats.readyOrders / totalActive) * 100 : 0;
              return (
                <>
                  <div className='w-full h-2 rounded-full bg-white dark:bg-gray-700 overflow-hidden'>
                    {totalActive > 0 && (
                      <div className='h-full flex'>
                        {pendingPct > 0 && (
                          <div style={{ width: `${pendingPct}%` }} className='h-full bg-yellow-200' />
                        )}
                        {preparingPct > 0 && (
                          <div style={{ width: `${preparingPct}%` }} className='h-full bg-teal-300' />
                        )}
                        {readyPct > 0 && (
                          <div style={{ width: `${readyPct}%` }} className='h-full bg-green-400' />
                        )}
                      </div>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {totalActive === 0
                      ? (<span className='text-gray-500 dark:text-gray-400'>Şu anda aktif sipariş yok</span>)
                      : (
                        <span className='text-gray-500 dark:text-gray-400'>
                          {stats.pendingOrders > 0 && (
                            <span className='font-bold'>
                              <span className='font-bold'>{stats.pendingOrders}</span> sipariş bekliyor
                            </span>
                          )}
                          {stats.pendingOrders > 0 && stats.preparingOrders > 0 && ', '}
                          {stats.preparingOrders > 0 && (
                            <>
                              <span className='font-bold'>{stats.preparingOrders}</span> hazırlanıyor
                            </>
                          )}
                          {(stats.pendingOrders > 0 || stats.preparingOrders > 0) && stats.readyOrders > 0 && ', '}
                          {stats.readyOrders > 0 && (
                            <>
                              <span className='font-bold'>{stats.readyOrders}</span> hazır
                            </>
                          )}
                        </span>
                      )}
                  </p>
                </>
              );
            })()}
          </div>
        </Card>

        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4',
              base: 'flex rounded-lg border border-gray-200 bg-white/30 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-200'>Hazırlanıyor</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-50'>{stats.preparingOrders}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Şu anda mutfakta</p>
            </div>
            <div className='bg-teal-500 rounded-full p-2'>
              <MdLocalShipping className='h-8 w-8 text-white' />
            </div>
          </div>
        </Card>

        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4',
              base: 'flex rounded-lg border border-gray-200 bg-white/30 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-200'>Servis Edildi</p>
              <div className='flex items-baseline gap-3'>
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-50'>{stats.servedOrdersToday}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Bugün</p>
                </div>
              </div>
              <div className='flex items-baseline gap-3 mt-1'>
                <p className='text-base font-semibold text-gray-500 dark:text-gray-400'>{stats.servedOrdersMonth}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Bu Ay</p>
                </div>
              </div>
            </div>
            <div className='bg-green-500 rounded-full p-2'>
              <MdDone className='h-8 w-8 text-white' />
            </div>
          </div>
        </Card>

        {/* Calls Stats */}
        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4',
              base: 'flex rounded-lg border border-gray-200 bg-white/30 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-200'>Garson Çağrısı</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-50'>{stats.activeCalls}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Şu anda aktif</p>
            </div>
            <div className='bg-orange-600 rounded-full p-2'>
              <BiDish className='h-8 w-8 text-white' />
            </div>
          </div>
          {stats.urgentCalls > 0 && (
            <div className='mt-2'>
              <Badge color="failure" className="text-xs">
                <span className='text-sm flex flex-row items-center'>
                  <HiBell className="mr-1 h-3 w-3" />
                  {stats.urgentCalls} acil
                </span>
              </Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Orders */}
        <Card
          theme={{
            root: {
              children: `flex h-full flex-col justify-start gap-4 p-6 ${activeOrders.length > 5 ? 'pb-3' : ''}`,
              base: 'flex rounded-lg dark:border bg-white/80 shadow-lg dark:border-gray-800 dark:bg-[rgb(22,26,29)]/80'
            }
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <MdRestaurant className='h-8 w-8 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>Aktif Siparişler</h3>
            </div>
            <div className='flex items-center gap-2'>
              <Badge color="gray">
                <span className='text-sm flex flex-row items-center'>
                  <HiBell className="mr-1 h-3 w-3" />
                  {activeOrders.length}
                </span>
              </Badge>
              <Link to="/waiter-dashboard?tab=orders">
                <Button color="gray" size="xs" className='flex flex-row items-center'>
                  <HiArrowRight className="mr-2 h-4 w-4" />
                  Siparişlere Git
                </Button>
              </Link>
            </div>
          </div>

          {listedActiveOrders.length === 0 ? (
            <div className='text-center py-8'>
              <MdRestaurant className="mx-auto h-8 w-8 text-gray-400" />
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>Aktif sipariş bulunmuyor</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {listedActiveOrders.map((order) => {
                const urgencyLevel = getTimeElapsed(order.createdAt);
                const isUrgent = order.status === 'pending' && (urgencyLevel.includes('sa') || (urgencyLevel.includes('dk') && parseInt(urgencyLevel) > 10));

                return (
                  <div
                    key={order._id}
                    className={`flex min-h-[70px] items-center justify-between p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200 dark:bg-red-900/40 dark:border-red-600' : 'bg-gray-100/80 border border-gray-50 dark:bg-gray-700/40 dark:border-gray-600'
                      }`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderModal(true);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-800 dark:text-gray-200'>Masa {order.tableNumber}</span>
                        <Badge color={orderStatusConfig[order.status].color} size="sm">
                          {orderStatusConfig[order.status].text}
                        </Badge>
                        {isUrgent && (
                          <Badge color="failure" size="sm">
                            <span className='text-xs flex flex-row items-center'>
                              <HiClock className="mr-1 h-3 w-3" />
                              Acil
                            </span>
                          </Badge>
                        )}
                        {(getTimeElapsed(order.createdAt) === 'Az önce' ||
                          getTimeElapsed(order.createdAt) === '1 dk' ||
                          getTimeElapsed(order.createdAt) === '2 dk' ||
                          getTimeElapsed(order.createdAt) === '3 dk' ||
                          getTimeElapsed(order.createdAt) === '4 dk' ||
                          getTimeElapsed(order.createdAt) === '5 dk') && (
                            <Badge color="success" size="sm">
                              <span className='text-xs flex flex-row items-center'>
                                <HiCheck className="mr-1 h-3 w-3" />
                                Yeni
                              </span>
                            </Badge>
                          )}
                      </div>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {order.items.length} ürün • <span className='font-semibold text-gray-500 dark:text-gray-300'>₺{(order.totalPrice || 0).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-600 dark:text-gray-300'>{formatDate(order.createdAt)}</p>
                      <p className={`text-xs ${isUrgent ? 'text-red-600 font-semibold dark:text-red-400' : 'text-gray-400 dark:text-gray-200'}`}>
                        {urgencyLevel}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activeOrders.length > 5 && (
                <span className='flex justify-center text-gray-400 dark:text-gray-400 text-sm font-light'>
                  {activeOrders.length - 5} daha fazla sipariş var
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Recent Waiter Calls */}
        <Card
          theme={{
            root: {
              children: `flex h-full flex-col justify-start gap-4 p-6 ${activeCalls.length > 5 ? 'pb-3' : ''}`,
              base: 'flex rounded-lg dark:border bg-white/80 shadow-lg dark:border-gray-800 dark:bg-[rgb(22,26,29)]/80'
            }
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <BiDish className='h-8 w-8 text-orange-600' />
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>Bekleyen Çağrılar</h3>
            </div>
            <div className='flex items-center gap-2'>
              <Badge color="gray">
                <span className='text-sm flex flex-row items-center'>
                  <HiBell className="mr-1 h-3 w-3" />
                  {activeCalls.length}
                </span>
              </Badge>
              <Link to="/waiter-dashboard?tab=waiter-calls">
                <Button color="gray" size="xs" className='flex flex-row items-center'>
                  <HiArrowRight className="mr-2 h-4 w-4" />
                  Çağrılara Git
                </Button>
              </Link>
            </div>
          </div>

          {listedActiveCalls.length === 0 ? (
            <div className='text-center py-8'>
              <BiDish className="mx-auto h-8 w-8 text-gray-400" />
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>Bekleyen çağrı bulunmuyor</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {listedActiveCalls.map((call) => {
                const urgencyLevel = getTimeElapsed(call.timestamp);
                const isUrgent = urgencyLevel.includes('sa') || (urgencyLevel.includes('dk') && parseInt(urgencyLevel) > 5);

                return (
                  <div
                    key={call._id}
                    className={`flex min-h-[70px] items-center justify-between p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200 dark:bg-red-900/40 dark:border-red-600' : 'bg-gray-100/80 border border-gray-50 dark:bg-gray-700/40 dark:border-gray-600'
                      }`}
                    onClick={() => {
                      setSelectedCall(call);
                      setShowCallModal(true);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>Masa {call.tableNumber}</span>
                        {isUrgent && (
                          <Badge color="failure" size="sm">
                            <span className='text-xs flex flex-row items-center'>
                              <HiBell className="mr-1 h-3 w-3" />
                              Acil
                            </span>
                          </Badge>
                        )}
                        {(getTimeElapsed(call.timestamp) === 'Az önce' ||
                          getTimeElapsed(call.timestamp) === '1 dk' ||
                          getTimeElapsed(call.timestamp) === '2 dk' ||
                          getTimeElapsed(call.timestamp) === '3 dk' ||
                          getTimeElapsed(call.timestamp) === '4 dk' ||
                          getTimeElapsed(call.timestamp) === '5 dk') && (
                            <Badge color="success" size="sm">
                              <span className='text-xs flex flex-row items-center'>
                                <HiCheck className="mr-1 h-3 w-3" />
                                Yeni
                              </span>
                            </Badge>
                          )}
                      </div>
                      {call.notes && (
                        <p className='text-sm text-gray-600 dark:text-gray-400 truncate'>{call.notes}</p>
                      )}
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-600 dark:text-gray-300'>{formatDate(call.timestamp)}</p>
                      <p className={`text-xs ${isUrgent ? 'text-red-600 font-semibold dark:text-red-400' : 'text-gray-400 dark:text-gray-200'}`}>
                        {urgencyLevel}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activeCalls.length > 5 && (
                <span className='flex justify-center text-gray-400 dark:text-gray-400 text-sm font-light'>
                  {activeCalls.length - 5} daha fazla çağrı var
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Order Detail Modal (quick view) */}
      <Modal show={showOrderModal} onClose={() => setShowOrderModal(false)} size="2xl" className='pt-16 mb-2'>
        <Modal.Header className='p-3'>
          <div className="flex items-center">
            <MdRestaurant className="mr-2 h-5 w-5" />
            Sipariş Detayı - Masa {selectedOrder?.tableNumber}
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Sipariş No</p>
                  <p className='font-semibold dark:text-white'>{selectedOrder.orderNumber}</p>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Toplam</p>
                  <p className='font-semibold dark:text-white'>₺{(selectedOrder.totalPrice || 0).toFixed(2)}</p>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Durum</p>
                  <Badge color={orderStatusConfig[selectedOrder.status].color}>
                    {orderStatusConfig[selectedOrder.status].text}
                  </Badge>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Saat</p>
                  <p className='font-semibold dark:text-white'>{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {selectedOrder.customerName && (
                <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Müşteri Bilgisi</h4>
                  <p className='dark:text-gray-300'>Ad: {selectedOrder.customerName}</p>
                </div>
              )}

              <div>
                <h4 className='font-semibold mb-3 dark:text-white'>Sipariş Detayları</h4>
                <div className='space-y-2'>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className='flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                      <div className='flex-1'>
                        <p className='font-medium dark:text-white'>{item.ProductName}</p>
                        <p className='text-base text-gray-600 dark:text-gray-400'>₺{(item.Price || 0).toFixed(2)} <span className='font-bold text-lg'>x {item.qty}</span></p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold dark:text-white'>₺{(item.totalItemPrice || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Notlar</h4>
                  <p className='text-gray-700 dark:text-gray-300'>{selectedOrder.notes}</p>
                </div>
              )}

              <div className='border-t pt-4'>
                <h4 className='font-semibold mb-3 dark:text-white'>Durum Güncelle</h4>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(orderStatusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      color={status === selectedOrder.status ? 'gray' : config.color}
                      size='sm'
                      disabled={updatingOrderStatus || status === selectedOrder.status}
                      onClick={() => updateOrderStatus(selectedOrder._id, status)}
                    >
                      <config.icon className='mr-1 h-4 w-4' />
                      {config.text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Waiter Call Detail Modal (quick view) */}
      <Modal show={showCallModal} onClose={() => setShowCallModal(false)} size='lg' className='pt-16 mb-2'>
        <Modal.Header className='p-3'>
          <div className='flex items-center'>
            <BiDish className='mr-2 h-5 w-5' />
            Garson Çağrısı - Masa {selectedCall?.tableNumber}
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedCall && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Masa No</p>
                  <p className='font-semibold dark:text-white'>{selectedCall.tableNumber}</p>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Durum</p>
                  <Badge color={callStatusConfig[selectedCall.status].color}>
                    {callStatusConfig[selectedCall.status].text}
                  </Badge>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Çağrı Saati</p>
                  <p className='font-semibold dark:text-white'>{formatDate(selectedCall.timestamp)}</p>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Geçen Süre</p>
                  <p className='font-semibold dark:text-white'>{getTimeElapsed(selectedCall.timestamp)}</p>
                </div>
              </div>

              {selectedCall.notes && (
                <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Müşteri Notu</h4>
                  <p className='text-gray-700 dark:text-gray-300'>{selectedCall.notes}</p>
                </div>
              )}

              {selectedCall.status === 'pending' && (
                <div>
                  <h4 className='font-semibold mb-2 dark:text-white'>Yanıt Notu (Opsiyonel)</h4>
                  <Textarea
                    placeholder='Müşteriye bırakacağınız not...'
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className='border-t pt-4'>
                <h4 className='font-semibold mb-3 dark:text-white'>Durum Güncelle</h4>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(callStatusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      color={status === selectedCall.status ? 'gray' : config.color}
                      size='sm'
                      disabled={updatingCallStatus || status === selectedCall.status}
                      onClick={() => updateWaiterCallStatus(selectedCall._id, status)}
                    >
                      <config.icon className='mr-1 h-4 w-4' />
                      {config.text}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedCall.attendedBy && (
                <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Yanıtlayan Bilgisi</h4>
                  <p className='dark:text-gray-300'><span className='font-medium dark:text-white'>Garson:</span> {selectedCall.attendedBy}</p>
                  {selectedCall.attendedAt && (
                    <p className='dark:text-gray-300'><span className='font-medium dark:text-white'>Saat:</span> {formatDate(selectedCall.attendedAt)}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
      {/* Tips Section */}
      <Card
        className='mt-6'
        theme={{
          root: {
            children: 'flex flex-col justify-start gap-4 p-6',
            base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
          }
        }}
      >
        <h3 className='text-lg font-bold text-gray-800 dark:text-gray-50 mb-1'>Hızlı İpuçları</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div className='flex items-start gap-2'>
            <HiClock className='h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5' />
            <div>
              <p className='font-medium text-gray-800 dark:text-gray-200'>Bekleyen Siparişler</p>
              <p className='text-gray-600 dark:text-gray-400'>Sarı çerçeveli kartlar bekleyen siparişlerdir</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <HiBell className='h-5 w-5 text-red-600 mt-0.5' />
            <div>
              <p className='font-medium text-gray-800 dark:text-gray-200'>Acil Çağrılar</p>
              <p className='text-gray-600 dark:text-gray-400'>Kırmızı arka planlı kartlar acil işlem gerektirir</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <HiRefresh className='h-5 w-5 text-blue-600 mt-0.5' />
            <div>
              <p className='font-medium text-gray-800 dark:text-gray-200'>Otomatik Yenileme</p>
              <p className='text-gray-600 dark:text-gray-400'>Veriler her 10 saniyede bir güncellenir</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
