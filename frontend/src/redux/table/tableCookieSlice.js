import { createSlice } from "@reduxjs/toolkit";

// Cookie number generator fonksiyonu
const generateCookieNumber = (tableNumber) => {
  // Timestamp (base36)
  const timestamp = Date.now().toString(36);
  
  // Random string (8 karakter)
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  // Masa numarası (3 haneli, sıfırla doldurulmuş)
  const tablePart = tableNumber.toString().padStart(3, '0');
  
  // Session ID (4 karakter)
  const sessionId = Math.random().toString(36).substring(2, 6);
  
  // Basit hash oluştur
  const hashInput = `${timestamp}${randomPart}${tablePart}${sessionId}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer'a dönüştür
  }
  const hashHex = Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0');
  
  // Final cookie number formatı: TIMESTAMP-RANDOM-TABLE-SESSION-HASH
  return `${timestamp}-${randomPart}-${tablePart}-${sessionId}-${hashHex}`.toUpperCase();
};

// Cookie validasyon fonksiyonu
const validateCookieFormat = (cookieNumber) => {
  if (!cookieNumber || typeof cookieNumber !== 'string') {
    return false;
  }
  
  const parts = cookieNumber.split('-');
  if (parts.length !== 5) {
    return false;
  }
  
  const [timestamp, randomPart, tablePart, sessionId, hash] = parts;
  
  return timestamp.length >= 8 && randomPart.length === 8 && 
         tablePart.length === 3 && sessionId.length === 4 && 
         hash.length === 6;
};

const initialState = {
  cookieNumber: null,
  tableNumber: null,
  expiresAt: null, // timestamp (ms)
  isActive: false,
  createdAt: null,
  sessionId: null,
};

const tableCookieSlice = createSlice({
  name: "tableCookie",
  initialState,
  reducers: {
    setTableCookie: (state, action) => {
      const { tableNumber, expiresAt, cookieNumber } = action.payload;
      
      // Eğer cookieNumber verilmemişse, otomatik oluştur
      const finalCookieNumber = cookieNumber || generateCookieNumber(tableNumber);
      
      // Session ID'yi cookie number'dan çıkar
      const sessionId = finalCookieNumber.split('-')[3];
      
      state.cookieNumber = finalCookieNumber;
      state.tableNumber = tableNumber;
      state.expiresAt = expiresAt;
      state.isActive = true;
      state.createdAt = Date.now();
      state.sessionId = sessionId;
    },
    clearTableCookie: (state) => {
      state.cookieNumber = null;
      state.tableNumber = null;
      state.expiresAt = null;
      state.isActive = false;
      state.createdAt = null;
      state.sessionId = null;
    },
    refreshCookie: (state) => {
      if (state.tableNumber && state.isActive) {
        // Sadece süreyi yenile, cookie number ve session ID'yi koru
        state.expiresAt = Date.now() + 2 * 60 * 1000; // 2 dakika
      }
    },
    validateCookie: (state) => {
      if (state.cookieNumber && state.expiresAt) {
        const isValidFormat = validateCookieFormat(state.cookieNumber);
        const isNotExpired = Date.now() < state.expiresAt;
        
        // Cookie süresi geçtiğinde direkt isActive'i false yap
        if (!isNotExpired) {
          state.isActive = false;
          console.log('Cookie expired, session deactivated');
        } else {
          state.isActive = isValidFormat;
        }
      } else {
        state.isActive = false;
      }
    },
  },
});

export const { setTableCookie, clearTableCookie, refreshCookie, validateCookie } = tableCookieSlice.actions;

// Selectors
export const selectTableCookie = (state) => state.tableCookie;
export const selectIsCookieActive = (state) => state.tableCookie.isActive;
export const selectCookieNumber = (state) => state.tableCookie.cookieNumber;
export const selectTableNumber = (state) => state.tableCookie.tableNumber;
export const selectSessionId = (state) => state.tableCookie.sessionId;

export default tableCookieSlice.reducer; 