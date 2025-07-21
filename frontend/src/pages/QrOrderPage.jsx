import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Cookie işlemleri için
import { useDispatch, useSelector } from "react-redux";
import { setTableCookie } from "../redux/table/tableCookieSlice";
import { Button, Card, TextInput } from "flowbite-react";

const QrOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();
    const [securityCode, setSecurityCode] = useState("");
    const [error, setError] = useState("");
    const [isVerified, setIsVerified] = useState(false);

    const dispatch = useDispatch();
    const tableCookie = useSelector((state) => state.tableCookie);


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


    // Cookie kontrolü
    useEffect(() => {
        // Redux'tan masa cookie bilgisini kontrol et
        if (
            tableCookie.tableNumber === tableNumber &&
            tableCookie.expiresAt &&
            Date.now() < tableCookie.expiresAt
        ) {
            setIsVerified(true);
        } else {
            setIsVerified(false);
        }
    }, [tableNumber, tableCookie]);

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
                const expiresAt = Date.now() + 1 * 60 * 1000;
                dispatch(setTableCookie({ tableNumber, expiresAt }));
                setIsVerified(true);
            } else {
                setError(data.message || "Güvenlik kodu yanlış!");
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
                    tableNumber,
                    items: cart.map(({ _id, ProductName, Price, qty }) => ({ id: _id, ProductName, Price, qty }))
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setOrderSuccess(true);
                setCart([]);
                setTimeout(() => setOrderSuccess(false), 3000);
            } else {
                alert(data.message || "Sipariş gönderilemedi.");
            }
        } catch (err) {
            alert("Bir hata oluştu.");
        }
    };

    if (!isVerified) {
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

    // Menü ve sipariş ekranı
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[rgb(22,26,29)] p-4">
            <h2 className="text-2xl font-bold mb-4">Masa {tableNumber} QR Menü & Sipariş</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div>
                    <h3 className="text-xl font-semibold mb-2">Menü</h3>
                    {loadingProducts ? (
                        <div>Yükleniyor...</div>
                    ) : (
                        <ul className="space-y-2">
                            {products.map((p) => (
                                <li key={p._id} className="flex justify-between items-center bg-white rounded shadow px-4 py-2">
                                    <span>{p.ProductName} <span className="text-gray-500">({p.Price}₺)</span></span>
                                    <button onClick={() => addToCart(p)} className="bg-blue-500 text-white px-3 py-1 rounded">Ekle</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-2">Sepet</h3>
                    {cart.length === 0 ? (
                        <div className="text-gray-500">Sepet boş</div>
                    ) : (
                        <ul className="space-y-2 mb-4">
                            {cart.map((item) => (
                                <li key={item._id} className="flex justify-between items-center bg-white rounded shadow px-4 py-2">
                                    <span>{item.ProductName} x {item.qty}</span>
                                    <div className="flex items-center gap-2">
                                        <span>{item.Price * item.qty}₺</span>
                                        <button onClick={() => removeFromCart(item._id)} className="bg-red-500 text-white px-2 py-1 rounded">Sil</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="font-bold mb-2">Toplam: {cart.reduce((sum, item) => sum + item.Price * item.qty, 0)}₺</div>
                    <button
                        onClick={handleOrder}
                        disabled={cart.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                    >
                        Sipariş Ver
                    </button>
                    {orderSuccess && <div className="text-green-600 mt-2">Siparişiniz alındı!</div>}
                </div>
            </div>
        </div>
    );
};

export default QrOrderPage; 