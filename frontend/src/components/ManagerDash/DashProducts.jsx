import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, TextInput, Label, Alert, Spinner, Select, Textarea, ToggleSwitch, Checkbox } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiEyeOff, HiX } from 'react-icons/hi';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../../firebase';
import { CircularProgressbar } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';

export default function DashProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState({});
    const [imageUploadError, setImageUploadError] = useState(null);
    const [formData, setFormData] = useState({
        ProductName: '',
        Price: '',
        image: 'https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg',
        category: '',
        isActive: true,
        ShortDescription: '',
        Description: '',
        Ingredients: '',
        Allergens: '',
        isPopular: false,
        isNewOne: false,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isLactoseFree: false
    });
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [isActive, setIsActive] = useState(true);

    // Fetch products and categories
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch('/api/product/get-products'),
                fetch('/api/category/categories?isActive=true')
            ]);

            const productsData = await productsRes.json();
            const categoriesData = await categoriesRes.json();

            if (productsRes.ok && categoriesRes.ok) {
                setProducts(productsData.products || []);
                setCategories(categoriesData);
            } else {
                setError('Veriler yüklenemedi');
            }
        } catch (err) {
            setError('Veriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Image upload functionality
    const handleUploadImage = async () => {
        try {
            if (files.length === 0) {
                setImageUploadError('Lütfen en az bir resim seçin');
                return;
            }
            setImageUploadError(null);
            const storage = getStorage(app);
            const uploadPromises = files.map(async (file) => {
                const fileName = new Date().getTime() + '-' + file.name;
                const storageRef = ref(storage, fileName);
                const uploadTask = uploadBytesResumable(storageRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setImageUploadProgress(prev => ({
                                ...prev,
                                [fileName]: progress.toFixed(0)
                            }));
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            });

            const downloadURLs = await Promise.all(uploadPromises);
            setFormData(prev => ({
                ...prev,
                image: downloadURLs[0] // Use first image as main image
            }));
            setFiles([]);
            setImageUploadProgress({});
        } catch (error) {
            setImageUploadError('Resim yükleme başarısız');
            setImageUploadProgress({});
            console.log(error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    // Create product
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch('/api/product/create-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowCreateModal(false);
                resetForm();
                fetchData();
            } else {
                setFormError(data.message || 'Ürün oluşturulamadı');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Update product
    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const res = await fetch(`/api/product/update-product/${selectedProduct._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setSelectedProduct(null);
                resetForm();
                fetchData();
            } else {
                setFormError(data.message || 'Ürün güncellenemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete product
    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/product/delete-product/${selectedProduct._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setShowDeleteModal(false);
                setSelectedProduct(null);
                fetchData();
            } else {
                const data = await res.json();
                setFormError(data.message || 'Ürün silinemedi');
            }
        } catch (err) {
            setFormError('Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            ProductName: '',
            Price: '',
            image: '',
            category: '',
            isActive: true,
            ShortDescription: '',
            Description: '',
            Ingredients: '',
            Allergens: '',
            isPopular: false,
            isNewOne: false,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isLactoseFree: false
        });
        setFiles([]);
        setImageUploadProgress({});
        setImageUploadError(null);
    };

    // Edit product modal
    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            ProductName: product.ProductName,
            Price: product.Price,
            image: product.image,
            category: product.category._id || product.category,
            isActive: product.isActive,
            ShortDescription: product.ShortDescription,
            Description: product.Description,
            Ingredients: product.Ingredients,
            Allergens: product.Allergens,
            isPopular: product.isPopular,
            isNewOne: product.isNewOne,
            isVegetarian: product.isVegetarian,
            isVegan: product.isVegan,
            isGlutenFree: product.isGlutenFree,
            isLactoseFree: product.isLactoseFree
        });
        setShowEditModal(true);
    };

    // Delete product modal
    const openDeleteModal = (product) => {
        setSelectedProduct(product);
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
                <h1 className='text-3xl font-semibold text-gray-900 dark:text-white'>Ürünler</h1>
                <Button
                    gradientDuoTone="purpleToBlue"
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-2'
                >
                    <HiPlus className='w-5 h-5' />
                    Yeni Ürün
                </Button>
            </div>

            {error && (
                <Alert color="failure" className='mb-4'>
                    {error}
                </Alert>
            )}

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {products.map((product) => (
                    <Card key={product._id} className='hover:shadow-lg transition-shadow'>
                        <div className='relative'>
                            <img
                                src={product.image}
                                alt={product.ProductName}
                                className='w-full h-48 object-cover rounded-lg mb-4'
                            />
                            <div className='absolute top-2 right-2 flex gap-1'>
                                {product.isPopular && (
                                    <span className='bg-yellow-500 text-white px-2 py-1 rounded-full text-xs'>Popüler</span>
                                )}
                                {product.isNewOne && (
                                    <span className='bg-green-500 text-white px-2 py-1 rounded-full text-xs'>Yeni</span>
                                )}
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {product.ProductName}
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 text-sm'>
                                {product.ShortDescription}
                            </p>
                            <div className='flex items-center justify-between'>
                                <span className='text-xl font-bold text-green-600'>
                                    ₺{product.Price}
                                </span>
                                <div className='flex items-center gap-1'>
                                    {product.isActive ? (
                                        <HiEye className='w-4 h-4 text-green-500' />
                                    ) : (
                                        <HiEyeOff className='w-4 h-4 text-red-500' />
                                    )}
                                </div>
                            </div>

                            {product.category && (
                                <p className='text-sm text-gray-500'>
                                    Kategori: {product.category.name}
                                </p>
                            )}

                            <div className='flex flex-wrap gap-1 mt-2'>
                                {product.isVegetarian && <span className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs'>Vejetaryen</span>}
                                {product.isVegan && <span className='bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs'>Vegan</span>}
                                {product.isGlutenFree && <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'>Glutensiz</span>}
                                {product.isLactoseFree && <span className='bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs'>Laktozsuz</span>}
                            </div>
                        </div>

                        <div className='flex gap-2 mt-4'>
                            <Button
                                size="sm"
                                color="gray"
                                onClick={() => openEditModal(product)}
                                className='flex-1'
                            >
                                <HiPencil className='w-4 h-4 mr-1' />
                                Düzenle
                            </Button>
                            <Button
                                size="sm"
                                color="failure"
                                onClick={() => openDeleteModal(product)}
                            >
                                <HiTrash className='w-4 h-4' />
                            </Button>
                        </div>
                    </Card>
                ))}

                {products.length === 0 && (
                    <Card className='text-center py-12 col-span-full'>
                        <p className='text-gray-500 dark:text-gray-400'>Henüz ürün bulunmuyor.</p>
                        <Button
                            gradientDuoTone="purpleToBlue"
                            className='mt-4'
                            onClick={() => setShowCreateModal(true)}
                        >
                            İlk Ürünü Oluştur
                        </Button>
                    </Card>
                )}
            </div>

            {/* Create Product Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="4xl">
                <Modal.Header>Yeni Ürün Oluştur</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleCreate} className='space-y-6'>
                        <div className='flex flex-col md:flex-row justify-start gap-4'>
                            <div className='flex items-center gap-2'>
                                <ToggleSwitch checked={formData.isActive} id="isActive" onChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                                <Label htmlFor="isActive">{formData.isActive ? 'Aktif' : <span className='text-red-500'>Deaktif</span>}</Label>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Checkbox id="isPopular" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} />
                                <Label htmlFor="isPopular">Popüler</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isNewOne" checked={formData.isNewOne} onChange={(e) => setFormData({ ...formData, isNewOne: e.target.checked })} />
                                <Label htmlFor="isNewOne">Yeni</Label>
                            </div>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="productName">Ürün Adı</Label>
                                <TextInput
                                    id="productName"
                                    value={formData.ProductName}
                                    onChange={(e) => setFormData({ ...formData, ProductName: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="price">Fiyat</Label>
                                <TextInput
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.Price}
                                    onChange={(e) => setFormData({ ...formData, Price: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Kategori</Label>
                                <Select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Kategori Seçin</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="shortDescription">Kısa Açıklama</Label>
                                <TextInput
                                    id="shortDescription"
                                    value={formData.ShortDescription}
                                    onChange={(e) => setFormData({ ...formData, ShortDescription: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Detaylı Açıklama</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                value={formData.Description}
                                onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                            />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="ingredients">İçindekiler</Label>
                                <Textarea
                                    id="ingredients"
                                    rows={3}
                                    value={formData.Ingredients}
                                    onChange={(e) => setFormData({ ...formData, Ingredients: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="allergens">Alerjenler</Label>
                                <Textarea
                                    id="allergens"
                                    rows={3}
                                    value={formData.Allergens}
                                    onChange={(e) => setFormData({ ...formData, Allergens: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className='space-y-4'>
                            <Label>Ürün Resmi</Label>
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={handleFileChange}
                                    className='block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400'
                                />
                                <Button
                                    outline
                                    className='w-full sm:w-52'
                                    type='button'
                                    gradientDuoTone='purpleToBlue'
                                    size='sm'
                                    onClick={handleUploadImage}
                                    disabled={Object.keys(imageUploadProgress).length > 0}
                                >
                                    {Object.keys(imageUploadProgress).length > 0 ? (
                                        <div className='flex gap-2'>
                                            {Object.entries(imageUploadProgress).map(([fileName, progress]) => (
                                                <div key={fileName} className='w-8 h-8'>
                                                    <CircularProgressbar value={progress} text={`${progress}%`} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'Resim Yükle'
                                    )}
                                </Button>
                            </div>

                            {imageUploadError && (
                                <Alert color='failure'>
                                    {imageUploadError}
                                </Alert>
                            )}

                            {formData.image && (
                                <div className='relative inline-block'>
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        className='w-32 h-32 object-cover rounded-lg'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                                    >
                                        <HiX className='w-4 h-4' />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Checkboxes */}
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isVegetarian" checked={formData.isVegetarian} onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })} />
                                <Label htmlFor="isVegetarian">Vejetaryen</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isVegan" checked={formData.isVegan} onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })} />
                                <Label htmlFor="isVegan">Vegan</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isGlutenFree" checked={formData.isGlutenFree} onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })} />
                                <Label htmlFor="isGlutenFree">Glutensiz</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isLactoseFree" checked={formData.isLactoseFree} onChange={(e) => setFormData({ ...formData, isLactoseFree: e.target.checked })} />
                                <Label htmlFor="isLactoseFree">Laktozsuz</Label>
                            </div>
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

            {/* Edit Product Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="4xl">
                <Modal.Header>Ürün Düzenle</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleUpdate} className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="edit-productName">Ürün Adı</Label>
                                <TextInput
                                    id="edit-productName"
                                    value={formData.ProductName}
                                    onChange={(e) => setFormData({ ...formData, ProductName: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-price">Fiyat</Label>
                                <TextInput
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    value={formData.Price}
                                    onChange={(e) => setFormData({ ...formData, Price: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-category">Kategori</Label>
                                <Select
                                    id="edit-category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Kategori Seçin</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit-shortDescription">Kısa Açıklama</Label>
                                <TextInput
                                    id="edit-shortDescription"
                                    value={formData.ShortDescription}
                                    onChange={(e) => setFormData({ ...formData, ShortDescription: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-description">Detaylı Açıklama</Label>
                            <Textarea
                                id="edit-description"
                                rows={4}
                                value={formData.Description}
                                onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                            />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="edit-ingredients">İçindekiler</Label>
                                <Textarea
                                    id="edit-ingredients"
                                    rows={3}
                                    value={formData.Ingredients}
                                    onChange={(e) => setFormData({ ...formData, Ingredients: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-allergens">Alerjenler</Label>
                                <Textarea
                                    id="edit-allergens"
                                    rows={3}
                                    value={formData.Allergens}
                                    onChange={(e) => setFormData({ ...formData, Allergens: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Image Upload for Edit */}
                        <div className='space-y-4'>
                            <Label>Ürün Resmi</Label>
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={handleFileChange}
                                    className='block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400'
                                />
                                <Button
                                    outline
                                    className='w-full sm:w-52'
                                    type='button'
                                    gradientDuoTone='purpleToBlue'
                                    size='sm'
                                    onClick={handleUploadImage}
                                    disabled={Object.keys(imageUploadProgress).length > 0}
                                >
                                    {Object.keys(imageUploadProgress).length > 0 ? (
                                        <div className='flex gap-2'>
                                            {Object.entries(imageUploadProgress).map(([fileName, progress]) => (
                                                <div key={fileName} className='w-8 h-8'>
                                                    <CircularProgressbar value={progress} text={`${progress}%`} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'Resim Yükle'
                                    )}
                                </Button>
                            </div>

                            {imageUploadError && (
                                <Alert color='failure'>
                                    {imageUploadError}
                                </Alert>
                            )}

                            {formData.image && (
                                <div className='relative inline-block'>
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        className='w-32 h-32 object-cover rounded-lg'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                                    >
                                        <HiX className='w-4 h-4' />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Checkboxes for Edit */}
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isActive">Aktif</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isPopular"
                                    checked={formData.isPopular}
                                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isPopular">Popüler</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isNewOne"
                                    checked={formData.isNewOne}
                                    onChange={(e) => setFormData({ ...formData, isNewOne: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isNewOne">Yeni</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isVegetarian"
                                    checked={formData.isVegetarian}
                                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isVegetarian">Vejetaryen</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isVegan"
                                    checked={formData.isVegan}
                                    onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isVegan">Vegan</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isGlutenFree"
                                    checked={formData.isGlutenFree}
                                    onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isGlutenFree">Glutensiz</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <input
                                    type="checkbox"
                                    id="edit-isLactoseFree"
                                    checked={formData.isLactoseFree}
                                    onChange={(e) => setFormData({ ...formData, isLactoseFree: e.target.checked })}
                                    className='w-4 h-4'
                                />
                                <Label htmlFor="edit-isLactoseFree">Laktozsuz</Label>
                            </div>
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
                <Modal.Header>Ürün Sil</Modal.Header>
                <Modal.Body>
                    <div className='space-y-4'>
                        <p>
                            <strong>{selectedProduct?.ProductName}</strong> ürününü silmek istediğinizden emin misiniz?
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            Bu işlem geri alınamaz.
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