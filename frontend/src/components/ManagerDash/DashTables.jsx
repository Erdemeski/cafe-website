import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, TextInput, Label, Alert, Spinner } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiEyeOff } from 'react-icons/hi';

export default function DashTables() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [formData, setFormData] = useState({
        tableNumber: '',
        securityCode: ''
    });
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch tables
    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/table/get-tables');
            const data = await res.json();
            if (res.ok) {
                setTables(data.tables || []);
            } else {
                setError('Masalar yüklenemedi');
            }
        } catch (err) {
            setError('Masalar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // Generate random security code
    const generateSecurityCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData({ ...formData, securityCode: code });
    };

    // Create table
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch('/api/table/create-table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ tableNumber: '', securityCode: '' });
                fetchTables();
            } else {
                setFormError(data.message || 'Masa oluşturulamadı');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Update table
    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/table/update-table/${selectedTable._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setSelectedTable(null);
                setFormData({ tableNumber: '', securityCode: '' });
                fetchTables();
            } else {
                setFormError(data.message || 'Masa güncellenemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete table
    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/table/delete-table/${selectedTable._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setShowDeleteModal(false);
                setSelectedTable(null);
                fetchTables();
            } else {
                const data = await res.json();
                setFormError(data.message || 'Masa silinemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit table modal
    const openEditModal = (table) => {
        setSelectedTable(table);
        setFormData({
            tableNumber: table.tableNumber,
            securityCode: table.securityCode
        });
        setShowEditModal(true);
    };

    // Delete table modal
    const openDeleteModal = (table) => {
        setSelectedTable(table);
        setShowDeleteModal(true);
    };

    if (loading) {
        return (
            <div className='flex-1 p-7 flex items-center justify-center'>
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className='flex-1 p-7'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Masalar</h1>
                <Button 
                    gradientDuoTone="purpleToBlue" 
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-2'
                >
                    <HiPlus className='w-5 h-5' />
                    Yeni Masa
                </Button>
            </div>

            {error && (
                <Alert color="failure" className='mb-4'>
                    {error}
                </Alert>
            )}

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {tables.map((table) => (
                    <Card key={table._id} className='hover:shadow-lg transition-shadow'>
                        <div className='text-center space-y-4'>
                            <div className='w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
                                {table.tableNumber}
                            </div>
                            
                            <div className='space-y-2'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                    Masa {table.tableNumber}
                                </h3>
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    Güvenlik Kodu: <span className='font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded'>{table.securityCode}</span>
                                </p>
                                <p className='text-xs text-gray-500'>
                                    Oluşturulma: {new Date(table.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                        </div>

                        <div className='flex gap-2 mt-4'>
                            <Button 
                                size="sm" 
                                color="gray" 
                                onClick={() => openEditModal(table)}
                                className='flex-1'
                            >
                                <HiPencil className='w-4 h-4 mr-1' />
                                Düzenle
                            </Button>
                            <Button 
                                size="sm" 
                                color="failure" 
                                onClick={() => openDeleteModal(table)}
                            >
                                <HiTrash className='w-4 h-4' />
                            </Button>
                        </div>
                    </Card>
                ))}

                {tables.length === 0 && (
                    <Card className='text-center py-12 col-span-full'>
                        <p className='text-gray-500 dark:text-gray-400'>Henüz masa bulunmuyor.</p>
                        <Button 
                            gradientDuoTone="purpleToBlue" 
                            className='mt-4'
                            onClick={() => setShowCreateModal(true)}
                        >
                            İlk Masayı Oluştur
                        </Button>
                    </Card>
                )}
            </div>

            {/* Create Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="md">
                <Modal.Header>Yeni Masa Oluştur</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleCreate} className='space-y-4'>
                        <div>
                            <Label htmlFor="tableNumber">Masa Numarası</Label>
                            <TextInput
                                id="tableNumber"
                                value={formData.tableNumber}
                                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                                placeholder="Örn: A1, B2, 1, 2..."
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="securityCode">Güvenlik Kodu</Label>
                            <div className='flex gap-2'>
                                <TextInput
                                    id="securityCode"
                                    value={formData.securityCode}
                                    onChange={(e) => setFormData({ ...formData, securityCode: e.target.value })}
                                    placeholder="Otomatik oluştur veya manuel gir"
                                    required
                                    className='flex-1'
                                />
                                <Button 
                                    type="button"
                                    color="gray" 
                                    onClick={generateSecurityCode}
                                    className='px-4'
                                >
                                    Oluştur
                                </Button>
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Güvenlik kodu müşterilerin masaya erişmek için kullanacağı koddur.
                            </p>
                        </div>

                        {formError && (
                            <Alert color="failure">
                                {formError}
                            </Alert>
                        )}

                        <div className='flex gap-2 justify-end'>
                            <Button color="gray" onClick={() => setShowCreateModal(false)}>
                                İptal
                            </Button>
                            <Button type="submit" gradientDuoTone="purpleToBlue" disabled={submitting}>
                                {submitting ? <Spinner size="sm" /> : 'Oluştur'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="md">
                <Modal.Header>Masa Düzenle</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleUpdate} className='space-y-4'>
                        <div>
                            <Label htmlFor="edit-tableNumber">Masa Numarası</Label>
                            <TextInput
                                id="edit-tableNumber"
                                value={formData.tableNumber}
                                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                                placeholder="Örn: A1, B2, 1, 2..."
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="edit-securityCode">Güvenlik Kodu</Label>
                            <div className='flex gap-2'>
                                <TextInput
                                    id="edit-securityCode"
                                    value={formData.securityCode}
                                    onChange={(e) => setFormData({ ...formData, securityCode: e.target.value })}
                                    placeholder="Otomatik oluştur veya manuel gir"
                                    required
                                    className='flex-1'
                                />
                                <Button 
                                    type="button"
                                    color="gray" 
                                    onClick={generateSecurityCode}
                                    className='px-4'
                                >
                                    Oluştur
                                </Button>
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Güvenlik kodu müşterilerin masaya erişmek için kullanacağı koddur.
                            </p>
                        </div>

                        {formError && (
                            <Alert color="failure">
                                {formError}
                            </Alert>
                        )}

                        <div className='flex gap-2 justify-end'>
                            <Button color="gray" onClick={() => setShowEditModal(false)}>
                                İptal
                            </Button>
                            <Button type="submit" gradientDuoTone="purpleToBlue" disabled={submitting}>
                                {submitting ? <Spinner size="sm" /> : 'Güncelle'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
                <Modal.Header>Masa Sil</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <p>
                            <strong>Masa {selectedTable?.tableNumber}</strong> masasını silmek istediğinizden emin misiniz?
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            Bu işlem geri alınamaz ve masaya ait tüm siparişler etkilenebilir.
                        </p>

                        {formError && (
                            <Alert color="failure">
                                {formError}
                            </Alert>
                        )}

                        <div className='flex gap-2 justify-end'>
                            <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                                İptal
                            </Button>
                            <Button color="failure" onClick={handleDelete} disabled={submitting}>
                                {submitting ? <Spinner size="sm" /> : 'Sil'}
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}