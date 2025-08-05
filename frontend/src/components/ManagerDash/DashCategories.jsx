import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Modal, TextInput, Label, Alert, Spinner, ToggleSwitch } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiEyeOff } from 'react-icons/hi';
import { FaGripVertical } from 'react-icons/fa';

export default function DashCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showProductStatusModal, setShowProductStatusModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [productCount, setProductCount] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        isActive: true
    });
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Mobil reorder için state'ler
    const [isReordering, setIsReordering] = useState(false);
    const [touchStartY, setTouchStartY] = useState(0);
    const [currentTouchY, setCurrentTouchY] = useState(0);
    const [reorderModalOpen, setReorderModalOpen] = useState(false);
    const [selectedReorderIndex, setSelectedReorderIndex] = useState(null);
    const touchTimeoutRef = useRef(null);

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/category/categories');
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            } else {
                setError('Kategoriler yüklenemedi');
            }
        } catch (err) {
            setError('Kategoriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Create category
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch('/api/category/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', description: '', image: '', isActive: true });
                setFormSuccess('Kategori başarıyla oluşturuldu.');
                fetchCategories();
                setTimeout(() => setFormSuccess(null), 3000);
            } else {
                setFormError(data.message || 'Kategori oluşturulamadı');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Update category
    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/category/categories/${selectedCategory._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setSelectedCategory(null);
                setFormData({ name: '', description: '', image: '', isActive: true });
                setFormSuccess('Kategori başarıyla güncellendi.');
                fetchCategories();
                setTimeout(() => setFormSuccess(null), 3000);
            } else {
                setFormError(data.message || 'Kategori güncellenemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Fetch product count for a category
    const fetchProductCount = async (categoryId) => {
        try {
            const res = await fetch(`/api/product/get-products-by-category/${categoryId}`);
            const data = await res.json();
            if (res.ok) {
                return data.products ? data.products.length : 0;
            }
            return 0;
        } catch (err) {
            console.error('Ürün sayısı alınamadı:', err);
            return 0;
        }
    };

    // Update category with product status confirmation
    const handleUpdateWithProductConfirmation = async (e) => {
        e.preventDefault();

        // Check if isActive status is being changed
        const isActiveStatusChanged = selectedCategory.isActive !== formData.isActive;

        if (isActiveStatusChanged) {
            // Fetch product count for this category
            const count = await fetchProductCount(selectedCategory._id);
            setProductCount(count);
            // Show confirmation modal for product status update
            setShowProductStatusModal(true);
        } else {
            // No status change, proceed with normal update
            await handleUpdate(e);
        }
    };

    // Handle product status update confirmation
    const handleProductStatusUpdate = async (updateProducts) => {
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/category/categories/${selectedCategory._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    updateProducts: updateProducts
                })
            });
            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setShowProductStatusModal(false);
                setSelectedCategory(null);
                setFormData({ name: '', description: '', image: '', isActive: true });
                setFormSuccess(updateProducts ?
                    `Kategori ve ${productCount} ürün başarıyla güncellendi.` :
                    'Kategori başarıyla güncellendi.'
                );
                fetchCategories();
                // Clear success message after 3 seconds
                setTimeout(() => setFormSuccess(null), 3000);
            } else {
                setFormError(data.message || 'Kategori güncellenemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete category
    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/category/categories/${selectedCategory._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setShowDeleteModal(false);
                setSelectedCategory(null);
                setFormSuccess('Kategori başarıyla silindi.');
                fetchCategories();
                setTimeout(() => setFormSuccess(null), 3000);
            } else {
                const data = await res.json();
                setFormError(data.message || 'Kategori silinemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit category modal
    const openEditModal = (category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            image: category.image || '',
            isActive: category.isActive
        });
        setShowEditModal(true);
    };

    // Delete category modal
    const openDeleteModal = (category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    // Mobil reorder fonksiyonları
    const handleTouchStart = (e, index) => {
        setTouchStartY(e.touches[0].clientY);
        setCurrentTouchY(e.touches[0].clientY);
        setSelectedReorderIndex(index);
        
        // Visual feedback
        e.target.style.transform = 'scale(0.98)';
        
        // Long press detection
        touchTimeoutRef.current = setTimeout(() => {
            setIsReordering(true);
            setReorderModalOpen(true);
            // Haptic feedback (if available)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchMove = (e) => {
        if (isReordering) {
            e.preventDefault();
            setCurrentTouchY(e.touches[0].clientY);
        }
    };

    const handleTouchEnd = (e) => {
        if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
        }
        
        // Reset visual feedback
        if (e.target) {
            e.target.style.transform = 'scale(1)';
        }
        
        if (!isReordering) {
            setSelectedReorderIndex(null);
        }
    };

    const handleReorderMove = (direction) => {
        if (selectedReorderIndex === null) return;
        
        const newIndex = direction === 'up' 
            ? Math.max(0, selectedReorderIndex - 1)
            : Math.min(categories.length - 1, selectedReorderIndex + 1);
        
        if (newIndex !== selectedReorderIndex) {
            const newCategories = [...categories];
            const [movedItem] = newCategories.splice(selectedReorderIndex, 1);
            newCategories.splice(newIndex, 0, movedItem);
            
            setCategories(newCategories);
            setSelectedReorderIndex(newIndex);
            
            // Backend'e gönder
            updateCategoryOrder(newCategories);
        }
    };

    const updateCategoryOrder = async (newCategories) => {
        try {
            await fetch('/api/category/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    categories: newCategories.map((cat, index) => ({ 
                        id: cat._id, 
                        order: index 
                    })) 
                })
            });
        } catch (err) {
            console.error('Sıralama güncellenemedi:', err);
        }
    };

    const closeReorderModal = () => {
        setReorderModalOpen(false);
        setIsReordering(false);
        setSelectedReorderIndex(null);
    };

    // Desktop drag and drop functionality
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.target.classList.add('opacity-50');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
        setDraggedIndex(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newCategories = [...categories];
        const [draggedItem] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(dropIndex, 0, draggedItem);

        setCategories(newCategories);
        updateCategoryOrder(newCategories);
    };

    if (loading) {
        return (
            <div className='flex-1 p-7 flex items-center justify-center'>
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className='flex-1 py-7 px-3 sm:px-7 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-900'>
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center mb-6'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Kategoriler</h1>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                        Mobil cihazlarda kategoriyi yeniden sıralamak için uzun basın
                    </p>
                </div>
                <Button
                    gradientDuoTone="purpleToBlue"
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-2 '
                >
                    <HiPlus className='w-5 h-5' />
                    Yeni Kategori
                </Button>
            </div>

            {error && (
                <Alert color="failure" className='mb-4'>
                    {error}
                </Alert>
            )}

            {formSuccess && (
                <Alert color="success" className='mb-4'>
                    {formSuccess}
                </Alert>
            )}

            <div className='grid gap-4'>
                {categories.map((category, index) => (
                    <Card
                        key={category._id}
                        className={`transition-all duration-200 hover:shadow-lg ${
                            draggedIndex === index ? 'opacity-50' : ''
                        } ${
                            selectedReorderIndex === index ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        theme={{
                            root: {
                                children: 'flex h-full flex-col justify-center gap-4 p-2 sm:p-6'
                            }
                        }}
                    >
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-4 flex-1'>
                                <div className='flex items-center gap-2 text-gray-500 cursor-move select-none'>
                                    <FaGripVertical className='w-4 h-4' />
                                    <span className='text-sm font-medium'>{index + 1}</span>
                                    <span className='text-xs text-gray-400 hidden sm:inline'>• Sürükle</span>
                                </div>

                                <div className='flex items-center gap-3 flex-1'>
                                    {category.image && (
                                        <div className='w-10 h-10 sm:w-12 sm:h-12 text-3xl sm:text-4xl flex items-center justify-center object-cover text-center rounded-lg'>
                                            {category.image}
                                        </div>
                                    )}
                                    <div className='flex-1'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white'>
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className='text-gray-600 dark:text-gray-400 text-sm'>
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className='flex items-center gap-3 ml-2'>
                                <div className='flex flex-col sm:flex-row items-center'>
                                    {category.isActive ? (
                                        <HiEye className='w-5 h-5 text-green-500' />
                                    ) : (
                                        <HiEyeOff className='w-5 h-5 text-red-500' />
                                    )}
                                    <span className={`text-sm ${category.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {category.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div className='flex flex-col sm:flex-row items-center gap-2'>
                                    <Button
                                        size="sm"
                                        color="gray"
                                        onClick={() => openEditModal(category)}
                                    >
                                        <HiPencil className='w-4 h-4' />
                                    </Button>

                                    <Button
                                        size="sm"
                                        color="failure"
                                        onClick={() => openDeleteModal(category)}
                                    >
                                        <HiTrash className='w-4 h-4' />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {categories.length === 0 && (
                    <Card className='text-center py-12'>
                        <p className='text-gray-500 dark:text-gray-400'>Henüz kategori bulunmuyor.</p>
                        <Button
                            gradientDuoTone="purpleToBlue"
                            className='mt-4'
                            onClick={() => setShowCreateModal(true)}
                        >
                            İlk Kategoriyi Oluştur
                        </Button>
                    </Card>
                )}
            </div>

            {/* Create Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="md" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Yeni Kategori Oluştur</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleCreate} className='space-y-4'>
                        <div className='flex items-center gap-2'>
                            <ToggleSwitch checked={formData.isActive} id="edit-isActive" onChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                            <Label htmlFor="edit-isActive">{formData.isActive ? 'Aktif' : <span className='text-red-500'>Deaktif</span>}</Label>
                        </div>

                        <div>
                            <Label htmlFor="name">Kategori Adı</Label>
                            <TextInput
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Açıklama <span className='text-xs text-gray-500 dark:text-gray-400'> (Opsiyonel)</span></Label>
                            <TextInput
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="image">Resim <span className='text-xs text-gray-500 dark:text-gray-400'> (Emoji)</span></Label>
                            <TextInput
                                id="image"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="🍕"
                            />
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
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="md" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Kategori Düzenle</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleUpdateWithProductConfirmation} className='space-y-4'>
                        <div className='flex items-center gap-2'>
                            <ToggleSwitch checked={formData.isActive} id="edit-isActive" onChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                            <Label htmlFor="edit-isActive">{formData.isActive ? 'Aktif' : <span className='text-red-500'>Deaktif</span>}</Label>
                        </div>

                        <div>
                            <Label htmlFor="edit-name">Kategori Adı</Label>
                            <TextInput
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-description">Açıklama <span className='text-xs text-gray-500 dark:text-gray-400'> (Opsiyonel)</span></Label>
                            <TextInput
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-image">Resim <span className='text-xs text-gray-500 dark:text-gray-400'> (Emoji)</span></Label>
                            <TextInput
                                id="edit-image"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="🍕"
                            />
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
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Kategori Sil</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <p>
                            <strong>{selectedCategory?.name}</strong> kategorisini silmek istediğinizden emin misiniz?
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            Bu işlem geri alınamaz ve kategoriye ait tüm ürünler etkilenebilir.
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

            {/* Product Status Confirmation Modal */}
            <Modal show={showProductStatusModal} onClose={() => setShowProductStatusModal(false)} size="md" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Ürün Durumu Güncelleme</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <p>
                            <strong>{selectedCategory?.name}</strong> kategorisinin durumu
                            <span className={`font-bold ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {formData.isActive ? ' aktif' : ' pasif'}
                            </span> olarak değiştirilecek.
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            Bu kategoriye bağlı <strong>{productCount} ürün</strong> bulunuyor.
                            Bu ürünlerin durumunu da güncellemek istiyor musunuz?
                        </p>

                        {formError && (
                            <Alert color="failure">
                                {formError}
                            </Alert>
                        )}

                        <div className='flex gap-2 justify-end'>
                            <Button
                                color="gray"
                                onClick={() => {
                                    setShowProductStatusModal(false);
                                    setShowEditModal(false);
                                    setSelectedCategory(null);
                                    setFormData({ name: '', description: '', image: '', isActive: true });
                                }}
                            >
                                İptal
                            </Button>
                            <Button
                                color="gray"
                                onClick={() => handleProductStatusUpdate(false)}
                                disabled={submitting}
                            >
                                {submitting ? <Spinner size="sm" /> : 'Sadece Kategori'}
                            </Button>
                            <Button
                                gradientDuoTone="purpleToBlue"
                                onClick={() => handleProductStatusUpdate(true)}
                                disabled={submitting}
                            >
                                {submitting ? <Spinner size="sm" /> : 'Kategori ve Ürünler'}
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Mobil Reorder Modal */}
            <Modal show={reorderModalOpen} onClose={closeReorderModal} size="sm" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Kategori Sıralaması</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            <strong>{categories[selectedReorderIndex]?.name}</strong> kategorisini yeniden sıralamak için aşağıdaki butonları kullanın.
                        </p>
                        
                        <div className='flex flex-col gap-2'>
                            <Button
                                color="gray"
                                onClick={() => handleReorderMove('up')}
                                disabled={selectedReorderIndex === 0}
                                className='flex items-center justify-center gap-2'
                            >
                                ↑ Yukarı Taşı
                            </Button>
                            
                            <Button
                                color="gray"
                                onClick={() => handleReorderMove('down')}
                                disabled={selectedReorderIndex === categories.length - 1}
                                className='flex items-center justify-center gap-2'
                            >
                                ↓ Aşağı Taşı
                            </Button>
                        </div>

                        <div className='flex gap-2 justify-end'>
                            <Button color="gray" onClick={closeReorderModal}>
                                Kapat
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}