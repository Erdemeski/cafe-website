import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Progress } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiRefresh, HiChartBar, HiBell, HiArrowRight } from 'react-icons/hi';
import { MdRestaurant, MdLocalShipping, MdDone } from 'react-icons/md';
import { BiDish } from 'react-icons/bi';
import { useNotification } from './NotificationProvider';
import { Link } from 'react-router-dom';

export default function DashboardMain() {
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalOrdersMonth: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    servedOrdersToday: 0,
    servedOrdersMonth: 0,
    activeCalls: 0,
    urgentCalls: 0
  });

  const { addNotification } = useNotification();

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

        // Filter orders by date
        const ordersToday = ordersList.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today;
        });

        const ordersThisMonth = ordersList.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart;
        });

        // Calculate stats
        const pendingOrders = ordersList.filter(order => order.status === 'pending').length;
        const preparingOrders = ordersList.filter(order => order.status === 'preparing').length;

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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
    addNotification('Dashboard yenilendi', 'info');
  };

  // Get recent orders (last 5)
  const recentOrders = orders
    .filter(order => order.status === 'pending' || order.status === 'preparing')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get recent calls (last 5)
  const recentCalls = waiterCalls
    .filter(call => call.status === 'pending')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

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

  return (
    <div className='flex-1 p-4 md:p-7'>
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
              children: 'flex h-full flex-col justify-start gap-4 p-4'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Sipariş</p>
              <div className='flex items-baseline gap-3'>
                <p className='text-2xl font-bold text-gray-900'>{stats.totalOrdersToday}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Bugün</p>
                </div>
              </div>
              <div className='flex items-baseline gap-3 mt-1'>
                <p className='text-base font-semibold text-gray-500'>{stats.totalOrdersMonth}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Bu Ay</p>
                </div>
              </div>
            </div>
            <div className='bg-blue-600 rounded-full p-2'>
              <MdRestaurant className='h-8 w-8 text-white' />
            </div>
          </div>
          <div className='mt-2'>
            <Progress
              progress={stats.totalOrdersToday > 0 ? (stats.pendingOrders / stats.totalOrdersToday) * 100 : 0}
              color="yellow"
              size="sm"
            />
            <p className='text-xs text-gray-500 mt-1'>{stats.pendingOrders} bekliyor</p>
          </div>
        </Card>

        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Hazırlanıyor</p>
              <p className='text-2xl font-bold text-gray-900'>{stats.preparingOrders}</p>
              <p className='text-xs text-gray-500 mt-1'>Şu anda mutfakta</p>
            </div>
            <MdLocalShipping className='h-8 w-8 text-blue-600' />
          </div>
        </Card>

        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Servis Edildi</p>
              <div className='flex items-baseline gap-3'>
                <p className='text-2xl font-bold text-gray-900'>{stats.servedOrdersToday}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Bugün</p>
                </div>
              </div>
              <div className='flex items-baseline gap-3 mt-1'>
                <p className='text-base font-semibold text-gray-500'>{stats.servedOrdersMonth}</p>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Bu Ay</p>
                </div>
              </div>
            </div>
            <MdDone className='h-8 w-8 text-green-600' />
          </div>
        </Card>

        {/* Calls Stats */}
        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-4'
            }
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Garson Çağrısı</p>
              <p className='text-2xl font-bold text-gray-900'>{stats.activeCalls}</p>
              <p className='text-xs text-gray-500 mt-1'>Şu anda aktif</p>
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
              children: 'flex h-full flex-col justify-start gap-4 p-6'
            }
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <MdRestaurant className='h-8 w-8 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-800'>Aktif Siparişler</h3>
            </div>
            <div className='flex items-center gap-2'>
              <Badge color="gray">
                <span className='text-sm flex flex-row items-center'>
                  <HiBell className="mr-1 h-3 w-3" />
                  {recentOrders.length}
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

          {recentOrders.length === 0 ? (
            <div className='text-center py-8'>
              <MdRestaurant className="mx-auto h-8 w-8 text-gray-400" />
              <p className='text-sm text-gray-500 mt-2'>Aktif sipariş bulunmuyor</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {recentOrders.map((order) => {
                const urgencyLevel = getTimeElapsed(order.createdAt);
                const isUrgent = order.status === 'pending' && (urgencyLevel.includes('sa') || (urgencyLevel.includes('dk') && parseInt(urgencyLevel) > 10));

                return (
                  <div
                    key={order._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>Masa {order.tableNumber}</span>
                        <Badge color={order.status === 'pending' ? 'warning' : 'info'} size="sm">
                          {order.status === 'pending' ? 'Bekliyor' : 'Hazırlanıyor'}
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
                      <p className='text-sm text-gray-600'>
                        {order.items.length} ürün • ₺{(order.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-500'>{formatDate(order.createdAt)}</p>
                      <p className={`text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {urgencyLevel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Waiter Calls */}
        <Card
          theme={{
            root: {
              children: 'flex h-full flex-col justify-start gap-4 p-6'
            }
          }}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <BiDish className='h-8 w-8 text-orange-600' />
              <h3 className='text-lg font-semibold text-gray-800'>Bekleyen Çağrılar</h3>
            </div>
            <div className='flex items-center gap-2'>
              <Badge color="gray">
                <span className='text-sm flex flex-row items-center'>
                  <HiBell className="mr-1 h-3 w-3" />
                  {recentCalls.length}
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

          {recentCalls.length === 0 ? (
            <div className='text-center py-8'>
              <BiDish className="mx-auto h-8 w-8 text-gray-400" />
              <p className='text-sm text-gray-500 mt-2'>Bekleyen çağrı bulunmuyor</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {recentCalls.map((call) => {
                const urgencyLevel = getTimeElapsed(call.timestamp);
                const isUrgent = urgencyLevel.includes('sa') || (urgencyLevel.includes('dk') && parseInt(urgencyLevel) > 5);

                return (
                  <div
                    key={call._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800'
                      }`}
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
                        <p className='text-sm text-gray-600 truncate'>{call.notes}</p>
                      )}
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-500'>{formatDate(call.timestamp)}</p>
                      <p className={`text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {urgencyLevel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Tips Section */}
      <Card className='mt-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-3'>Hızlı İpuçları</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div className='flex items-start gap-2'>
            <HiClock className='h-5 w-5 text-yellow-600 mt-0.5' />
            <div>
              <p className='font-medium'>Bekleyen Siparişler</p>
              <p className='text-gray-600'>Sarı çerçeveli kartlar acil işlem gerektirir</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <HiBell className='h-5 w-5 text-red-600 mt-0.5' />
            <div>
              <p className='font-medium'>Acil Çağrılar</p>
              <p className='text-gray-600'>Kırmızı arka planlı çağrılar öncelikli</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <HiRefresh className='h-5 w-5 text-blue-600 mt-0.5' />
            <div>
              <p className='font-medium'>Otomatik Yenileme</p>
              <p className='text-gray-600'>Veriler her 30 saniyede bir güncellenir</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
