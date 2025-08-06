import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal } from 'flowbite-react';
import { FaCartShopping } from "react-icons/fa6";
import { FaCartPlus } from 'react-icons/fa';

/**
 * Modern ve responsive ürün kartı bileşeni
 * @param {string} image - Ürün görseli
 * @param {string} name - Ürün adı
 * @param {string} shortDescription - Ürün kısa açıklaması
 * @param {string} description - Ürün açıklaması
 * @param {number|string} price - Ürün fiyatı
 * @param {string} currency - Para birimi (varsayılan: 'TL')
 * @param {function} onAddToCart - Sepete ekle butonuna tıklanınca çağrılır
 * @param {boolean} isPopular - Ürünün popüler olup olmadığı
 * @param {boolean} isNewOne - Ürünün yeni olup olmadığı
 * @param {string} category - Ürün kategorisi
 * @param {object} headerRef - Header ref'i, searchbar'ı kapatmak için kullanılır
 * @param {function} onProductClick - Ürün kartına tıklanınca çağrılır (modal açmak için)
 */
const ProductCard = ({ image, name, shortDescription, description, price, currency = 'TL', onAddToCart, quantity, onIncrease, onDecrease, onModalClose, isPopular = false, isNewOne = false, category, headerRef, onProductClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick();
    }
    if (headerRef?.current?.closeSearchbar) {
      headerRef.current.closeSearchbar();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.03,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        transition: { duration: 0.25, ease: 'easeOut' }
      }}
      className="bg-white dark:bg-[rgb(26,31,34)] rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform w-full mx-auto max-w-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
    >
      <div className="relative w-full h-60 flex-shrink-0">
        {/* Skeleton Animation */}
        <AnimatePresence mode='sync'>
          {!imageLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"
              onClick={handleProductClick}
            >
              <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded-t-2xl"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actual Image */}
        <AnimatePresence mode='sync'>
          {imageLoaded && !imageError && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              src={image}
              alt={name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 hover:scale-105"
              onClick={handleProductClick}
            />
          )}
        </AnimatePresence>

        {/* Error Placeholder */}
        <AnimatePresence mode='sync'>
          {imageLoaded && imageError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              onClick={handleProductClick}
            >
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">Görsel yüklenemedi</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden image for loading detection */}
        <img
          src={image}
          alt=""
          className="hidden"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        <span className="absolute top-3 right-3 bg-blue-600 text-white text-lg font-bold px-5 py-1 rounded-full shadow-md select-none">
          {price} {currency}
        </span>
        {isPopular && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md select-none transform -rotate-12"
          >
            ⭐ Popüler
          </motion.div>
        )}
        {isNewOne && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute top-3 left-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md select-none transform rotate-12 ${isPopular ? 'mt-7' : ''}`}
          >
            Yeni
          </motion.div>
        )}
      </div>
      <div className="flex flex-col flex-1 px-4 py-3">
        <div className='flex flex-row gap-2 items-center justify-between w-full mb-2 px-0.5'>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{name}</h3>
          {shortDescription && (
            <p className="flex-1 text-right  text-gray-500 dark:text-gray-300 text-xs line-clamp-2">{shortDescription}</p>
          )}
        </div>
        {typeof quantity === 'number' && onIncrease && onDecrease ? (
          <div className="flex items-center justify-between mt-auto min-h-[50px]">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-2xl pb-1 font-bold text-blue-600 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-gray-600 transition-all duration-200"
              onClick={onDecrease}
              aria-label="Azalt"
            >
              -
            </motion.button>
            <span className="mx-3 text-2xl text-center font-semibold text-gray-900 dark:text-white">{quantity}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-2xl pb-1 font-bold flex items-center justify-center text-center hover:bg-blue-700 transition-all duration-200"
              onClick={onIncrease}
              aria-label="Arttır"
            >
              +
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-1 rounded-xl transition-all duration-300 text-base flex items-center justify-center gap-2"
            onClick={onAddToCart}
          >
            <Button gradientDuoTone='purpleToBlue' outline className='w-full text-white font-semibold text-xl'><FaCartPlus className='w-5 h-5 mr-2' /> Sepete Ekle</Button>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  shortDescription: PropTypes.string,
  description: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currency: PropTypes.string,
  onAddToCart: PropTypes.func,
  quantity: PropTypes.number,
  onIncrease: PropTypes.func,
  onDecrease: PropTypes.func,
  onModalClose: PropTypes.bool,
  isPopular: PropTypes.bool,
  isNewOne: PropTypes.bool,
  category: PropTypes.object,
  headerRef: PropTypes.object,
  onProductClick: PropTypes.func,
};

export default ProductCard;
