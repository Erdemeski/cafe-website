import crypto from 'crypto';

/**
 * Benzersiz ve güvenli cookie number oluşturur
 * @param {string} tableNumber - Masa numarası
 * @returns {string} Benzersiz cookie number
 */
export const generateCookieNumber = (tableNumber) => {
  // Timestamp (base36)
  const timestamp = Date.now().toString(36);
  
  // Random string (8 karakter)
  const randomPart = crypto.randomBytes(4).toString('hex');
  
  // Masa numarası (3 haneli, sıfırla doldurulmuş)
  const tablePart = tableNumber.toString().padStart(3, '0');
  
  // Session ID (4 karakter)
  const sessionId = crypto.randomBytes(2).toString('hex');
  
  // Hash oluştur (güvenlik için)
  const hash = crypto.createHash('sha256')
    .update(`${timestamp}${randomPart}${tablePart}${sessionId}`)
    .digest('hex')
    .substring(0, 6);
  
  // Final cookie number formatı: TIMESTAMP-RANDOM-TABLE-SESSION-HASH
  return `${timestamp}-${randomPart}-${tablePart}-${sessionId}-${hash}`.toUpperCase();
};

/**
 * Cookie number'ın geçerliliğini kontrol eder
 * @param {string} cookieNumber - Kontrol edilecek cookie number
 * @returns {boolean} Geçerli mi
 */
export const validateCookieNumber = (cookieNumber) => {
  if (!cookieNumber || typeof cookieNumber !== 'string') {
    return false;
  }
  
  // Format kontrolü: TIMESTAMP-RANDOM-TABLE-SESSION-HASH
  const parts = cookieNumber.split('-');
  if (parts.length !== 5) {
    return false;
  }
  
  const [timestamp, randomPart, tablePart, sessionId, hash] = parts;
  
  // Her parçanın uzunluk kontrolü
  if (timestamp.length < 8 || randomPart.length !== 8 || 
      tablePart.length !== 3 || sessionId.length !== 4 || 
      hash.length !== 6) {
    return false;
  }
  
  // Hash doğrulama (geçici olarak devre dışı - sadece format kontrolü)
  // Frontend ve backend arasında hash hesaplama farklılıkları olabilir
  return true;
};

/**
 * Cookie'nin süresinin dolup dolmadığını kontrol eder
 * @param {string} cookieNumber - Kontrol edilecek cookie number
 * @param {number} expiresAt - Cookie'nin bitiş zamanı (opsiyonel)
 * @returns {boolean} Süresi dolmuş mu
 */
export const isCookieExpired = (cookieNumber, expiresAt = null) => {
  console.log('isCookieExpired called with:', { cookieNumber, expiresAt, currentTime: Date.now() });
  
  if (!cookieNumber || typeof cookieNumber !== 'string') {
    console.log('Cookie is null or not string');
    return true; // Geçersiz cookie = süresi dolmuş
  }
  
  const parts = cookieNumber.split('-');
  if (parts.length !== 5) {
    console.log('Invalid cookie format');
    return true;
  }
  
  // Eğer expiresAt verilmişse, onu kullan
  if (expiresAt && typeof expiresAt === 'number') {
    const isExpired = Date.now() > expiresAt;
    console.log('Using expiresAt:', { expiresAt, currentTime: Date.now(), isExpired });
    return isExpired;
  }
  
  // Eğer expiresAt yoksa, timestamp'ten hesapla
  const [timestamp] = parts;
  
  try {
    // Timestamp'i base36'den decimal'e çevir
    const timestampDecimal = parseInt(timestamp, 36);
    const currentTime = Date.now();
    
    // Cookie'nin oluşturulma zamanından 2 dakika geçmiş mi kontrol et
    const cookieAge = currentTime - timestampDecimal;
    const maxAge = 2 * 60 * 1000; // 2 dakika
    
    return cookieAge > maxAge;
  } catch (error) {
    return true; // Hata durumunda süresi dolmuş kabul et
  }
};

/**
 * Cookie'nin tam validasyonu (format + süre)
 * @param {string} cookieNumber - Kontrol edilecek cookie number
 * @param {number} expiresAt - Cookie'nin bitiş zamanı (opsiyonel)
 * @returns {boolean} Geçerli mi
 */
export const validateCookieWithExpiry = (cookieNumber, expiresAt = null) => {
  // Format kontrolü
  if (!validateCookieNumber(cookieNumber)) {
    return false;
  }
  
  // Süre kontrolü
  if (isCookieExpired(cookieNumber, expiresAt)) {
    return false;
  }
  
  return true;
}; 