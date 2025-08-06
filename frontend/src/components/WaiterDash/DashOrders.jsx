import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Modal, TextInput, Select, Alert, Spinner } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiEye, HiRefresh, HiFilter, HiCalendar, HiViewBoards } from 'react-icons/hi';
import { MdRestaurant, MdLocalShipping, MdDone, MdCancel, MdOutlineTableBar } from 'react-icons/md';
import { useNotification } from './NotificationProvider';

export default function DashOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [viewMode, setViewMode] = useState('byTable'); // 'all' or 'byTable'
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
        return data.tables || [];
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
        orders: [],
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        servedCount: 0,
        cancelledCount: 0,
        totalCount: 0,
        lastOrderTime: null
      });
    });

    // Filter orders by today's date
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const filteredOrders = ordersList.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && orderDate < endOfDay;
    });

    // Add order data to tables that have orders
    filteredOrders.forEach(order => {
      const tableNumber = order.tableNumber;
      if (!tableMap.has(tableNumber)) {
        tableMap.set(tableNumber, {
          tableNumber,
          orders: [],
          pendingCount: 0,
          preparingCount: 0,
          readyCount: 0,
          servedCount: 0,
          cancelledCount: 0,
          totalCount: 0,
          lastOrderTime: null
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

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterDate) {
      const orderDate = new Date(order.createdAt).toDateString();
      const filterDateObj = new Date(filterDate).toDateString();
      if (orderDate !== filterDateObj) return false;
    }
    return true;
  });

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
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${order.status === 'pending' ? 'ring-2 ring-yellow-200' : ''
          } ${urgencyLevel === 'urgent' && order.status === 'pending' ? 'ring-2 ring-orange-400 bg-orange-50' : ''
          } ${urgencyLevel === 'critical' && order.status === 'pending' ? 'ring-2 ring-red-400 bg-red-50' : ''
          }`}
        onClick={() => {
          setSelectedOrder(order);
          setShowOrderModal(true);
        }}
      >
        <div className='flex justify-between items-start mb-3'>
          <div>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
              Masa {order.tableNumber}
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {order.orderNumber}
            </p>
          </div>
          <Badge color={status.color} className={status.bg}>
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

        {order.customerName && (
          <div className='mt-3 pt-3 border-t border-gray-200'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium'>Müşteri:</span> {order.customerName}
            </p>
          </div>
        )}

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
    <div className='flex-1 p-4 md:p-7'>
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
            ) : (
              <>
                {selectedTable ? `Masa ${selectedTable} Siparişleri` : 'Masaları Seçin'}
                {selectedTable && (
                  <span className='ml-2 text-gray-600'>
                    ({getTableOrders(selectedTable).length} sipariş)
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
      <Card className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                onClick={() => {
                  setViewMode('all');
                  setSelectedTable(null);
                }}
                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg ${viewMode === 'all'
                  ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
              >
                <HiViewBoards className="mr-2 h-4 w-4" />
                Bütün Siparişleri Sırala
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => {
                  setViewMode('byTable');
                  setSelectedTable(null);
                }}
                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg ${viewMode === 'byTable'
                  ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
              >
                <MdRestaurant className="mr-2 h-4 w-4" />
                Masalara Göre
              </button>
            </li>
          </ul>
        </div>

        <div className="mt-4">
          {viewMode === 'all' ? (
            /* Filters for All Orders */
            <div className='flex flex-col md:flex-row gap-4'>
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
                <TextInput
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  icon={HiCalendar}
                />
              </div>
            </div>
          ) : (
            /* Filters for Table View */
            <div className='flex flex-col md:flex-row gap-4'>
              <div className="flex-1">
                <TextInput
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  icon={HiCalendar}
                  placeholder="Tarihe Göre Filtrele"
                />
              </div>

              <div className="flex-1">
                <Button
                  color="gray"
                  onClick={() => setSelectedTable(null)}
                  disabled={!selectedTable}
                >
                  Tüm Masaları Göster
                </Button>
              </div>
            </div>
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
      ) : viewMode === 'all' ? (
        // All Orders View
        sortedOrders.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sipariş bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Seçilen kriterlere uygun sipariş bulunmuyor.
              </p>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {sortedOrders.map(renderOrderCard)}
          </div>
        )
      ) : (
        // Tables View
        <div>
          {!selectedTable ? (
            // Show all tables
            tables.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Masa bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Henüz hiç masa oluşturulmamış.
                  </p>
                </div>
              </Card>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {tables.map((table) => {
                  const tableOrders = getTableOrders(table.tableNumber);
                  const hasUrgentOrders = tableOrders.some(order =>
                    order.status === 'pending' && getUrgencyLevel(order.createdAt) === 'critical'
                  );

                  return (
                    <Card
                      key={table.tableNumber}
                      className={`md:max-w-xsm min-w-xs flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-lg ${table.totalCount === 0 ? 'ring-1 ring-gray-200 bg-gray-50' :
                        hasUrgentOrders ? 'ring-2 ring-red-400 bg-red-50' :
                          table.pendingCount > 0 ? 'ring-2 ring-yellow-200' : ''
                        }`}
                      onClick={() => setSelectedTable(table.tableNumber)}
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
                          </div>
                        </div>
                        <div className='text-right'>
                          {table.totalCount === 0 ? (
                            <Badge color="gray" className="mb-1">
                              Boş
                            </Badge>
                          ) : (
                            <>
                              {table.pendingCount > 0 && (
                                <Badge color="warning" className="mb-1">
                                  {table.pendingCount} Bekliyor
                                </Badge>
                              )}
                              {table.preparingCount > 0 && (
                                <Badge color="info" className="mb-1">
                                  {table.preparingCount} Hazırlanıyor
                                </Badge>
                              )}
                              {table.readyCount > 0 && (
                                <Badge color="success">
                                  {table.readyCount} Hazır
                                </Badge>
                              )}
                              {table.servedCount > 0 && (
                                <Badge color="success">
                                  {table.servedCount} Servis Edildi
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
                          <div className='text-center py-2'>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              Bugün henüz sipariş girilmemiş
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Urgency indicator */}
                      {table.totalCount > 0 && hasUrgentOrders && (
                        <div className='mt-3 pt-3 border-t border-red-200'>
                          <div className='flex items-center text-red-600'>
                            <HiClock className="mr-1 h-4 w-4 animate-pulse" />
                            <span className='text-sm font-semibold'>Kritik Siparişler!</span>
                          </div>
                        </div>
                      )}
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
                <Card>
                  <div className="text-center py-8">
                    <MdRestaurant className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sipariş bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Masa {selectedTable} için seçilen kriterlere uygun sipariş bulunmuyor.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {getTableOrders(selectedTable).map(renderOrderCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}