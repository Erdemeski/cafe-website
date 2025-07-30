import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Cookie işlemleri için
import { useDispatch, useSelector } from "react-redux";
import { setTableCookie, validateCookie, refreshCookie, selectTableCookie, selectIsCookieActive, selectTableNumber } from "../redux/table/tableCookieSlice";
import { Badge, Button, Card, Spinner, TextInput } from "flowbite-react";
import QrMenuHeader from "../components/QrMenuHeader";
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCartShopping, FaCartPlus } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";

const QrOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();
    const [securityCode, setSecurityCode] = useState("");
    const [error, setError] = useState("");
    const [isVerified, setIsVerified] = useState(false);

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

    // Searchbar açıldığında modal'ları kapat
    const handleSearchbarToggle = (isOpen) => {
        if (isOpen) {
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

    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await fetch("/api/product/get-products");
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
        fetchProducts();
        console.log(products);
    }, []);

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

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((item) => item._id !== id));
    };

    const handleOrder = async () => {
        try {
            const response = await fetch("/api/order/give-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cookieNumber: tableCookie.cookieNumber,
                    tableNumber,
                    expiresAt: tableCookie.expiresAt,
                    items: cart.map(({ _id, ProductName, Price, qty }) => ({ id: _id, ProductName, Price, qty })),
                    totalPrice: cart.reduce((sum, item) => sum + item.Price * item.qty, 0)
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setOrderSuccess(true);
                setCart([]);
                setIsCartOpen(false);
                setCloseProductModals(true);

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
            } else {
                alert(data.message || "Sipariş gönderilemedi.");
            }
        } catch (err) {
            alert("Bir hata oluştu.");
        }
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
                    }
                } catch (err) {
                    // Network hatası durumunda frontend validasyonuna güven
                    if (tableCookie.expiresAt && Date.now() >= tableCookie.expiresAt) {
                        dispatch(validateCookie());
                        setIsVerified(false);
                        setShowSessionExpired(true);
                    }
                }
            };

            checkExpiry();
        }
    }, [tableCookie.cookieNumber, tableCookie.expiresAt, isVerified, tableNumber, dispatch]);

    const categoryList = [
        { key: 'all', label: 'Tümü', icon: <span className="mr-2">🍽️</span> },
        { key: 'popular', label: 'En Çok Tercih Edilenler', icon: <span className="mr-2">⭐</span> },
        { key: 'starter', label: 'Başlangıçlar', icon: <span className="mr-2">🥣</span> },
        { key: 'main', label: 'Ana Yemekler', icon: <span className="mr-2">🍗</span> },
        { key: 'dessert', label: 'Tatlılar', icon: <span className="mr-2">🍰</span> },
        { key: 'drink', label: 'İçecekler', icon: <span className="mr-2">🥤</span> },
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    // Ürünleri kategoriye ve arama terimine göre filtrele
    const filteredProducts = products.filter(product => {
        // Önce kategori filtresini uygula
        let categoryMatch = true;
        if (selectedCategory !== 'all') {
            if (selectedCategory === 'popular') {
                categoryMatch = product.isPopular === true;
            } else {
                categoryMatch = (product.Category || '').toLowerCase() === selectedCategory;
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
                product.Category?.toLowerCase().includes(searchLower);
        }

        return categoryMatch && searchMatch;
    });

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
                        className="w-full py-2 px-1 mb-3 overflow-x-auto scrollbar-none  sticky z-10 backdrop-blur-sm bg-white/50 dark:bg-[rgb(22,26,29)]/50 transition-all duration-300 rounded-md"
                        style={{ top: headerHeight }}
                    >
                        <div className="flex gap-3 min-w-max px-1">
                            {categoryList.map((cat, index) => (
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
                            ))}
                        </div>
                    </div>

                    {/* Arama Sonuç Barı */}
                    {searchTerm.trim() && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 53, y: 0 }}
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
                                                className="mb-6 break-inside-avoid"
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
                                                    Category={p.Category}
                                                    headerRef={headerRef}
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

                {/* Sabit Sepet Butonu */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        setIsCartOpen(true);
                        setCloseProductModals(true);
                        setTimeout(() => setCloseProductModals(false), 100);
                    }}
                    className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg border-2 border-white dark:border-gray-700 transition-all duration-300"
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

                {/* Sepet Modal */}
                <AnimatePresence>
                    {isCartOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsCartOpen(false)}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40"
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
                                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Sepet</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsCartOpen(false)}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
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
                                        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
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
            </div>
        </>
    );
};

export default QrOrderPage; 