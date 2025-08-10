import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Modal, TextInput, Select, Alert, Spinner, Datepicker } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiEye, HiRefresh, HiFilter, HiCalendar, HiViewBoards, HiUser } from 'react-icons/hi';
import { MdRestaurant, MdLocalShipping, MdDone, MdCancel, MdOutlineTableBar, MdDoneAll } from 'react-icons/md';
import { FiAlertTriangle } from "react-icons/fi";
import { CiNoWaitingSign } from "react-icons/ci";
import { IoIosHourglass } from "react-icons/io";
import { TbProgress } from "react-icons/tb";
import { useNotification } from './NotificationProvider';

export default function DashOrders() {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [filterTable, setFilterTable] = useState('');
  const [viewMode, setViewMode] = useState('byTable'); // 'all', 'byTable', or 'byDate'
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);

  const { addNotification } = useNotification();

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'warning', icon: HiClock, text: 'Bekliyor', bg: 'bg-yellow-100 text-yellow-800' },
    preparing: { color: 'info', icon: MdRestaurant, text: 'Hazırlanıyor', bg: 'bg-blue-100 text-blue-800' },
    ready: { color: 'success', icon: MdLocalShipping, text: 'Hazır', bg: 'bg-green-100 text-green-800' },
    served: { color: 'success', icon: MdDone, text: 'Servis Edildi', bg: 'bg-green-100 text-green-800' },
    cancelled: { color: 'failure', icon: MdCancel, text: 'İptal Edildi', bg: 'bg-red-100 text-red-800' }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterTable) params.append('tableNumber', filterTable);

      const response = await fetch(`/api/order?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const newOrdersList = (data.orders || []).map(order => ({
          ...order,
          totalPrice: order.totalPrice || 0,
          items: (order.items || []).map(item => ({
            ...item,
            Price: item.Price || 0,
            totalItemPrice: item.totalItemPrice || 0
          }))
        }));
        setOrders(newOrdersList);

        // Update tables data
        await updateTablesData(newOrdersList);
      } else {
        setError(data.message || 'Siparişler yüklenemedi');
        addNotification(data.message || 'Siparişler yüklenemedi', 'error');
      }
    } catch (err) {
      setError('Siparişler yüklenirken hata oluştu');
      addNotification('Siparişler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tables
  const fetchAllTables = async () => {
    try {
      const response = await fetch('/api/table/get-tables');
      const data = await response.json();

      if (response.ok) {
        // tables may include sessionStatus from backend
        return (data.tables || []).map((t) => ({
          tableNumber: t.tableNumber,
          sessionStatus: t.sessionStatus || { isActive: false, expiresAt: null, lastValidatedAt: null },
        }));
      } else {
        console.error('Masalar yüklenemedi');
        return [];
      }
    } catch (error) {
      console.error('Masalar yüklenirken hata oluştu:', error);
      return [];
    }
  };

  // Update tables data based on orders and all tables
  const updateTablesData = async (ordersList) => {
    // First fetch all tables
    const allTables = await fetchAllTables();

    const tableMap = new Map();

    // Initialize all tables with empty order data
    allTables.forEach(table => {
      tableMap.set(table.tableNumber, {
        tableNumber: table.tableNumber,
        sessionStatus: table.sessionStatus || { isActive: false, expiresAt: null, lastValidatedAt: null },
        orders: [],
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        servedCount: 0,
        cancelledCount: 0,
        totalCount: 0,
        lastOrderTime: null,
        hasPrevDayOrder: false,
      });
    });

    // Filter orders by today's date using local timezone
    const today = new Date();
    const todayString = today.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format

    const filteredOrders = ordersList.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      return orderDateString === todayString;
    });

    // Add order data to tables that have orders
    filteredOrders.forEach(order => {
      const tableNumber = order.tableNumber;
      if (!tableMap.has(tableNumber)) {
        tableMap.set(tableNumber, {
          tableNumber,
          sessionStatus: { isActive: false, expiresAt: null, lastValidatedAt: null },
          orders: [],
          pendingCount: 0,
          preparingCount: 0,
          readyCount: 0,
          servedCount: 0,
          cancelledCount: 0,
          totalCount: 0,
          lastOrderTime: null,
          hasPrevDayOrder: false,
        });
      }

      const tableData = tableMap.get(tableNumber);
      tableData.orders.push(order);
      tableData.totalCount++;

      if (order.status === 'pending') tableData.pendingCount++;
      else if (order.status === 'preparing') tableData.preparingCount++;
      else if (order.status === 'ready') tableData.readyCount++;
      else if (order.status === 'served') tableData.servedCount++;
      else if (order.status === 'cancelled') tableData.cancelledCount++;

      const orderTime = new Date(order.createdAt);
      if (!tableData.lastOrderTime || orderTime > tableData.lastOrderTime) {
        tableData.lastOrderTime = orderTime;
      }
    });

    // Detect previous-day active orders per table
    const previousOrOlderOrders = (ordersList || []).filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      return orderDateString !== todayString;
    });
    previousOrOlderOrders.forEach(order => {
      // Check for active orders (pending, preparing, ready) from previous days
      if (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') {
        const tn = order.tableNumber;
        if (!tableMap.has(tn)) {
          tableMap.set(tn, {
            tableNumber: tn,
            sessionStatus: { isActive: false, expiresAt: null, lastValidatedAt: null },
            orders: [],
            pendingCount: 0,
            preparingCount: 0,
            readyCount: 0,
            servedCount: 0,
            cancelledCount: 0,
            totalCount: 0,
            lastOrderTime: null,
            hasPrevDayOrder: true,
          });
        } else {
          const td = tableMap.get(tn);
          td.hasPrevDayOrder = true;
        }
      }
    });

    const tablesArray = Array.from(tableMap.values())
      .sort((a, b) => {
        // First priority: tables with pending orders
        const aHasPending = a.pendingCount > 0;
        const bHasPending = b.pendingCount > 0;

        if (aHasPending !== bHasPending) {
          return bHasPending ? 1 : -1; // Tables with pending orders come first
        }

        // Second priority: sort by table number (ascending)
        return parseInt(a.tableNumber) - parseInt(b.tableNumber);
      });

    setTables(tablesArray);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        addNotification(`Sipariş durumu "${statusConfig[newStatus].text}" olarak güncellendi`, 'success');
        setShowOrderModal(false);
      } else {
        setError(data.message || 'Sipariş durumu güncellenemedi');
        addNotification(data.message || 'Sipariş durumu güncellenemedi', 'error');
      }
    } catch (err) {
      setError('Sipariş durumu güncellenirken hata oluştu');
      addNotification('Sipariş durumu güncellenirken hata oluştu', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time elapsed
  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} saat önce`;
  };

  // Get urgency level
  const getUrgencyLevel = (dateString) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins > 15) return 'critical';
    if (diffMins > 10) return 'urgent';
    if (diffMins > 5) return 'high';
    return 'normal';
  };

  // Filter orders based on viewMode and filters
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Apply date filter based on viewMode
    if (viewMode === 'byDate' && filterDate) {
      // In byDate mode, filter by selected date
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        // Use local timezone instead of UTC
        const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
        return orderDateString === filterDate;
      });
    } else if (viewMode === 'byTable' && filterDate) {
      // In byTable mode, filter by selected date (defaults to today)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        // Use local timezone instead of UTC
        const orderDateString = orderDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
        return orderDateString === filterDate;
      });
    }
    // In 'all' mode, no date filtering is applied

    // Apply table filter
    if (filterTable) {
      filtered = filtered.filter(order => order.tableNumber === filterTable);
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Sort orders by urgency and time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // First by status (pending first)
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1;
      if (b.status === 'pending') return 1;
    }

    // Then by urgency for pending orders
    if (a.status === 'pending' && b.status === 'pending') {
      const urgencyA = getUrgencyLevel(a.createdAt);
      const urgencyB = getUrgencyLevel(b.createdAt);

      const urgencyOrder = { critical: 0, urgent: 1, high: 2, normal: 3 };
      if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
        return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
      }

      // Then by time (oldest first for urgent orders)
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Get table orders
  const getTableOrders = (tableNumber) => {
    return sortedOrders.filter(order => order.tableNumber === tableNumber);
  };

  // Handle viewMode change
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    setSelectedTable(null);

    // Reset filters based on viewMode
    if (newViewMode === 'all') {
      setFilterDate('');
      setFilterTable('');
    } else if (newViewMode === 'byDate') {
      setFilterTable('');
      // Set to today's date if no date is currently selected
      if (!filterDate) {
        setFilterDate(getTodayDate());
      }
    } else if (newViewMode === 'byTable') {
      setFilterTable('');
      // Set to today's date if no date is currently selected
      if (!filterDate) {
        setFilterDate(getTodayDate());
      }
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [filterStatus, filterTable]);

  // Manual refresh
  const handleRefresh = () => {
    fetchOrders();
    addNotification('Siparişler yenilendi', 'info');
  };

  // Render order card
  const renderOrderCard = (order) => {
    const status = statusConfig[order.status];
    const StatusIcon = status.icon;
    const urgencyLevel = getUrgencyLevel(order.createdAt);

    return (
      <Card
        key={order._id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-lg ${order.status === 'pending' ? 'ring-2 ring-yellow-200' : ''
          } ${urgencyLevel === 'urgent' && order.status === 'pending' ? 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20' : ''
          } ${urgencyLevel === 'critical' && order.status === 'pending' ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/30' : ''
          }`}
        onClick={() => {
          setSelectedOrder(order);
          setShowOrderModal(true);
        }}
        theme={{
          root: {
            children: 'flex flex-col justify-start gap-4 p-6',
            base: 'flex rounded-lg border border-gray-100 bg-white/70 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
          }
        }}
      >
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2'>
              <MdOutlineTableBar className='w-6 sm:w-8 h-6 sm:h-8' />
              Masa {order.tableNumber}
            </h3>

          </div>
          <Badge color={status.color} className={`${status.bg} shadow-sm`}>
            <div className='flex items-center'>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.text}
            </div>
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-400'>Toplam:</span>
            <span className='font-semibold'>₺{(order.totalPrice || 0).toFixed(2)}</span>
          </div>

          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-400'>Ürün Sayısı:</span>
            <span>{order.items.length}</span>
          </div>

          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-400'>Saat:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>

          <div className='flex justify-between text-sm'>
            <span className='text-gray-600 dark:text-gray-400'>Geçen Süre:</span>
            <span className={
              urgencyLevel === 'critical' && order.status === 'pending'
                ? 'text-red-600 font-semibold'
                : urgencyLevel === 'urgent' && order.status === 'pending'
                  ? 'text-orange-600 font-semibold'
                  : order.status === 'pending'
                    ? 'text-yellow-600 font-semibold'
                    : ''
            }>
              {getTimeElapsed(order.createdAt)}
            </span>
          </div>
        </div>
        <div className='flex flex-row gap-1 mt-3 pt-3 border-t border-gray-200 justify-between items-center'>
          {order.sessionId && (
            <div className='text-xs flex items-center gap-1'>
              <HiUser className='w-4 sm:w-6 h-4 sm:h-6 text-gray-600 dark:text-gray-400' />
              <span className='font-mono text-xs sm:text-sm break-all text-gray-600 dark:text-gray-400'>{order.sessionId} {order.customerName ? `- ${order.customerName}` : ''}</span>
            </div>
          )}
          <p className='text-xs text-gray-600 dark:text-gray-400'>
            {order.orderNumber}
          </p>
        </div>

        {/* Urgency indicator */}
        {order.status === 'pending' && urgencyLevel === 'critical' && (
          <div className='mt-3 pt-3 border-t border-red-200'>
            <div className='flex items-center text-red-600'>
              <HiClock className="mr-1 h-4 w-4 animate-pulse" />
              <span className='text-sm font-semibold'>Kritik!</span>
            </div>
          </div>
        )}
      </Card>
    );
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
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-pink-500 to-blue-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
        />
      </div>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-semibold text-gray-800 dark:text-white'>Siparişler</h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            {viewMode === 'all' ? (
              <>
                Toplam {filteredOrders.length} sipariş
                {filteredOrders.filter(order => order.status === 'pending').length > 0 && (
                  <span className='ml-2 text-red-600 font-semibold'>
                    ({filteredOrders.filter(order => order.status === 'pending').length} bekliyor)
                  </span>
                )}
              </>
            ) : viewMode === 'byDate' ? (
              <>
                {filterDate ? `${filterDate} Tarihli Siparişler` : 'Tarih Seçin'}
                {filterDate && (
                  <span className='ml-2 text-gray-600'>
                    ({filteredOrders.length} sipariş mevcut)
                  </span>
                )}
              </>
            ) : (
              <>
                {selectedTable ? `Masa ${selectedTable} Siparişleri` : 'Bir Masa Seçin'}
                {selectedTable && (
                  <span className='ml-2 text-gray-600'>
                    ({getTableOrders(selectedTable).length} sipariş mevcut) ({filterDate} tarihli)
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button onClick={handleRefresh} color="gray" size="sm">
            <HiRefresh className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Card
        className="mb-4"
        theme={{
          root: {
            children: 'flex h-full flex-col justify-center gap-1 p-2 md:p-3',
            base: 'flex rounded-lg border border-gray-200 bg-white/30 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
          }
        }}>
        <div className="border-b border-gray-300 dark:border-gray-600">
          <ul className="flex flex-wrap -mb-px text-xs sm:text-sm font-semibold sm:font-medium text-center">
            <li className="mr-1">
              <button
                onClick={() => handleViewModeChange('byTable')}
                className={`inline-flex items-center justify-center p-2 border-b-2 rounded-t-lg ${viewMode === 'byTable'
                  ? 'text-purple-500 border-purple-500 active dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent hover:text-gray-900 hover:border-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <MdRestaurant className="mr-1 h-4 w-4" />
                Masalara Göre
              </button>
            </li>
            <li className="mr-1">
              <button
                onClick={() => handleViewModeChange('byDate')}
                className={`inline-flex items-center justify-center p-2 border-b-2 rounded-t-lg ${viewMode === 'byDate'
                  ? 'text-purple-500 border-purple-500 active dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent hover:text-gray-900 hover:border-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <HiCalendar className="mr-1 h-4 w-4" />
                Güne Göre
              </button>
            </li>
            <li className="mr-1">
              <button
                onClick={() => handleViewModeChange('all')}
                className={`inline-flex items-center justify-center p-2 border-b-2 rounded-t-lg ${viewMode === 'all'
                  ? 'text-purple-500 border-purple-500 active dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent hover:text-gray-900 hover:border-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <HiViewBoards className="mr-1 h-4 w-4" />
                Bütün Siparişler
              </button>
            </li>
          </ul>
        </div>

        <div className={`${selectedTable ? 'mt-2' : `${viewMode === 'byTable' ? 'mt-2 hidden' : 'mt-2'}`}`}>
          {viewMode === 'all' ? (
            /* Filters for All Orders */
            <div className='flex flex-col md:flex-row gap-4'>
              <div className="flex-1">
                <TextInput
                  type="text"
                  placeholder="Masa Numarası"
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                  icon={MdRestaurant}
                />
              </div>
              <div className="flex-1">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  icon={HiFilter}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Bekliyor</option>
                  <option value="preparing">Hazırlanıyor</option>
                  <option value="ready">Hazır</option>
                  <option value="served">Servis Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </Select>
              </div>
            </div>
          ) : viewMode === 'byDate' ? (
            /* Filters for Date View */
            <div className='flex flex-col md:flex-row gap-4'>
              <div className="flex-1 relative">
                <Datepicker
                  language="tr-TR"
                  labelTodayButton="Bugün"
                  labelClearButton="Temizle"
                  value={filterDate ? new Date(filterDate + 'T00:00:00') : undefined}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setFilterDate(`${year}-${month}-${day}`);
                    } else {
                      setFilterDate('');
                    }
                  }}
                  theme={{
                    popup: {
                      footer: {
                        base: "mt-2 flex space-x-2",
                        button: {
                          base: "w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-cyan-300",
                          today: "bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700",
                          clear: "hidden"
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  icon={HiFilter}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Bekliyor</option>
                  <option value="preparing">Hazırlanıyor</option>
                  <option value="ready">Hazır</option>
                  <option value="served">Servis Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </Select>
              </div>
            </div>
          ) : (
            /* Filters for Table View */
            <>
              {selectedTable && (
                <div className='flex flex-col md:flex-row gap-4'>
                  <div className="flex-1">
                    <Datepicker
                      language="tr-TR"
                      labelTodayButton="Bugün"
                      labelClearButton="Temizle"
                      value={filterDate ? new Date(filterDate + 'T00:00:00') : undefined}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFilterDate(`${year}-${month}-${day}`);
                        } else {
                          setFilterDate('');
                        }
                      }}
                      theme={{
                        popup: {
                          footer: {
                            base: "mt-2 flex space-x-2",
                            button: {
                              base: "w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-cyan-300",
                              today: "bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700",
                              clear: "hidden"
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      ) : error ? (
        <Alert color="failure">
          <span>{error}</span>
        </Alert>
      ) : viewMode === 'all' || viewMode === 'byDate' ? (
        // All Orders View or Date View
        sortedOrders.length === 0 ? (
          <Card
            theme={{
              root: {
                children: 'flex flex-col justify-start gap-4 p-6',
                base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-[rgb(22,26,29)]/80 dark:bg-[rgb(22,26,29)]/80'
              }
            }}
          >
            <div className="text-center py-8">
              <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sipariş bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {viewMode === 'byDate' && !filterDate
                  ? 'Lütfen bir tarih seçin.'
                  : 'Seçilen kriterlere uygun sipariş bulunmuyor.'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
            {sortedOrders.map(renderOrderCard)}
          </div>
        )
      ) : (
        // Tables View
        <div>
          {!selectedTable ? (
            // Show all tables
            tables.length === 0 ? (
              <Card
                theme={{
                  root: {
                    children: 'flex flex-col justify-start gap-4 p-6',
                    base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-[rgb(22,26,29)]/80 dark:bg-[rgb(22,26,29)]/80'
                  }
                }}
              >
                <div className="text-center py-8">
                  <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Masa bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Henüz hiç masa oluşturulmamış.
                  </p>
                </div>
              </Card>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                {tables.map((table) => {
                  const tableOrders = getTableOrders(table.tableNumber);
                  const hasUrgentOrders = tableOrders.some(order =>
                    order.status === 'pending' && getUrgencyLevel(order.createdAt) === 'critical'
                  );

                  return (
                    <Card
                      key={table.tableNumber}
                      className={`md:max-w-xsm min-w-xs flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-lg
                        ${hasUrgentOrders ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' :
                          table.pendingCount > 0 ? 'ring-2 ring-yellow-200' : ''
                        }`}
                      onClick={() => setSelectedTable(table.tableNumber)}
                      theme={{
                        root: {
                          children: 'flex h-full flex-col justify-start gap-1 p-4',
                          base: 'flex rounded-lg border border-gray-100 bg-white/70 shadow-lg dark:border-gray-700 dark:bg-[rgb(22,26,29)]/80'
                        }
                      }}
                    >
                      <div className='flex justify-between items-start mb-3'>
                        <div className='flex flex-col items-start gap-2'>
                          <div className='w-20 h-16 mx-auto bg-gradient-to-br ml-0 from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
                            <MdOutlineTableBar className='w-10 h-10' />
                            <span className='text-2xl font-semibold'>{table.tableNumber}</span>
                          </div>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                              Masa {table.tableNumber}
                            </h3>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                              {table.totalCount > 0 ? `Bugün ${table.totalCount} sipariş` : 'Bugün sipariş yok'}
                            </p>
                            <div className='mt-1'>
                              {table.sessionStatus?.isActive ? (
                                <Badge color="success" size="sm">
                                  <div className='flex items-center gap-1'>
                                    <div className='w-2 h-2 rounded-full animate-pulse bg-green-500'></div>
                                    <span className='text-xs font-semibold'>Oturum açık</span>
                                  </div>
                                </Badge>
                              ) : (
                                <Badge color="gray" size="sm">
                                  <div className='flex items-center gap-1'>
                                    <div className='w-2 h-2 rounded-full animate-pulse bg-gray-500'></div>
                                    <span className='text-xs font-semibold'>Oturum kapalı</span>
                                  </div>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='text-right flex flex-col gap-1'>
                          {/* Urgency indicator */}
                          {table.totalCount > 0 && hasUrgentOrders && (
                            <Badge color="failure">
                              <div className='flex items-center gap-1'>
                                <FiAlertTriangle className="h-4 w-4 animate-pulse" />
                                <span className='text-xs font-semibold'>Kritik Siparişler!</span>
                              </div>
                            </Badge>
                          )}

                          {/* Previous day active orders warning */}
                          {table.hasPrevDayOrder && (
                            <Badge color="warning">
                              <div className='flex items-center gap-1'>
                                <HiClock className="h-4 w-4 animate-pulse" />
                                <span className='text-xs font-semibold'>Eski siparişler var</span>
                              </div>
                            </Badge>
                          )}

                          {table.totalCount === 0 ? (
                            <Badge color="danger">
                              <div className='flex items-center gap-1'>
                                <CiNoWaitingSign className="h-4 w-4" />
                                <span className='text-xs font-semibold'>Bugün sipariş yok</span>
                              </div>
                            </Badge>
                          ) : (
                            <>
                              {table.pendingCount > 0 && (
                                <Badge color="warning" className="mb-1">
                                  <div className='flex items-center gap-1'>
                                    <IoIosHourglass className="h-4 w-4 animate-pulse" />
                                    <span className='text-xs font-semibold'>{table.pendingCount} Bekliyor</span>
                                  </div>
                                </Badge>
                              )}
                              {table.preparingCount > 0 && (
                                <Badge color="info" className="mb-1">
                                  <div className='flex items-center gap-1'>
                                    <TbProgress className="h-4 w-4 animate-pulse" />
                                    <span className='text-xs font-semibold'>{table.preparingCount} Hazırlanıyor</span>
                                  </div>
                                </Badge>
                              )}
                              {table.readyCount > 0 && (
                                <Badge color="success">
                                  <div className='flex items-center gap-1'>
                                    <MdDone className="h-4 w-4" />
                                    <span className='text-xs font-semibold'>{table.readyCount} Hazır</span>
                                  </div>
                                </Badge>
                              )}
                              {table.servedCount > 0 && (
                                <Badge color="success">
                                  <div className='flex items-center gap-1'>
                                    <MdDoneAll className="h-4 w-4" />
                                    <span className='text-xs font-semibold'>{table.servedCount} Servis Edildi</span>
                                  </div>
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className='space-y-2'>
                        {table.totalCount > 0 ? (
                          <>
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600 dark:text-gray-400'>Bugün Son Sipariş:</span>
                              <span className='dark:text-gray-300'>{table.lastOrderTime ? formatDate(table.lastOrderTime) : 'Yok'}</span>
                            </div>
                          </>
                        ) : (
                          <div className='text-center'>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              Bugün henüz sipariş girilmemiş
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            // Show selected table orders
            <div>
              <div className='mb-4'>
                <Button
                  color="gray"
                  onClick={() => setSelectedTable(null)}
                  className="mb-4"
                >
                  ← Masalara Geri Dön
                </Button>
              </div>

              {getTableOrders(selectedTable).length === 0 ? (
                <Card
                  theme={{
                    root: {
                      children: 'flex flex-col justify-start gap-4 p-6',
                      base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-[rgb(22,26,29)]/80 dark:bg-[rgb(22,26,29)]/80'
                    }
                  }}
                >
                  <div className="text-center py-8">
                    <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sipariş bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Masa {selectedTable} için seçilen kriterlere uygun sipariş bulunmuyor.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                  {getTableOrders(selectedTable).map(renderOrderCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )
      }

      {/* Order Detail Modal */}
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
              {/* Order Info */}
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
                  <Badge color={statusConfig[selectedOrder.status].color}>
                    {statusConfig[selectedOrder.status].text}
                  </Badge>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Saat</p>
                  <p className='font-semibold dark:text-white'>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.sessionId && (
                  <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Kullanıcı ID</p>
                    <p className='font-semibold dark:text-white break-all font-mono text-xs'>{selectedOrder.sessionId}</p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              {selectedOrder.customerName && (
                <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Müşteri Bilgisi</h4>
                  <p className='dark:text-gray-300'>Ad: {selectedOrder.customerName}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className='font-semibold mb-3 dark:text-white'>Sipariş Detayları</h4>
                <div className='space-y-2'>
                  {selectedOrder.items.map((item, index) => (
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

              {/* Notes */}
              {selectedOrder.notes && (
                <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Notlar</h4>
                  <p className='text-gray-700 dark:text-gray-300'>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Update */}
              <div className='border-t pt-4'>
                <h4 className='font-semibold mb-3 dark:text-white'>Durum Güncelle</h4>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      color={status === selectedOrder.status ? 'gray' : config.color}
                      size="sm"
                      disabled={updatingStatus || status === selectedOrder.status}
                      onClick={() => updateOrderStatus(selectedOrder._id, status)}
                    >
                      <config.icon className="mr-1 h-4 w-4" />
                      {config.text}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div >
  );
}