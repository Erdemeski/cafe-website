import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './user/userSlice.js';
import themeReducer from './theme/themeSlice.js';
import languageReducer from './page_Language/languageSlice.js';
import currencyReducer from './currency/currencySlice.js';
import tableCookieReducer from './table/tableCookieSlice.js';
import notificationReducer from './notification/notificationSlice.js';

const rootReducer = combineReducers({
    user: userReducer,
    theme: themeReducer,
    language: languageReducer,
    currency: currencyReducer,
    tableCookie: tableCookieReducer,
    notification: notificationReducer,
});

const persistConfig = {
    key: 'root',
    storage,
    version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);