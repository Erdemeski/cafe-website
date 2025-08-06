import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Modal, TextInput, Select, Alert, Spinner, Textarea } from 'flowbite-react';
import { HiClock, HiCheck, HiX, HiEye, HiRefresh, HiFilter, HiCalendar, HiBell } from 'react-icons/hi';
import { MdRestaurant, MdPerson, MdAccessTime } from 'react-icons/md';
import { BiDish } from 'react-icons/bi';
import { useNotification } from './NotificationProvider';
import { useSelector } from 'react-redux';

export default function DashWaiterCalls() {
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const { currentUser } = useSelector((state) => state.user);

  const { addNotification } = useNotification();

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'warning', icon: HiClock, text: 'Bekliyor', bg: 'bg-yellow-100 text-yellow-800' },
    attended: { color: 'success', icon: HiCheck, text: 'Yanıtlandı', bg: 'bg-green-100 text-green-800' },
    cancelled: { color: 'failure', icon: HiX, text: 'İptal Edildi', bg: 'bg-red-100 text-red-800' }
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

  // Filter waiter calls
  const filteredWaiterCalls = waiterCalls.filter(call => {
    if (filterDate) {
      const callDate = new Date(call.timestamp).toDateString();
      const filterDateObj = new Date(filterDate).toDateString();
      if (callDate !== filterDateObj) return false;
    }
    return true;
  });

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
    <div className='flex-1 p-4 md:p-7'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-semibold text-gray-800 dark:text-white'>Garson Çağrıları</h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Toplam {filteredWaiterCalls.length} çağrı
            {filteredWaiterCalls.filter(call => call.status === 'pending').length > 0 && (
              <span className='ml-2 text-red-600 font-semibold'>
                ({filteredWaiterCalls.filter(call => call.status === 'pending').length} bekliyor)
              </span>
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

      {/* Filters */}
      <Card className="mb-6">
        <div className='flex flex-col md:flex-row gap-4'>
          <div className="flex-1">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              icon={HiFilter}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="attended">Yanıtlandı</option>
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
      </Card>

      {/* Waiter Calls Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      ) : error ? (
        <Alert color="failure">
          <span>{error}</span>
        </Alert>
      ) : sortedWaiterCalls.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <BiDish className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Garson çağrısı bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Seçilen kriterlere uygun garson çağrısı bulunmuyor.
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
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${call.status === 'pending' ? 'ring-2 ring-yellow-200' : ''
                  } ${urgencyLevel === 'urgent' && call.status === 'pending' ? 'ring-2 ring-orange-400 bg-orange-50' : ''
                  } ${urgencyLevel === 'critical' && call.status === 'pending' ? 'ring-2 ring-red-400 bg-red-50' : ''
                  }`}
                onClick={() => {
                  setSelectedCall(call);
                  setShowCallModal(true);
                }}
              >
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                      Masa {call.tableNumber}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      {formatDate(call.timestamp)}
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
                    <span className='text-gray-600 dark:text-gray-400'>Geçen Süre:</span>
                    <span className={
                      urgencyLevel === 'critical' && call.status === 'pending'
                        ? 'text-red-600 font-semibold'
                        : urgencyLevel === 'urgent' && call.status === 'pending'
                          ? 'text-orange-600 font-semibold'
                          : call.status === 'pending'
                            ? 'text-yellow-600 font-semibold'
                            : ''
                    }>
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
              </div>

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
