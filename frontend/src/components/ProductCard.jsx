import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modern ve responsive ürün kartı bileşeni
 * @param {string} image - Ürün görseli
 * @param {string} name - Ürün adı
 * @param {string} description - Ürün açıklaması
 * @param {number|string} price - Ürün fiyatı
 * @param {string} currency - Para birimi (varsayılan: 'TL')
 * @param {function} onAddToCart - Sepete ekle butonuna tıklanınca çağrılır
 */
const ProductCard = ({ image, name, description, price, currency = 'TL', onAddToCart, quantity, onIncrease, onDecrease }) => {
  return (
    <div className="bg-white dark:bg-[rgb(22,26,29)] rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl w-full max-w-xs mx-auto">
      <div className="relative w-full h-48 sm:h-44 md:h-40 flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full"
        />
        <span className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md select-none">
          {price} {currency}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-4 pb-3">
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{name}</h3>
        <p className="text-gray-500 dark:text-gray-300 text-sm mb-4 flex-1">{description}</p>
        {typeof quantity === 'number' && onIncrease && onDecrease ? (
          <div className="flex items-center justify-between mt-auto">
            <button
              className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 text-xl font-bold text-blue-600 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-gray-600 transition"
              onClick={onDecrease}
              aria-label="Azalt"
            >
              -
            </button>
            <span className="mx-3 text-lg font-semibold text-gray-900 dark:text-white">{quantity}</span>
            <button
              className="w-9 h-9 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center hover:bg-blue-700 transition"
              onClick={onIncrease}
              aria-label="Arttır"
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition text-base flex items-center justify-center gap-2"
            onClick={onAddToCart}
          >
            <span className="text-xl font-bold">+</span> Sepete Ekle
          </button>
        )}
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currency: PropTypes.string,
  onAddToCart: PropTypes.func,
  quantity: PropTypes.number,
  onIncrease: PropTypes.func,
  onDecrease: PropTypes.func,
};

export default ProductCard;
