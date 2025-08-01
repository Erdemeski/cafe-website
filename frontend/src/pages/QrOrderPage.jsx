import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Cookie işlemleri için
import { useDispatch, useSelector } from "react-redux";
import { setTableCookie, validateCookie, refreshCookie, selectTableCookie, selectIsCookieActive, selectTableNumber } from "../redux/table/tableCookieSlice";
import { Badge, Button, Card, Spinner, TextInput, Textarea } from "flowbite-react";
import QrMenuHeader from "../components/QrMenuHeader";
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCartShopping, FaCartPlus, FaUserTie } from "react-icons/fa6";
import { FaTimes, FaHistory } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";

const QrOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();
    const [securityCode, setSecurityCode] = useState("");
    const [error, setError] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const dispatch = useDispatch();
    const tableCookie = useSelector(selectTableCookie);
    const isCookieActive = useSelector(selectIsCookieActive);
    const cookieTableNumber = useSelector(selectTableNumber);

    const [headerHeight, setHeaderHeight] = useState(0);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [closeProductModals, setCloseProductModals] = useState(false);
    const headerRef = useRef();

    // Arama işlevselliği için state'ler
    const [searchTerm, setSearchTerm] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [showSessionExpired, setShowSessionExpired] = useState(false);
    const [lastActivityTime, setLastActivityTime] = useState(0);

    // Yeni modal state'leri
    const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [waiterNotes, setWaiterNotes] = useState("");

    // Ürün detay modal state'leri
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Cookie süresini gerçek zamanlı güncelle
    useEffect(() => {
        if (isVerified && isCookieActive && tableCookie.expiresAt) {
            const updateTime = () => {
                const remaining = Math.max(0, Math.floor((tableCookie.expiresAt - Date.now()) / 1000));
                setTimeLeft(remaining);
            };

            updateTime();
            const interval = setInterval(updateTime, 1000);

            return () => clearInterval(interval);
        }
    }, [isVerified, isCookieActive, tableCookie.expiresAt]);

    // Modal açıkken scroll'u engelle ama scrollbar'ı göster
    useEffect(() => {
        const isAnyModalOpen = isCartOpen || isProductModalOpen || isWaiterModalOpen ||
            isHistoryModalOpen || isOrderDetailsModalOpen;

        if (isAnyModalOpen) {
            // Modal açıkken scrollbar'ı görünür tut ama scroll'u engelle
            document.body.style.overflowY = 'scroll';
            // Scroll pozisyonunu kaydet
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            // Scroll event'ini engelle
            const preventScroll = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };

            // Scroll event'lerini engelle
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End') {
                    e.preventDefault();
                }
            });

            // Cleanup function'ı güncelle
            return () => {
                document.removeEventListener('wheel', preventScroll);
                document.removeEventListener('touchmove', preventScroll);
            };
        } else {
            // Modal kapandığında scroll'u geri aç
            const savedScrollY = parseInt(document.body.style.top || '0') * -1;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            // Kaydedilen scroll pozisyonuna geri dön
            window.scrollTo(0, savedScrollY);
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isCartOpen, isProductModalOpen, isWaiterModalOpen, isHistoryModalOpen, isOrderDetailsModalOpen]);

    // Searchbar açıldığında tüm modalları kapat
    const handleSearchbarToggle = (isOpen) => {
        if (isOpen) {
            // Tüm modalları kapat
            setIsCartOpen(false);
            setIsProductModalOpen(false);
            setIsWaiterModalOpen(false);
            setIsHistoryModalOpen(false);
            setIsOrderDetailsModalOpen(false);
            setSelectedProduct(null);
            setCloseProductModals(true);
            setTimeout(() => setCloseProductModals(false), 100);
        }
    };

    // Arama değişikliği handler'ı
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        // Eğer arama terimi varsa kategoriyi 'all' yap
        if (value.trim()) {
            setSelectedCategory('all');
        }
    };

    useEffect(() => {
        fetchOrderHistory();
    }, [tableNumber, window.location.reload]);

    useEffect(() => {
        const checkTable = async () => {
            const response = await fetch("/api/table/check-table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableNumber })
            });
            const data = await response.json();
            if (!response.ok && !data.success) {
                navigate("/");
            }
        };
        checkTable();
    }, [tableNumber]);


    // Cookie kontrolü (backend validasyonu ile)
    useEffect(() => {
        const validateCookieWithBackend = async () => {
            // Kısa bir bekleme süresi ekle
            await new Promise(resolve => setTimeout(resolve, 500));

            if (tableCookie.tableNumber === tableNumber && tableCookie.cookieNumber) {
                console.log('Frontend cookie data:', {
                    expiresAt: tableCookie.expiresAt,
                    currentTime: Date.now(),
                    timeLeft: Math.floor((tableCookie.expiresAt - Date.now()) / 1000)
                });

                // expiresAt değerinin geçerli olduğundan emin ol
                if (!tableCookie.expiresAt || tableCookie.expiresAt <= Date.now()) {
                    console.log('Invalid expiresAt, using frontend validation');
                    dispatch(validateCookie());
                    setIsLoading(false);
                    return;
                }

                try {
                    const response = await fetch("/api/table/validate-cookie", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tableNumber,
                            cookieNumber: tableCookie.cookieNumber,
                            expiresAt: tableCookie.expiresAt
                        })
                    });
                    const data = await response.json();

                    if (response.ok && data.success) {
                        setIsVerified(true);
                        setShowSessionExpired(false);
                        // Backend validasyonu başarılı, Redux'ı güncelle
                        dispatch(validateCookie());
                    } else {
                        setIsVerified(false);
                        setShowSessionExpired(true);
                        // Backend'de süresi dolmuş, Redux'ı temizle
                        if (data.isExpired) {
                            dispatch(validateCookie());
                        }
                    }
                } catch (err) {
                    // Network hatası durumunda frontend validasyonuna güven
                    dispatch(validateCookie());
                    if (
                        tableCookie.tableNumber === tableNumber &&
                        isCookieActive &&
                        tableCookie.cookieNumber
                    ) {
                        setIsVerified(true);
                        setShowSessionExpired(false);
                    } else {
                        setIsVerified(false);
                        if (tableCookie.tableNumber === tableNumber && tableCookie.cookieNumber) {
                            setShowSessionExpired(true);
                        }
                    }
                }
            } else {
                setIsVerified(false);
                setShowSessionExpired(false);
            }

            setIsLoading(false);
        };

        validateCookieWithBackend();
    }, [tableNumber, tableCookie.cookieNumber, tableCookie.expiresAt, dispatch]);

    // Periyodik cookie validasyonu (backend ile)
    useEffect(() => {
        if (isVerified && tableCookie.cookieNumber) {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch("/api/table/validate-cookie", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tableNumber,
                            cookieNumber: tableCookie.cookieNumber,
                            expiresAt: tableCookie.expiresAt
                        })
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        // Backend'de süresi dolmuş
                        setIsVerified(false);
                        setShowSessionExpired(true);
                        dispatch(validateCookie());
                    }
                } catch (err) {
                    // Network hatası durumunda frontend validasyonuna güven
                    dispatch(validateCookie());
                }
            }, 30000); // 30 saniye

            return () => clearInterval(interval);
        }
    }, [isVerified, tableCookie.cookieNumber, tableCookie.expiresAt, tableNumber, dispatch]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await fetch("/api/table/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableNumber, securityCode })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                // Backend'den gelen cookie number'ı kullan veya otomatik oluştur
                const { cookieNumber, expiresAt } = data;
                dispatch(setTableCookie({ tableNumber, expiresAt, cookieNumber }));
                setIsVerified(true);
                setSecurityCode("");
            } else {
                setError(data.message || "Güvenlik kodu yanlış!");
                setSecurityCode("");
            }
        } catch (err) {
            setError("Bir hata oluştu.");
        }
    };

    // Menü ve sipariş ekranı için örnek ürünler
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [cart, setCart] = useState([]);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Kategoriler için state
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        setCategoriesError(null);
        try {
            const res = await fetch("/api/category/categories?isActive=true");
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            } else {
                setCategoriesError("Kategoriler yüklenemedi");
            }
        } catch (err) {
            console.error("Kategoriler yüklenirken hata:", err);
            setCategoriesError("Kategoriler yüklenirken hata oluştu");
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                /*                 const res = await fetch("/api/product/get-products");
                 */
                const res = await fetch("/api/product/public");
                const data = await res.json();
                if (res.ok && data.success) {
                    setProducts(data.products);
                }
            } catch (err) {
                // Hata yönetimi
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchCategories();
        fetchProducts();
        console.log(products);
    }, []);

    // Dinamik kategori listesi oluştur
    const categoryList = [
        { key: 'all', label: 'Tümü', icon: <span className="mr-2">💫</span> },
        { key: 'popular', label: 'En Çok Tercih Edilenler', icon: <span className="mr-2">⭐</span> },
        ...categories.map(category => ({
            key: category._id,
            label: category.name,
            icon: <span className="mr-2">{category.image}</span>
        }))
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const addToCart = (product) => {
        setCart((prev) => {
            const found = prev.find((item) => item._id === product._id);
            if (found) {
                return prev.map((item) =>
                    item._id === product._id ? { ...item, qty: item.qty + 1 } : item
                );
            } else {
                return [...prev, { _id: product._id, ProductName: product.ProductName, Price: product.Price, qty: 1 }];
            }
        });
    };

    // Ürün detay modalını aç
    const openProductModal = (product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
        setCloseProductModals(true);
        setTimeout(() => setCloseProductModals(false), 100);
    };

    // Ürün detay modalını kapat
    const closeProductModal = () => {
        setIsProductModalOpen(false);
        setSelectedProduct(null);
    };

    const closeCartModal = () => {
        setIsCartOpen(false);
        setIsProductModalOpen(false);
        setSelectedProduct(null);
    };

    const closeWaiterModal = () => {
        setIsWaiterModalOpen(false);
        setWaiterNotes("");
    };

    const closeHistoryModal = () => {
        setIsHistoryModalOpen(false);
    };

    const closeOrderDetailsModal = () => {
        setIsOrderDetailsModalOpen(false);
        setCustomerName("");
        setOrderNotes("");
    };

    // Cart açıldığında searchbar'ı kapat
    const openCartModal = () => {
        setIsCartOpen(true);
        // Header'daki searchbar'ı kapat
        if (headerRef.current && headerRef.current.closeSearchbar) {
            headerRef.current.closeSearchbar();
        }
    };

    // Waiter modal açıldığında searchbar'ı kapat
    const openWaiterModal = () => {
        setIsWaiterModalOpen(true);
        // Header'daki searchbar'ı kapat
        if (headerRef.current && headerRef.current.closeSearchbar) {
            headerRef.current.closeSearchbar();
        }
    };

    // History modal açıldığında searchbar'ı kapat
    const openHistoryModal = () => {
        setIsHistoryModalOpen(true);
        fetchOrderHistory();
        // Header'daki searchbar'ı kapat
        if (headerRef.current && headerRef.current.closeSearchbar) {
            headerRef.current.closeSearchbar();
        }
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((item) => item._id !== id));
    };

    // Sipariş geçmişini getir
    const fetchOrderHistory = async () => {
        if (!tableCookie.cookieNumber) return;

        setLoadingHistory(true);
        try {
            const response = await fetch(`/api/order/table/${tableNumber}?cookieNumber=${tableCookie.cookieNumber}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setOrderHistory(data.orders || []);
            } else {
                console.error("Sipariş geçmişi alınamadı:", data.message);
            }
        } catch (err) {
            console.error("Sipariş geçmişi alınırken hata:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Garson çağır
    const callWaiter = async () => {
        try {
            const response = await fetch("/api/table/call-waiter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableNumber,
                    cookieNumber: tableCookie.cookieNumber,
                    expiresAt: tableCookie.expiresAt,
                    notes: waiterNotes.trim()
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                alert("Garson çağrınız alındı. Kısa süre içinde gelecektir.");
                setIsWaiterModalOpen(false);
                setWaiterNotes("");
            } else {
                alert(data.message || "Garson çağrısı gönderilemedi.");
            }
        } catch (err) {
            alert("Bir hata oluştu.");
        }
    };

    const handleOrder = async () => {
        // Sipariş detayları modalını aç
        setIsOrderDetailsModalOpen(true);
        // Header'daki searchbar'ı kapat
        if (headerRef.current && headerRef.current.closeSearchbar) {
            headerRef.current.closeSearchbar();
        }
    };

    const submitOrder = async () => {
        // Kullanıcı adı kontrolü
        if (!customerName.trim()) {
            alert("Lütfen adınızı girin.");
            return;
        }

        // 1 saniye sonra siparişi gönder
        setTimeout(async () => {
            try {
                const response = await fetch("/api/order/give-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cookieNumber: tableCookie.cookieNumber,
                        tableNumber,
                        expiresAt: tableCookie.expiresAt,
                        items: cart.map(({ _id, ProductName, Price, qty }) => ({ id: _id, ProductName, Price, qty })),
                        totalPrice: cart.reduce((sum, item) => sum + item.Price * item.qty, 0),
                        customerName: customerName.trim(),
                        notes: orderNotes.trim()
                    })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setOrderSuccess(true);
                    setCart([]);
                    setIsCartOpen(false);
                    setIsOrderDetailsModalOpen(false);
                    setCloseProductModals(true);
                    setCustomerName("");
                    setOrderNotes("");

                    // Sipariş başarılı olduğunda cookie'yi yenile
                    dispatch(refreshCookie());
                    // Redux state'inin güncellenmesi için kısa bir gecikme
                    setTimeout(() => {
                        console.log('Cookie refreshed after order, new expiresAt:', tableCookie.expiresAt);
                    }, 100);

                    setTimeout(() => {
                        setOrderSuccess(false);
                        setCloseProductModals(false);
                    }, 3000);

                    fetchOrderHistory();
                } else {
                    alert(data.message || "Sipariş gönderilemedi.");
                }
            } catch (err) {
                alert("Bir hata oluştu.");
            }
        }, 1000);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Kullanıcı aktivitesi ile cookie yenileme (debounced)
    const handleUserActivity = () => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime;

        // Sadece 5 saniyede bir cookie yenile (performans için)
        if (isVerified && isCookieActive && timeSinceLastActivity > 5000) {
            dispatch(refreshCookie());
            setLastActivityTime(now);
        }
    };

    // Kullanıcı aktivitesini dinle (cookie yenileme - optimize edilmiş)
    useEffect(() => {
        if (isVerified && isCookieActive) {
            // Sadece önemli aktivitelerde cookie yenile
            const events = ['click', 'keypress', 'touchstart'];

            const activityHandler = () => {
                handleUserActivity();
            };

            events.forEach(event => {
                document.addEventListener(event, activityHandler, true);
            });

            return () => {
                events.forEach(event => {
                    document.removeEventListener(event, activityHandler, true);
                });
            };
        }
    }, [isVerified, isCookieActive, lastActivityTime, dispatch]);

    // Cookie süresi dolduğunda anında yönlendirme (backend ile)
    useEffect(() => {
        if (tableCookie.cookieNumber && isVerified) {
            const checkExpiry = async () => {
                try {
                    const response = await fetch("/api/table/validate-cookie", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tableNumber,
                            cookieNumber: tableCookie.cookieNumber,
                            expiresAt: tableCookie.expiresAt
                        })
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        // Backend'de süresi dolmuş
                        setIsVerified(false);
                        setShowSessionExpired(true);
                        dispatch(validateCookie());
                        scrollToTop();
                    }
                } catch (err) {
                    // Network hatası durumunda frontend validasyonuna güven
                    if (tableCookie.expiresAt && Date.now() >= tableCookie.expiresAt) {
                        dispatch(validateCookie());
                        setIsVerified(false);
                        setShowSessionExpired(true);
                        scrollToTop();
                    }
                }
            };

            checkExpiry();
        }
    }, [tableCookie.cookieNumber, tableCookie.expiresAt, isVerified, tableNumber, dispatch]);

    // Ürünleri kategoriye ve arama terimine göre filtrele
    const filteredProducts = products.filter(product => {
        // Önce kategori filtresini uygula
        let categoryMatch = true;
        if (selectedCategory !== 'all') {
            if (selectedCategory === 'popular') {
                categoryMatch = product.isPopular === true;
            } else {
                // Kategori ID'si ile karşılaştır
                categoryMatch = product.category?._id === selectedCategory;
            }
        }

        // Sonra arama filtresini uygula
        let searchMatch = true;
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            searchMatch =
                product.ProductName?.toLowerCase().includes(searchLower) ||
                product.Description?.toLowerCase().includes(searchLower) ||
                product.ShortDescription?.toLowerCase().includes(searchLower) ||
                product.category?.name?.toLowerCase().includes(searchLower);
        }

        return categoryMatch && searchMatch;
    });

    // Loading ekranı
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[rgb(22,26,29)] relative isolate px-4 py-16 sm:py-24 lg:px-8">
                {/* Dekoratif arka plan - farklılaştırılmış poligon ve gradient */}
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
                >
                    <div
                        style={{
                            clipPath:
                                'polygon(40% 60%, 10% 600%, 95% 40%, 80% 60%, 100% 10%, 20% 110%, 40% 220%, 0% 80%, 50% 50%, 0% 0%)',
                        }}
                        className="relative left-[calc(50%-8rem)] aspect-[1155/678] w-[44rem] -translate-x-1/2 rotate-[-18deg] bg-gradient-to-bl from-[#99d40e] via-[#f728a7] to-[#1e90ff] opacity-40 sm:left-[calc(50%-16rem)] sm:w-[70rem] animate-pulse"
                    />
                </div>
                <div className="mx-auto max-w-5xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">QR Menü & Sipariş</h2>
                    <div className="flex justify-center my-5">
                        <span className="inline-block w-24 h-1 rounded bg-white dark:bg-gray-300"></span>
                    </div>
                    <Card className="w-full max-w-md mx-auto p-6 pt-4 shadow-lg rounded-lg bg-white dark:bg-[rgb(22,26,29)] flex flex-col items-center border-[1px] dark:border-gray-600">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner size="xl" color="purple" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Oturum kontrol ediliyor...</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Lütfen bekleyin</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[rgb(22,26,29)] relative isolate px-4 py-16 sm:py-24 lg:px-8">
                {/* Session Expired Uyarısı */}

                {(showSessionExpired || (!isCookieActive && cookieTableNumber === tableNumber)) && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg">
                            <div className="flex flex-row items-center gap-2">
                                <svg className="sm:w-5 h-5 w-1/6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Oturum süresi doldu. Lütfen tekrar giriş yapın.</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* Dekoratif arka plan - farklılaştırılmış poligon ve gradient */}
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
                >
                    <div
                        style={{
                            clipPath:
                                'polygon(40% 60%, 10% 600%, 95% 40%, 80% 60%, 100% 10%, 20% 110%, 40% 220%, 0% 80%, 50% 50%, 0% 0%)',
                        }}
                        className="relative left-[calc(50%-8rem)] aspect-[1155/678] w-[44rem] -translate-x-1/2 rotate-[-18deg] bg-gradient-to-bl from-[#99d40e] via-[#f728a7] to-[#1e90ff] opacity-40 sm:left-[calc(50%-16rem)] sm:w-[70rem] animate-pulse"
                    />
                </div>
                <div className="mx-auto max-w-5xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">QR Menü & Sipariş</h2>
                    <div className="flex justify-center my-5">
                        <span className="inline-block w-24 h-1 rounded bg-white dark:bg-gray-300"></span>
                    </div>
                    <Card className="w-full max-w-md mx-auto p-6 pt-4 shadow-lg rounded-lg bg-white dark:bg-[rgb(22,26,29)] flex flex-col items-center border-[1px] dark:border-gray-600">
                        <h2 className="text-2xl font-semibold text-center"> <span className="font-bold">Masa {tableNumber} </span> için Doğrulama Kodu</h2>
                        <form onSubmit={handleSubmit} className="flex flex-row gap-2 w-full">
                            <TextInput
                                type="password"
                                placeholder="******"
                                id="securityCode"
                                value={securityCode}
                                onChange={(e) => setSecurityCode(e.target.value)}
                                required
                                className="w-full"
                            />
                            <Button type="submit" gradientDuoTone="purpleToBlue" outline className="w-1/4">
                                Doğrula
                            </Button>
                        </form>
                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <>
            <QrMenuHeader
                ref={headerRef}
                onHeightChange={setHeaderHeight}
                onSearchbarToggle={handleSearchbarToggle}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onCartClose={closeCartModal}
            />
            <div className="flex flex-col items-center min-h-[95vh] bg-gray-100 dark:bg-[rgb(22,26,29)] relative isolate py-4 px-1">
                {/* Dekoratif arka plan - farklılaştırılmış poligon ve gradient */}
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0"
                >
                    <div
                        style={{
                            clipPath:
                                'polygon(40% 60%, 10% 600%, 95% 40%, 80% 60%, 100% 10%, 20% 110%, 40% 220%, 0% 80%, 50% 50%, 0% 0%)',
                        }}
                        className="relative left-[calc(50%-8rem)] aspect-[1155/678] w-[44rem] -translate-x-1/2 top-10 rotate-[-18deg] bg-gradient-to-bl from-[#99d40e] via-[#f728a7] to-[#1e90ff] opacity-40 sm:left-[calc(50%-16rem)] sm:w-[70rem] animate-pulse"
                    />
                </div>

                <div className="w-full max-w-6xl mx-auto relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4 text-center text-gray-900 dark:text-gray-50">Masa {tableNumber} QR Menü & Sipariş</h2>

                    {/* Cookie Durumu */}
                    {isVerified && isCookieActive && tableCookie.expiresAt && (
                        <div className="text-center mb-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${timeLeft > 30
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : timeLeft > 10
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${timeLeft > 30
                                    ? 'bg-green-500'
                                    : timeLeft > 10
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}></div>
                                <span>Oturum Aktif</span>
                                <span className="text-xs opacity-75">
                                    ({timeLeft}s)
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Kategori Barı */}
                    <div
                        className="w-full py-2 px-1 mb-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 sticky z-10 backdrop-blur-sm bg-white/50 dark:bg-[rgb(22,26,29)]/50 transition-all duration-300 rounded-md"
                        style={{ top: headerHeight }}
                    >
                        <div className="flex gap-3 min-w-max px-1">
                            {loadingCategories ? (
                                <div className="flex items-center justify-center w-full py-2">
                                    <Spinner size="sm" className="mr-2" /> Kategoriler yükleniyor...
                                </div>
                            ) : categoriesError ? (
                                <div className="flex items-center justify-center w-full py-2 text-red-600 dark:text-red-400">
                                    <span className="text-sm mr-2">{categoriesError}</span>
                                    <button
                                        onClick={() => {
                                            setCategoriesError(null);
                                            fetchCategories();
                                        }}
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                        Tekrar Dene
                                    </button>
                                </div>
                            ) : (
                                categoryList.map((cat, index) => (
                                    <motion.button
                                        key={cat.key}
                                        initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05, ease: "easeInOut", type: "spring", stiffness: 100 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setSelectedCategory(cat.key); scrollToTop(); }}
                                        className={`flex items-center px-5 py-2 rounded-2xl border transition font-semibold whitespace-nowrap shadow-sm
                                        ${selectedCategory === cat.key
                                                ? 'bg-blue-600 text-white shadow-lg dark:border-gray-700'
                                                : 'bg-white dark:bg-[rgb(22,26,29)] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800'}
                                    `}
                                        style={{ minWidth: '120px' }}
                                    >
                                        <motion.span
                                            animate={selectedCategory === cat.key ? { rotate: [0, 10, -10, 0] } : {}}
                                            transition={{ duration: 0.5, repeat: selectedCategory === cat.key ? Infinity : 0, repeatDelay: 2 }}
                                        >
                                            {cat.icon}
                                        </motion.span>
                                        {cat.label}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Arama Sonuç Barı */}
                    {searchTerm.trim() && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: '100%', y: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-11/12 mx-auto mb-4 px-4 py-3 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AiOutlineSearch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        "<span className="font-semibold">{searchTerm}</span>" için {filteredProducts.length} sonuç bulundu
                                    </span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSearchChange('')}
                                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                >
                                    <FaTimes className="w-3 h-3" />
                                    Aramayı Bitir
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    <div className="min-h-[50vh] w-full mb-8 mt-5 columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {loadingProducts ? (
                            <div className="flex items-center justify-center h-full">
                                <Spinner size="lg" className="mr-2" /> Ürünler yükleniyor...
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <AnimatePresence mode="wait">
                                <div className="w-full" key={selectedCategory}>
                                    {filteredProducts.map((p, index) => {
                                        const cartItem = cart.find((item) => item._id === p._id);
                                        return (
                                            <motion.div
                                                key={p._id}
                                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                                                transition={{
                                                    duration: 0.05,
                                                    ease: "easeOut",
                                                    delay: index * 0.05,
                                                    type: "spring",
                                                    stiffness: 58
                                                }}
                                                className="mb-6 mx-2 sm:mx-4 break-inside-avoid"
                                            >
                                                <ProductCard
                                                    image={p.image || 'https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg'}
                                                    name={p.ProductName}
                                                    description={p.Description || 'Lezzetli bir ürün'}
                                                    shortDescription={p.ShortDescription || 'Lezzetli bir ürün'}
                                                    price={p.Price}
                                                    currency="₺"
                                                    quantity={cartItem?.qty}
                                                    onAddToCart={() => addToCart(p)}
                                                    onIncrease={cartItem ? () => addToCart(p) : undefined}
                                                    onDecrease={cartItem && cartItem.qty > 1 ? () => setCart(prev => prev.map(item => item._id === p._id ? { ...item, qty: item.qty - 1 } : item)) : cartItem ? () => removeFromCart(p._id) : undefined}
                                                    onModalClose={closeProductModals}
                                                    isPopular={p.isPopular}
                                                    isNewOne={p.isNewOne}
                                                    category={p.category}
                                                    headerRef={headerRef}
                                                    onProductClick={() => openProductModal(p)}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </AnimatePresence>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                                    transition={{ duration: 0.1, delay: 0.1, ease: "easeInOut", type: "spring", stiffness: 100 }}
                                    className="flex flex-col gap-2 items-center justify-center text-center text-gray-700 dark:text-gray-300"
                                >
                                    <p className="text-lg">
                                        <span className="text-2xl font-bold">😔</span>
                                        {searchTerm.trim()
                                            ? `"${searchTerm}" için ürün bulunamadı.`
                                            : 'Bu kategoriye ait ürün bulunamadı.'
                                        }
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Sabit Butonlar */}
                <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
                    {/* Garson Çağır Butonu */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openWaiterModal}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow-lg border-2 border-white dark:border-gray-700 transition-all duration-300"
                    >
                        <FaUserTie className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Sipariş Geçmişi Butonu */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openHistoryModal}
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 shadow-lg border-2 border-white dark:border-gray-700 transition-all duration-300"
                    >
                        <div className="relative">
                            <FaHistory className="w-5 h-5 text-white" />
                            {orderHistory.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-0.5 -right-1 bg-white text-purple-500 text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold"
                                >
                                    {orderHistory.length}
                                </motion.span>
                            )}
                        </div>
                    </motion.button>

                    {/* Sepet Butonu */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openCartModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg border-2 border-white dark:border-gray-700 transition-all duration-300"
                    >
                        <div className="relative">
                            <FaCartShopping className="w-6 h-6 text-white" />
                            {cart.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                                >
                                    {cart.reduce((sum, item) => sum + item.qty, 0)}
                                </motion.span>
                            )}
                        </div>
                    </motion.button>
                </div>

                {/* Sepet Modal */}
                <AnimatePresence>
                    {isCartOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeCartModal}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-[2px]"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed inset-4 z-50 flex items-center justify-center p-4"
                            >
                                <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Sepet</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={closeCartModal}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[45vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                        {cart.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center text-gray-500 dark:text-gray-400 py-8"
                                            >
                                                <FaCartPlus className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                                <p className="text-lg">Sepet boş</p>
                                                <p className="text-sm">Ürün ekleyerek sipariş vermeye başlayın</p>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-4">
                                                <AnimatePresence>
                                                    {cart.map((item, index) => (
                                                        <motion.div
                                                            key={item._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative"
                                                        >
                                                            <Badge color="yellow" className="absolute -top-2 -left-2 z-10">
                                                                <p className="text-sm font-semibold text-gray-950">{item.Price}₺</p>
                                                            </Badge>
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.ProductName}</h4>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Adet: <span className="font-bold text-lg">{item.qty}</span></p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={() => addToCart({ _id: item._id, ProductName: item.ProductName, Price: item.Price })}
                                                                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </motion.button>
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">{item.Price * item.qty}₺</span>
                                                                {item.qty > 1 ? (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => setCart(prev => prev.map(cartItem =>
                                                                            cartItem._id === item._id
                                                                                ? { ...cartItem, qty: cartItem.qty - 1 }
                                                                                : cartItem
                                                                        ))}
                                                                        className="bg-gray-400 text-white p-2 rounded-full hover:bg-gray-500 transition-colors"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                        </svg>
                                                                    </motion.button>
                                                                ) : (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => removeFromCart(item._id)}
                                                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    {cart.length > 0 && (
                                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">Toplam:</span>
                                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {cart.reduce((sum, item) => sum + item.Price * item.qty, 0)}₺
                                                </span>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleOrder}
                                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Sipariş Ver
                                            </motion.button>
                                            <AnimatePresence>
                                                {orderSuccess && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="text-green-600 text-center mt-2 font-medium"
                                                    >
                                                        Siparişiniz alındı!
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Sipariş Detayları Modal */}
                <AnimatePresence>
                    {isOrderDetailsModalOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeOrderDetailsModal}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-[2px]"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed inset-4 z-50 flex items-center justify-center p-4"
                            >
                                <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Sipariş Detayları</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={closeOrderDetailsModal}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                        {/* Konum Uyarısı */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
                                        >
                                            <div className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    <p className="font-medium">Konum İzni</p>
                                                    <p className="text-xs">Siparişiniz işlenirken cihazınızın konum bilgisine erişim istenecektir. Bu, siparişinizin doğrulanması için gereklidir. <span className="font-bold">Konum bilginiz hiçbir şekilde saklanmamaktadır.</span></p>
                                                </div>
                                            </div>
                                        </motion.div>
                                        {/* Kullanıcı Adı */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Adınız * <span className="text-red-500">(Zorunlu)</span>
                                            </label>
                                            <TextInput
                                                type="text"
                                                placeholder="Adınızı girin"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                required
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Sipariş Notları */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Sipariş Notları <span className="text-gray-500">(Opsiyonel)</span>
                                            </label>
                                            <Textarea
                                                placeholder="Özel istekleriniz, alerjileriniz vb."
                                                value={orderNotes}
                                                onChange={(e) => setOrderNotes(e.target.value)}
                                                rows={3}
                                                className="w-full resize-none"
                                            />
                                        </div>

                                        {/* Sipariş Özeti */}
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Sipariş Özeti</h4>
                                            <div className="space-y-2 mb-3">
                                                {cart.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            {item.ProductName} x{item.qty}
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {item.Price * item.qty}₺
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Toplam:</span>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {cart.reduce((sum, item) => sum + item.Price * item.qty, 0)}₺
                                                </span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={closeOrderDetailsModal}
                                                className="flex-1 bg-gray-300 text-gray-700 py-3 px-2 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                                            >
                                                İptal
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    submitOrder();
                                                    setTimeout(() => {
                                                        fetchOrderHistory();
                                                    }, 1000);
                                                }}
                                                className="flex-1 bg-green-600 text-white py-3 px-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Siparişi Onayla
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Garson Çağırma Modal */}
                <AnimatePresence>
                    {isWaiterModalOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeWaiterModal}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-[2px]"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed inset-4 z-50 flex items-center justify-center p-4"
                            >
                                <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Garson Çağır</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={closeWaiterModal}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                        <div className="text-center mb-5">
                                            <FaUserTie className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
                                                Garson Çağrısı
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Masa {tableNumber} için garson çağrısı göndermek istiyor musunuz?
                                            </p>
                                        </div>

                                        {/* Not Ekleme */}
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Not <span className="text-gray-500">(Opsiyonel)</span>
                                            </label>
                                            <Textarea
                                                placeholder="Garson için özel istekleriniz, sorularınız vb."
                                                value={waiterNotes}
                                                onChange={(e) => setWaiterNotes(e.target.value)}
                                                rows={3}
                                                className="w-full resize-none text-xs"
                                            />
                                        </div>

                                        {/* Konum Uyarısı */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-5 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
                                        >
                                            <div className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    <p className="font-medium">Konum İzni</p>
                                                    <p className="text-xs">Garson çağrısının işlenmesi sırasında cihazınızın konum bilgisine erişim istenecektir. Bu, garson çağrısının doğrulanması için gereklidir. <span className="font-bold">Konum bilginiz hiçbir şekilde saklanmamaktadır.</span></p>
                                                </div>
                                            </div>
                                        </motion.div>


                                        <div className="flex gap-3 text-sm">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={closeWaiterModal}
                                                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                            >
                                                İptal
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={callWaiter}
                                                className="flex-1 bg-orange-500 text-white py-1 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                                            >
                                                Garson Çağır
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Sipariş Geçmişi Modal */}
                <AnimatePresence>
                    {isHistoryModalOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeHistoryModal}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-[2px]"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed inset-4 z-50 flex items-center justify-center p-4"
                            >
                                <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Sipariş Geçmişi</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={closeHistoryModal}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                        {loadingHistory ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner size="lg" className="mr-2" /> Sipariş geçmişi yükleniyor...
                                            </div>
                                        ) : orderHistory.length > 0 ? (
                                            <div className="space-y-4">
                                                {orderHistory.map((order, index) => (
                                                    <motion.div
                                                        key={order._id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    Sipariş #{order.orderNumber}
                                                                </h4>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {new Date(order.createdAt).toLocaleString('tr-TR')}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                color={
                                                                    order.status === 'pending' ? 'yellow' :
                                                                        order.status === 'preparing' ? 'blue' :
                                                                            order.status === 'ready' ? 'green' :
                                                                                order.status === 'served' ? 'purple' : 'red'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {order.status === 'pending' ? 'Bekliyor' :
                                                                    order.status === 'preparing' ? 'Hazırlanıyor' :
                                                                        order.status === 'ready' ? 'Hazır' :
                                                                            order.status === 'served' ? 'Servis Edildi' : 'İptal Edildi'}
                                                            </Badge>
                                                        </div>

                                                        <div className="space-y-2 mb-3">
                                                            {order.items.map((item, itemIndex) => (
                                                                <div key={itemIndex} className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-700 dark:text-gray-300">
                                                                        {item.ProductName} x{item.qty}
                                                                    </span>
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                        {item.totalItemPrice}₺
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                Toplam: {order.totalPrice}₺
                                                            </span>
                                                        </div>

                                                        {order.notes && (
                                                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
                                                                <strong>Not:</strong> {order.notes}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center text-gray-500 dark:text-gray-400 py-8"
                                            >
                                                <FaHistory className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                                <p className="text-lg">Henüz sipariş geçmişi yok</p>
                                                <p className="text-sm">İlk siparişinizi verdiğinizde burada görünecek</p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Ürün Detay Modal */}
                <AnimatePresence>
                    {isProductModalOpen && selectedProduct && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeProductModal}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-[2px]"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed inset-4 z-50 flex items-center justify-center p-4 pt-16 sm:pt-4"
                            >
                                <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Ürün Detayları</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={closeProductModal}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[67vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Ürün Görseli */}
                                            <div className="relative">
                                                <motion.img
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    src={selectedProduct.image || 'https://us.123rf.com/450wm/zhemchuzhina/zhemchuzhina1509/zhemchuzhina150900006/44465417-food-and-drink-outline-seamless-pattern-hand-drawn-kitchen-background-in-black-and-white-vector.jpg'}
                                                    alt={selectedProduct.ProductName}
                                                    className="w-full h-64 lg:h-80 object-cover rounded-xl shadow-lg"
                                                />
                                            </div>

                                            {/* Ürün Bilgileri */}
                                            <div className="flex flex-col space-y-4">
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    <div className='mb-2'>
                                                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                            {selectedProduct.ProductName}
                                                        </h2>
                                                        <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                                        {selectedProduct.Description || "Lezzetli bir ürün"}
                                                    </p>
                                                </motion.div>

                                                {/* Ürün Özellikleri */}
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="space-y-1"
                                                >
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium">Fiyat:</span>
                                                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedProduct.Price} ₺</span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium">Kategori:</span>
                                                        <span className="text-gray-900 dark:text-gray-100">{selectedProduct.category?.name || 'Kategori Yok'}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium">Hazırlık Süresi:</span>
                                                        <span className="text-gray-900 dark:text-gray-100">5-10 dakika</span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="space-y-4"
                                        >
                                            {(() => {
                                                const cartItem = cart.find((item) => item._id === selectedProduct._id);
                                                return cartItem ? (
                                                    <div className="flex items-center justify-center space-x-4">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="w-12 h-12 pb-1 pl-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-2xl font-bold text-blue-600 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-gray-600 transition-all duration-200"
                                                            onClick={() => {
                                                                if (cartItem.qty > 1) {
                                                                    setCart(prev => prev.map(item =>
                                                                        item._id === selectedProduct._id
                                                                            ? { ...item, qty: item.qty - 1 }
                                                                            : item
                                                                    ));
                                                                } else {
                                                                    removeFromCart(selectedProduct._id);
                                                                }
                                                            }}
                                                        >
                                                            -
                                                        </motion.button>
                                                        <span className="text-3xl font-bold text-gray-900 dark:text-white min-w-[60px] text-center">{cartItem.qty}</span>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="w-12 h-12 pb-1 pl-0.5 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-2xl font-bold flex items-center justify-center hover:from-purple-700 hover:to-cyan-600 transition-all duration-200"
                                                            onClick={() => addToCart(selectedProduct)}
                                                        >
                                                            +
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => addToCart(selectedProduct)}
                                                        className="w-full"
                                                    >
                                                        <Button gradientDuoTone='purpleToBlue' size='lg' className='w-full text-white font-semibold text-xl'>
                                                            <FaCartPlus className='w-6 h-6 mr-2' /> Sepete Ekle
                                                        </Button>
                                                    </motion.button>
                                                );
                                            })()}
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default QrOrderPage; 