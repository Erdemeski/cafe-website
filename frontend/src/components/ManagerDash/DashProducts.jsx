import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, TextInput, Label, Alert, Spinner, Select, Textarea, ToggleSwitch, Checkbox } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiEyeOff, HiX, HiInformationCircle, HiSearch, HiFilter } from 'react-icons/hi';
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

    // Filtreleme ve arama state'leri
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        ProductName: '',
        Price: '',
        image: 'https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg',
        category: '',
        isActive: true,
        ShortDescription: '',
        Description: '',
        ingredients: '',
        allergens: '',
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

    // Filtreleme fonksiyonu
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.ShortDescription && product.ShortDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.Description && product.Description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = !selectedCategory ||
            (product.category &&
                (typeof product.category === 'object' ? product.category._id : product.category) === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    // Reset form
    const resetForm = () => {
        setFormData({
            ProductName: '',
            Price: '',
            image: 'https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg',
            category: '',
            isActive: true,
            ShortDescription: '',
            Description: '',
            ingredients: '',
            allergens: '',
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
            ingredients: product.ingredients,
            allergens: product.allergens,
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

    // Filtreleri temizle
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
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
                    onClick={() => { setShowCreateModal(true); resetForm() }}
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

            {/* Arama ve Filtreleme Alanları */}
            <div className='mb-6 space-y-4'>
                {/* Arama ve Filtreleme Satırı */}
                <div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center'>
                    {/* Arama Çubuğu */}
                    <div className='flex items-center gap-2 w-full sm:w-1/2'>
                        <HiSearch className='h-5 w-5 text-gray-500 flex-shrink-0' />
                        <TextInput
                            type="text"
                            placeholder="Ürün adı, açıklama veya içerik ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full'
                        />
                    </div>

                    {/* Kategori Filtresi */}
                    <div className='flex items-center gap-2 w-full sm:w-1/2'>
                        <HiFilter className='w-5 h-5 text-gray-500 flex-shrink-0' />
                        <Select
                            id="categoryFilter"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className='min-w-0 flex-1'
                        >
                            <option value="">Tüm Kategoriler</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Temizle Butonu */}
                    {(searchTerm || selectedCategory) && (
                        <Button
                            color="light"
                            onClick={clearFilters}
                            className='flex items-center gap-2 flex-shrink-0 w-full sm:w-auto'
                        >
                            <HiX className='w-4 h-4' />
                            <span className='text-sm'>Temizle</span>
                        </Button>
                    )}
                </div>



                {/* Sonuç Bilgisi */}
                {filteredProducts.length !== products.length && (
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                        {filteredProducts.length} ürün bulundu (toplam {products.length} ürün)
                    </div>
                )}
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {filteredProducts.map((product) => (
                    <Card
                        key={product._id}
                        className='hover:shadow-lg transition-shadow'
                        theme={{
                            root: {
                                children: 'flex h-full flex-col justify-center gap-4 p-3 sm:p-4'
                            }
                        }}
                    >
                        <div className='relative'>
                            <img
                                src={product.image}
                                alt={product.ProductName}
                                className='w-full h-60 object-cover rounded-lg'
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

                        <div className='space-y-1'>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {product.ProductName}
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 text-sm'>
                                {product.ShortDescription ? product.ShortDescription : <span>Lezzetli bir ürün <span className='text-gray-500 dark:text-gray-400'>(Kısa açıklama girilmedi)</span></span>}
                            </p>
                            <div className='flex items-center justify-between'>
                                <span className='text-xl font-bold text-green-600 dark:text-green-400'>
                                    ₺{product.Price}
                                </span>
                                <div className='flex items-center gap-1 mr-2'>
                                    {product.isActive ? (
                                        <HiEye className='w-4 h-4 text-green-500' />
                                    ) : (
                                        <HiEyeOff className='w-4 h-4 text-red-500' />
                                    )}
                                </div>
                            </div>

                            {product.category && (
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    {product.category.name}
                                </p>
                            )}

                            <div className='flex flex-wrap gap-1 mt-2'>
                                {product.isVegetarian && <span className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs'>Vejetaryen</span>}
                                {product.isVegan && <span className='bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs'>Vegan</span>}
                                {product.isGlutenFree && <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'>Glutensiz</span>}
                                {product.isLactoseFree && <span className='bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs'>Laktozsuz</span>}
                            </div>
                        </div>

                        <div className='flex gap-2'>
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

                {filteredProducts.length === 0 && (
                    <Card className='text-center py-12 col-span-full'>
                        {products.length === 0 ? (
                            <>
                                <p className='text-gray-500 dark:text-gray-400'>Henüz ürün bulunmuyor.</p>
                                <Button
                                    gradientDuoTone="purpleToBlue"
                                    className='mt-4'
                                    onClick={() => { setShowCreateModal(true); resetForm() }}
                                >
                                    İlk Ürünü Oluştur
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className='text-gray-500 dark:text-gray-400'>Arama kriterlerinize uygun ürün bulunamadı.</p>
                                <Button
                                    color="gray"
                                    className='mt-4'
                                    onClick={clearFilters}
                                >
                                    Filtreleri Temizle
                                </Button>
                            </>
                        )}
                    </Card>
                )}
            </div>

            {/* Create Product Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} size="4xl" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Yeni Ürün Oluştur</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleCreate} className='space-y-3'>
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
                                className='min-h-[50px] max-h-[200px] overflow-y-auto'
                            />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="ingredients">İçindekiler</Label>
                                <Textarea
                                    id="ingredients"
                                    rows={3}
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    className='min-h-[50px] max-h-[200px] overflow-y-auto'
                                />
                            </div>

                            <div>
                                <Label htmlFor="allergens">Alerjenler</Label>
                                <Textarea
                                    id="allergens"
                                    rows={3}
                                    value={formData.allergens}
                                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                    className='min-h-[50px] max-h-[200px] overflow-y-auto'
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className='py-4'>
                            <Label>Ürün Özellikleri</Label>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-1'>
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
                        </div>

                        {/* Image Upload */}
                        <div className='space-y-4'>
                            <Label className='text-xl font-semibold'>Ürün Resmi</Label>
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
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
                                        className='w-full h-full object-cover rounded-lg border border-gray-200'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                                    >
                                        <HiX className='w-4 h-4' />
                                    </button>
                                    <div className='flex flex-col sm:flex-row items-center gap-0.5 bg-yellow-50 px-2 py-1 mt-5 mb-2 rounded border border-yellow-200'>
                                        <HiInformationCircle className='w-6 h-6 flex-1 text-gray-500 min-w-6 min-h-6 mr-2' />
                                        <p className='text-xs text-gray-500 w-full sm:w-auto text-center sm:text-left'>
                                            Yüklenen resimlerin boyutu 400x400 pikselden büyük olmaması tavsiye edilir. (QR Menü ana sayfasında görüntülenecek resim boyutu max 356x240 piksel, QR Menü ürün detay sayfasında görüntülenecek resim boyutu max 400x400 pikseldir. Girilen resimlerin boyut oranı bu sınırları aşarsa resim kırpılacaktır.)
                                        </p>
                                    </div>
                                </div>
                            )}
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
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="4xl" className='pt-16 mb-2'>
                <Modal.Header className='p-3'>Ürün Düzenle</Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleUpdate} className='space-y-3'>
                        <div className='flex flex-col md:flex-row justify-start gap-4'>
                            <div className='flex items-center gap-2'>
                                <ToggleSwitch checked={formData.isActive} id="edit-isActive" onChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                                <Label htmlFor="edit-isActive">{formData.isActive ? 'Aktif' : <span className='text-red-500'>Deaktif</span>}</Label>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Checkbox id="edit-isPopular" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} />
                                <Label htmlFor="edit-isPopular">Popüler</Label>
                            </div>

                            <div className='flex items-center gap-2'>
                                <Checkbox id="isNewOne" checked={formData.isNewOne} onChange={(e) => setFormData({ ...formData, isNewOne: e.target.checked })} />
                                <Label htmlFor="isNewOne">Yeni</Label>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div>
                                <Label htmlFor="edit-ingredients">İçindekiler</Label>
                                <Textarea
                                    id="edit-ingredients"
                                    rows={3}
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-allergens">Alerjenler</Label>
                                <Textarea
                                    id="edit-allergens"
                                    rows={3}
                                    value={formData.allergens}
                                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Checkboxes for Edit */}
                        <div className='py-4'>
                            <Label>Ürün Özellikleri</Label>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-1'>
                                <div className='flex items-center gap-2'>
                                    <Checkbox id="edit-isVegetarian" checked={formData.isVegetarian} onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })} />
                                    <Label htmlFor="edit-isVegetarian">Vejetaryen</Label>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <Checkbox id="edit-isVegan" checked={formData.isVegan} onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })} />
                                    <Label htmlFor="edit-isVegan">Vegan</Label>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <Checkbox id="edit-isGlutenFree" checked={formData.isGlutenFree} onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })} />
                                    <Label htmlFor="edit-isGlutenFree">Glutensiz</Label>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <Checkbox id="edit-isLactoseFree" checked={formData.isLactoseFree} onChange={(e) => setFormData({ ...formData, isLactoseFree: e.target.checked })} />
                                    <Label htmlFor="edit-isLactoseFree">Laktozsuz</Label>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload for Edit */}
                        <div className='space-y-4'>
                            <Label className='text-xl font-semibold'>Ürün Resmi</Label>
                            <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
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
                                        className='w-full h-full object-cover rounded-lg border border-gray-200'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                                    >
                                        <HiX className='w-4 h-4' />
                                    </button>
                                    <div className='flex flex-col sm:flex-row items-center gap-0.5 bg-yellow-50 px-2 py-1 mt-5 mb-2 rounded border border-yellow-200'>
                                        <HiInformationCircle className='w-6 h-6 flex-1 text-gray-500 min-w-6 min-h-6 mr-2' />
                                        <p className='text-xs text-gray-500 w-full sm:w-auto text-center sm:text-left'>
                                            Yüklenen resimlerin boyutu 400x400 pikselden büyük olmaması tavsiye edilir. (QR Menü ana sayfasında görüntülenecek resim boyutu max 356x240 piksel, QR Menü ürün detay sayfasında görüntülenecek resim boyutu max 400x400 pikseldir. Girilen resimlerin boyut oranı bu sınırları aşarsa resim kırpılacaktır.)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {formError && (
                            <Alert color="failure">
                                {formError}
                            </Alert>
                        )}

                        <div className='flex gap-2 justify-end mt-2'>
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
                <Modal.Header className='p-3'>Ürün Sil</Modal.Header>
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