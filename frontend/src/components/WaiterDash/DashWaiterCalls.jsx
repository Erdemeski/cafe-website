import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Modal, TextInput, Select, Alert, Spinner, Textarea, Datepicker } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiEye, HiRefresh, HiFilter, HiCalendar, HiBell, HiViewBoards } from 'react-icons/hi';
import { MdRestaurant, MdPerson, MdAccessTime, MdOutlineTableBar, MdDoneAll } from 'react-icons/md';
import { BiDish } from 'react-icons/bi';
import { FiAlertTriangle } from "react-icons/fi";
import { CiNoWaitingSign } from "react-icons/ci";
import { IoIosHourglass } from "react-icons/io";
import { TbProgress } from "react-icons/tb";
import { useNotification } from './NotificationProvider';
import { useSelector } from 'react-redux';

export default function DashWaiterCalls() {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [filterTable, setFilterTable] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [viewMode, setViewMode] = useState('byTable'); // 'all', 'byTable', 'byDate'
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const { currentUser } = useSelector((state) => state.user);

  const { addNotification } = useNotification();

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'warning', icon: HiClock, text: 'Bekliyor', bg: 'bg-yellow-100 text-yellow-800' },
    attended: { color: 'success', icon: HiCheck, text: 'Yanıtlandı', bg: 'bg-green-100 text-green-800' },
    cancelled: { color: 'failure', icon: HiX, text: 'İptal Edildi', bg: 'bg-red-100 text-red-800' }
  };

  // Fetch all tables
  const fetchAllTables = async () => {
    try {
      const response = await fetch('/api/table/get-tables');
      const data = await response.json();
      if (response.ok) {
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

  // Update tables data based on calls and all tables
  const updateTablesData = async (callsList) => {
    const allTables = await fetchAllTables();

    const tableMap = new Map();

    // Initialize tables
    allTables.forEach((table) => {
      tableMap.set(table.tableNumber, {
        tableNumber: table.tableNumber,
        sessionStatus: table.sessionStatus || { isActive: false, expiresAt: null, lastValidatedAt: null },
        calls: [],
        pendingCount: 0,
        attendedCount: 0,
        cancelledCount: 0,
        totalCount: 0,
        lastCallTime: null,
        hasPrevDayCall: false,
      });
    });

    // Filter calls by today's date for summary tiles using local timezone
    const today = new Date();
    const todayString = today.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format

    const filteredCalls = (callsList || []).filter((call) => {
      const callDate = new Date(call.timestamp);
      const callDateString = callDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      return callDateString === todayString;
    });

    filteredCalls.forEach((call) => {
      const tableNumber = call.tableNumber;
      if (!tableMap.has(tableNumber)) {
        tableMap.set(tableNumber, {
          tableNumber,
          sessionStatus: { isActive: false, expiresAt: null, lastValidatedAt: null },
          calls: [],
          pendingCount: 0,
          attendedCount: 0,
          cancelledCount: 0,
          totalCount: 0,
          lastCallTime: null,
          hasPrevDayCall: false,
        });
      }

      const tableData = tableMap.get(tableNumber);
      tableData.calls.push(call);
      tableData.totalCount++;

      if (call.status === 'pending') tableData.pendingCount++;
      else if (call.status === 'attended') tableData.attendedCount++;
      else if (call.status === 'cancelled') tableData.cancelledCount++;

      const callTime = new Date(call.timestamp);
      if (!tableData.lastCallTime || callTime > tableData.lastCallTime) {
        tableData.lastCallTime = callTime;
      }
    });

    // Detect previous-day active calls per table
    const previousOrOlderCalls = (callsList || []).filter((call) => {
      const callDate = new Date(call.timestamp);
      const callDateString = callDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      return callDateString !== todayString;
    });
    previousOrOlderCalls.forEach((call) => {
      // Check for active calls (pending) from previous days
      if (call.status === 'pending') {
        const tn = call.tableNumber;
        if (!tableMap.has(tn)) {
          tableMap.set(tn, {
            tableNumber: tn,
            sessionStatus: { isActive: false, expiresAt: null, lastValidatedAt: null },
            calls: [],
            pendingCount: 0,
            attendedCount: 0,
            cancelledCount: 0,
            totalCount: 0,
            lastCallTime: null,
            hasPrevDayCall: true,
          });
        } else {
          const td = tableMap.get(tn);
          td.hasPrevDayCall = true;
        }
      }
    });

    const tablesArray = Array.from(tableMap.values()).sort((a, b) => {
      const aHasPending = a.pendingCount > 0;
      const bHasPending = b.pendingCount > 0;
      if (aHasPending !== bHasPending) return bHasPending ? 1 : -1;
      return parseInt(a.tableNumber) - parseInt(b.tableNumber);
    });

    setTables(tablesArray);
  };

  // Fetch waiter calls
  const fetchWaiterCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterTable) params.append('tableNumber', filterTable);

      const response = await fetch(`/api/table/waiter-calls?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const newCallsList = data.waiterCalls || [];
        setWaiterCalls(newCallsList);
        await updateTablesData(newCallsList);
      } else {
        setError(data.message || 'Garson çağrıları yüklenemedi');
        addNotification(data.message || 'Garson çağrıları yüklenemedi', 'error');
      }
    } catch (err) {
      setError('Garson çağrıları yüklenirken hata oluştu');
      addNotification('Garson çağrıları yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update waiter call status
  const updateWaiterCallStatus = async (callId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/table/waiter-calls/${callId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          attendedBy: newStatus === 'attended' ? currentUser.firstName + " " + currentUser.lastName : undefined,
          notes: responseNotes || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setWaiterCalls(prev => prev.map(call =>
          call._id === callId ? { ...call, status: newStatus, attendedBy: currentUser.firstName + " " + currentUser.lastName, notes: responseNotes } : call
        ));
        addNotification(`Garson çağrısı "${statusConfig[newStatus].text}" olarak güncellendi`, 'success');
        setShowCallModal(false);
        setResponseNotes('');
      } else {
        setError(data.message || 'Garson çağrısı güncellenemedi');
        addNotification(data.message || 'Garson çağrısı güncellenemedi', 'error');
      }
    } catch (err) {
      setError('Garson çağrısı güncellenirken hata oluştu');
      addNotification('Garson çağrısı güncellenirken hata oluştu', 'error');
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
    const callTime = new Date(dateString);
    const diffMs = now - callTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} saat önce`;
  };

  // Get urgency level
  const getUrgencyLevel = (timestamp) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMs = now - callTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins > 15) return 'critical';
    if (diffMins > 10) return 'urgent';
    if (diffMins > 5) return 'high';
    return 'normal';
  };

  // Filter waiter calls based on viewMode and filters
  const getFilteredCalls = () => {
    let filtered = [...waiterCalls];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((call) => call.status === filterStatus);
    }

    if (viewMode === 'byDate' && filterDate) {
      filtered = filtered.filter((call) => {
        const callDate = new Date(call.timestamp);
        // Use local timezone instead of UTC
        const callDateString = callDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
        return callDateString === filterDate;
      });
    } else if (viewMode === 'byTable' && filterDate) {
      filtered = filtered.filter((call) => {
        const callDate = new Date(call.timestamp);
        // Use local timezone instead of UTC
        const callDateString = callDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
        return callDateString === filterDate;
      });
    }

    if (filterTable) {
      filtered = filtered.filter((call) => call.tableNumber === filterTable);
    }

    return filtered;
  };

  const filteredWaiterCalls = getFilteredCalls();

  // Sort calls by urgency and time
  const sortedWaiterCalls = [...filteredWaiterCalls].sort((a, b) => {
    // First by status (pending first)
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1;
      if (b.status === 'pending') return 1;
    }

    // Then by urgency for pending calls
    if (a.status === 'pending' && b.status === 'pending') {
      const urgencyA = getUrgencyLevel(a.timestamp);
      const urgencyB = getUrgencyLevel(b.timestamp);

      const urgencyOrder = { critical: 0, urgent: 1, high: 2, normal: 3 };
      if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
        return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
      }

      // Then by time (oldest first for urgent calls)
      return new Date(a.timestamp) - new Date(b.timestamp);
    }

    // For non-pending calls, sort by newest first
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Get table calls
  const getTableCalls = (tableNumber) => {
    return sortedWaiterCalls.filter((call) => call.tableNumber === tableNumber);
  };

  // Handle viewMode change
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    setSelectedTable(null);

    if (newViewMode === 'all') {
      setFilterTable('');
      // Keep date empty? For consistency with orders, in 'all' we do not filter by date
      // but we keep filterDate state untouched
    } else if (newViewMode === 'byDate') {
      setFilterTable('');
      if (!filterDate) setFilterDate(getTodayDate());
    } else if (newViewMode === 'byTable') {
      setFilterTable('');
      if (!filterDate) setFilterDate(getTodayDate());
    }
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    fetchWaiterCalls();
    const interval = setInterval(fetchWaiterCalls, 15000);
    return () => clearInterval(interval);
  }, [filterStatus, filterTable]);

  // Manual refresh
  const handleRefresh = () => {
    fetchWaiterCalls();
    addNotification('Garson çağrıları yenilendi', 'info');
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
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-yellow-300 to-red-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse"
        />
      </div>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-semibold text-gray-800 dark:text-white'>Garson Çağrıları</h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            {viewMode === 'all' ? (
              <>
                Toplam {filteredWaiterCalls.length} çağrı
                {filteredWaiterCalls.filter(call => call.status === 'pending').length > 0 && (
                  <span className='ml-2 text-red-600 font-semibold'>
                    ({filteredWaiterCalls.filter(call => call.status === 'pending').length} bekliyor)
                  </span>
                )}
              </>
            ) : viewMode === 'byDate' ? (
              <>
                {filterDate ? `${filterDate} Tarihli Çağrılar` : 'Tarih Seçin'}
                {filterDate && (
                  <span className='ml-2 text-gray-600'>
                    ({filteredWaiterCalls.length} çağrı mevcut)
                  </span>
                )}
              </>
            ) : (
              <>
                {selectedTable ? `Masa ${selectedTable} Çağrıları` : 'Bir Masa Seçin'}
                {selectedTable && (
                  <span className='ml-2 text-gray-600'>
                    ({getTableCalls(selectedTable).length} çağrı mevcut) ({filterDate} tarihli)
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
        }}
      >
        <div className="border-b border-gray-300 dark:border-gray-600">
        <ul className="flex flex-wrap -mb-px text-xs sm:text-sm font-semibold sm:font-medium text-center">
        <li className="mr-1">
              <button
                onClick={() => handleViewModeChange('byTable')}
                className={`inline-flex items-center justify-center p-2 border-b-2 rounded-t-lg ${viewMode === 'byTable'
                  ? 'text-orange-500 border-orange-500 active dark:text-orange-400 dark:border-orange-400'
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
                  ? 'text-orange-500 border-orange-500 active dark:text-orange-400 dark:border-orange-400'
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
                  ? 'text-orange-500 border-orange-500 active dark:text-orange-400 dark:border-orange-400'
                  : 'border-transparent hover:text-gray-900 hover:border-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <HiViewBoards className="mr-1 h-4 w-4" />
                Bütün Çağrılar
              </button>
            </li>
          </ul>
        </div>

        <div className={`${selectedTable ? 'mt-2' : `${viewMode === 'byTable' ? 'mt-2 hidden' : 'mt-2'}`}`}>
          {viewMode === 'all' ? (
            // Filters for All Calls
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
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} icon={HiFilter}>
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Bekliyor</option>
                  <option value="attended">Yanıtlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </Select>
              </div>
            </div>
          ) : viewMode === 'byDate' ? (
            // Filters for Date View
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
                    }
                  }}
                  theme={{
                    popup: {
                      footer: {
                        base: 'mt-2 flex space-x-2',
                        button: {
                          base: 'w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-cyan-300',
                          today: 'bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700',
                          clear: 'hidden',
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="flex-1">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} icon={HiFilter}>
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Bekliyor</option>
                  <option value="attended">Yanıtlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </Select>
              </div>
            </div>
          ) : (
            // Filters for Table View
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
                        }
                      }}
                      theme={{
                        popup: {
                          footer: {
                            base: 'mt-2 flex space-x-2',
                            button: {
                              base: 'w-full rounded-lg px-5 py-2 text-center text-sm font-medium focus:ring-4 focus:ring-cyan-300',
                              today: 'bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700',
                              clear: 'hidden',
                            },
                          },
                        },
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
        // All Calls View or Date View
        sortedWaiterCalls.length === 0 ? (
          <Card
            theme={{
              root: {
                children: 'flex flex-col justify-start gap-4 p-6',
                base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-[rgb(22,26,29)]/80 dark:bg-[rgb(22,26,29)]/80'
              }
            }}
          >
            <div className="text-center py-8">
              <BiDish className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Garson çağrısı bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {viewMode === 'byDate' && !filterDate ? 'Lütfen bir tarih seçin.' : 'Seçilen kriterlere uygun çağrı bulunmuyor.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {sortedWaiterCalls.map((call) => {
              const status = statusConfig[call.status];
              const StatusIcon = status.icon;
              const urgencyLevel = getUrgencyLevel(call.timestamp);

              return (
                <Card
                  key={call._id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-lg ${call.status === 'pending' ? 'ring-2 ring-yellow-200' : ''
                    } ${urgencyLevel === 'urgent' && call.status === 'pending' ? 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20' : ''
                    } ${urgencyLevel === 'critical' && call.status === 'pending' ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/30' : ''
                    }`}
                  onClick={() => {
                    setSelectedCall(call);
                    setShowCallModal(true);
                  }}
                  theme={{
                    root: {
                      children: 'flex h-full flex-col justify-start gap-4 p-4',
                      base: 'flex rounded-lg border border-gray-100 bg-white/70 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
                    }
                  }}
                >
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                        Masa {call.tableNumber}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>{formatDate(call.timestamp)}</p>
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
                      <span className='text-gray-600 dark:text-gray-400'>Geçen Süre:</span>
                      <span
                        className={
                          urgencyLevel === 'critical' && call.status === 'pending'
                            ? 'text-red-600 font-semibold'
                            : urgencyLevel === 'urgent' && call.status === 'pending'
                              ? 'text-orange-600 font-semibold'
                              : call.status === 'pending'
                                ? 'text-yellow-600 font-semibold'
                                : ''
                        }
                      >
                        {getTimeElapsed(call.timestamp)}
                      </span>
                    </div>

                    {call.attendedBy && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-400'>Yanıtlayan:</span>
                        <span className='font-medium dark:text-gray-300'>{call.attendedBy}</span>
                      </div>
                    )}

                    {call.attendedAt && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-400'>Yanıtlanma:</span>
                        <span className='dark:text-gray-300'>{formatDate(call.attendedAt)}</span>
                      </div>
                    )}
                  </div>

                  {call.sessionId && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600 dark:text-gray-400'>Kullanıcı ID:</span>
                      <span className='font-mono text-xs break-all'>{call.sessionId}</span>
                    </div>
                  )}

                  {call.notes && (
                    <div className='mt-3 pt-3 border-t border-gray-200'>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        <span className='font-medium dark:text-gray-300'>Not:</span> {call.notes}
                      </p>
                    </div>
                  )}

                  {/* Urgency indicator */}
                  {call.status === 'pending' && urgencyLevel === 'critical' && (
                    <div className='mt-3 pt-3 border-t border-red-200'>
                      <div className='flex items-center text-red-600'>
                        <HiBell className="mr-1 h-4 w-4 animate-pulse" />
                        <span className='text-sm font-semibold'>Kritik!</span>
                      </div>
                    </div>
                  )}

                  {/* High urgency indicator */}
                  {call.status === 'pending' && urgencyLevel === 'urgent' && (
                    <div className='mt-3 pt-3 border-t border-orange-200'>
                      <div className='flex items-center text-orange-600'>
                        <HiBell className="mr-1 h-4 w-4" />
                        <span className='text-sm font-semibold'>Acil!</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        // Tables View
        <div>
          {!selectedTable ? (
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
                  <BiDish className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Masa bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Henüz hiç masa oluşturulmamış.</p>
                </div>
              </Card>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
                {tables.map((table) => {
                  const tableCalls = getTableCalls(table.tableNumber);
                  const hasUrgentCalls = tableCalls.some(
                    (call) => call.status === 'pending' && getUrgencyLevel(call.timestamp) === 'critical'
                  );

                  return (
                    <Card
                      key={table.tableNumber}
                      className={`md:max-w-xsm min-w-xs flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-lg border rounded-lg
                        ${hasUrgentCalls ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' :
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
                          <div className='w-20 h-16 mx-auto bg-gradient-to-br ml-0 from-yellow-300 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
                            <MdOutlineTableBar className='w-10 h-10' />
                            <span className='text-2xl font-semibold'>{table.tableNumber}</span>
                          </div>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>Masa {table.tableNumber}</h3>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                              {table.totalCount > 0 ? `Bugün ${table.totalCount} çağrı` : 'Bugün çağrı yok'}
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
                          {table.totalCount > 0 && hasUrgentCalls && (
                            <Badge color="failure">
                              <div className='flex items-center gap-1'>
                                <FiAlertTriangle className="h-4 w-4 animate-pulse" />
                                <span className='text-xs font-semibold'>Kritik Çağrılar!</span>
                              </div>
                            </Badge>
                          )}

                          {/* Previous day active calls warning */}
                          {table.hasPrevDayCall && (
                            <Badge color="warning">
                              <div className='flex items-center gap-1'>
                                <HiClock className="h-4 w-4 animate-pulse" />
                                <span className='text-xs font-semibold'>Eski çağrılar var</span>
                              </div>
                            </Badge>
                          )}

                          {table.totalCount === 0 ? (
                            <Badge color="danger">
                              <div className='flex items-center gap-1'>
                                <CiNoWaitingSign className="h-4 w-4" />
                                <span className='text-xs font-semibold'>Bugün çağrı yok</span>
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
                              {table.attendedCount > 0 && (
                                <Badge color="success" className="mb-1">
                                  <div className='flex items-center gap-1'>
                                    <MdDoneAll className="h-4 w-4" />
                                    <span className='text-xs font-semibold'>{table.attendedCount} Yanıtlandı</span>
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
                              <span className='text-gray-600 dark:text-gray-400'>Bugün Son Çağrı:</span>
                              <span className='dark:text-gray-300'>
                                {table.lastCallTime ? formatDate(table.lastCallTime) : 'Yok'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className='text-center'>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>Bugün henüz çağrı yok</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            // Selected table calls
            <div>
              <div className='mb-4'>
                <Button color="gray" onClick={() => setSelectedTable(null)} className='mb-4'>
                  ← Masalara Geri Dön
                </Button>
              </div>

              {getTableCalls(selectedTable).length === 0 ? (
                <Card
                  theme={{
                    root: {
                      children: 'flex flex-col justify-start gap-4 p-6',
                      base: 'flex rounded-lg border border-gray-100 bg-white/50 shadow-lg dark:border-[rgb(22,26,29)]/80 dark:bg-[rgb(22,26,29)]/80'
                    }
                  }}
                >
                  <div className='text-center py-8'>
                    <BiDish className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>Çağrı bulunamadı</h3>
                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>Masa {selectedTable} için seçilen kriterlere uygun çağrı bulunmuyor.</p>
                  </div>
                </Card>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {getTableCalls(selectedTable).map((call) => {
                    const status = statusConfig[call.status];
                    const StatusIcon = status.icon;
                    const urgencyLevel = getUrgencyLevel(call.timestamp);
                    return (
                      <Card
                        key={call._id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${call.status === 'pending' ? 'ring-2 ring-yellow-200' : ''
                          } ${urgencyLevel === 'urgent' && call.status === 'pending'
                            ? 'ring-2 ring-orange-400 bg-orange-50'
                            : ''
                          } ${urgencyLevel === 'critical' && call.status === 'pending' ? 'ring-2 ring-red-400 bg-red-50' : ''
                          }`}
                        onClick={() => {
                          setSelectedCall(call);
                          setShowCallModal(true);
                        }}
                        theme={{
                          root: {
                            children: 'flex h-full flex-col justify-start gap-4 p-4',
                            base: 'flex rounded-lg border border-gray-100 bg-white/70 shadow-lg dark:border-gray-700 dark:bg-[rgb(32,38,43)]/70'
                          }
                        }}
                      >
                        <div className='flex justify-between items-start mb-3'>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>Masa {call.tableNumber}</h3>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>{formatDate(call.timestamp)}</p>
                          </div>
                          <Badge color={status.color} className={status.bg}>
                            <div className='flex items-center'>
                              <StatusIcon className='mr-1 h-3 w-3' />
                              {status.text}
                            </div>
                          </Badge>
                        </div>
                        <div className='space-y-2'>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600 dark:text-gray-400'>Geçen Süre:</span>
                            <span
                              className={
                                urgencyLevel === 'critical' && call.status === 'pending'
                                  ? 'text-red-600 font-semibold'
                                  : urgencyLevel === 'urgent' && call.status === 'pending'
                                    ? 'text-orange-600 font-semibold'
                                    : call.status === 'pending'
                                      ? 'text-yellow-600 font-semibold'
                                      : ''
                              }
                            >
                              {getTimeElapsed(call.timestamp)}
                            </span>
                          </div>
                          {call.attendedBy && (
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600 dark:text-gray-400'>Yanıtlayan:</span>
                              <span className='font-medium dark:text-gray-300'>{call.attendedBy}</span>
                            </div>
                          )}
                          {call.attendedAt && (
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600 dark:text-gray-400'>Yanıtlanma:</span>
                              <span className='dark:text-gray-300'>{formatDate(call.attendedAt)}</span>
                            </div>
                          )}
                        </div>
                        {call.sessionId && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600 dark:text-gray-400'>Kullanıcı ID:</span>
                            <span className='font-mono text-xs break-all'>{call.sessionId}</span>
                          </div>
                        )}
                        {call.notes && (
                          <div className='mt-3 pt-3 border-t border-gray-200'>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                              <span className='font-medium dark:text-gray-300'>Not:</span> {call.notes}
                            </p>
                          </div>
                        )}
                        {call.status === 'pending' && urgencyLevel === 'critical' && (
                          <div className='mt-3 pt-3 border-t border-red-200'>
                            <div className='flex items-center text-red-600'>
                              <HiBell className='mr-1 h-4 w-4 animate-pulse' />
                              <span className='text-sm font-semibold'>Kritik!</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Waiter Call Detail Modal */}
      <Modal show={showCallModal} onClose={() => setShowCallModal(false)} size="lg" className='pt-16 mb-2'>
        <Modal.Header className='p-3'>
          <div className="flex items-center">
            <BiDish className="mr-2 h-5 w-5" />
            Garson Çağrısı - Masa {selectedCall?.tableNumber}
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedCall && (
            <div className='space-y-6'>
              {/* Call Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Masa No</p>
                  <p className='font-semibold dark:text-white'>{selectedCall.tableNumber}</p>
                </div>
                <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>Durum</p>
                  <Badge color={statusConfig[selectedCall.status].color}>
                    {statusConfig[selectedCall.status].text}
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
                {/*                 {selectedCall.sessionId && (
                  <div className='text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>Kullanıcı ID</p>
                    <p className='font-semibold dark:text-white break-all font-mono text-xs'>{selectedCall.sessionId}</p>
                  </div>
                )}
 */}              </div>

              {/* Notes */}
              {selectedCall.notes && (
                <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <h4 className='font-semibold mb-2 dark:text-white'>Müşteri Notu</h4>
                  <p className='text-gray-700 dark:text-gray-300'>{selectedCall.notes}</p>
                </div>
              )}

              {/* Response Notes */}
              {selectedCall.status === 'pending' && (
                <div>
                  <h4 className='font-semibold mb-2 dark:text-white'>Yanıt Notu (Opsiyonel)</h4>
                  <Textarea
                    placeholder="Müşteriye bırakacağınız not..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Status Update */}
              <div className='border-t pt-4'>
                <h4 className='font-semibold mb-3 dark:text-white'>Durum Güncelle</h4>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                      key={status}
                      color={status === selectedCall.status ? 'gray' : config.color}
                      size="sm"
                      disabled={updatingStatus || status === selectedCall.status}
                      onClick={() => updateWaiterCallStatus(selectedCall._id, status)}
                    >
                      <config.icon className="mr-1 h-4 w-4" />
                      {config.text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Attended Info */}
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
    </div>
  );
}
