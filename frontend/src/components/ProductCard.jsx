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
 * @param {string} Category - Ürün kategorisi
 * @param {object} headerRef - Header ref'i, searchbar'ı kapatmak için kullanılır
 */
const ProductCard = ({ image, name, shortDescription, description, price, currency = 'TL', onAddToCart, quantity, onIncrease, onDecrease, onModalClose, isPopular = false, isNewOne = false, Category, headerRef }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(image);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  // External modal close control
  useEffect(() => {
    if (onModalClose) {
      setIsModalOpen(false);
    }
  }, [onModalClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.03,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          transition: { duration: 0.25, ease: 'easeOut' }
        }}
        className="bg-white dark:bg-[rgb(26,31,34)] rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform w-full mx-auto max-w-sm sm:max-w-xs border border-gray-200 dark:border-gray-700 cursor-pointer"
      >
        <div className="relative w-full h-48 sm:h-44 md:h-40 flex-shrink-0">
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 hover:scale-105"
            onClick={() => { 
                setIsModalOpen(true); 
                setSelectedImage(image); 
                if (headerRef?.current?.closeSearchbar) {
                    headerRef.current.closeSearchbar();
                }
            }}
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
        <div className="flex flex-col flex-1 p-4 pb-3">
          <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{name}</h3>
          <p className="text-gray-500 dark:text-gray-300 text-sm mb-4 flex-1 line-clamp-2">{shortDescription ? shortDescription : "Lezzetli bir ürün"}</p>
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
              className="w-full py-1 mb-0.5 rounded-xl transition-all duration-300 text-base flex items-center justify-center gap-2"
              onClick={onAddToCart}
            >
              <Button gradientDuoTone='purpleToBlue' /* outline */ className='w-full text-white font-semibold text-xl'><FaCartPlus className='w-5 h-5 mr-2' /> Sepete Ekle</Button>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Ürün Ayrıntı Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Ürün Detayları</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsModalOpen(false)}
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
                        src={selectedImage}
                        alt={name}
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
                            {name}
                          </h2>
                          <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{description ? description : "Lezzetli bir ürün"}</p>
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
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{price} {currency}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Kategori:</span>
                          <span className="text-gray-900 dark:text-gray-100">{Category}</span>
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
                    {typeof quantity === 'number' && onIncrease && onDecrease ? (
                      <div className="flex items-center justify-center space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 pb-1 pl-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-2xl font-bold text-blue-600 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-gray-600 transition-all duration-200"
                          onClick={onDecrease}
                        >
                          -
                        </motion.button>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white min-w-[60px] text-center">{quantity}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 pb-1 pl-0.5 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-2xl font-bold flex items-center justify-center hover:from-purple-700 hover:to-cyan-600 transition-all duration-200"
                          onClick={onIncrease}
                        >
                          +
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddToCart}
                        className="w-full"
                      >
                        <Button gradientDuoTone='purpleToBlue' size='lg' className='w-full text-white font-semibold text-xl'>
                          <FaCartPlus className='w-6 h-6 mr-2' /> Sepete Ekle
                        </Button>
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
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
  Category: PropTypes.string,
  headerRef: PropTypes.object,
};

export default ProductCard;
