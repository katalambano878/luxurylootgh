'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="relative z-[9999]">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col slide-in-right" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-700"></i>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <i className="ri-shopping-cart-line text-5xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add items to get started</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="px-6 py-3 bg-stone-700 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.variant}`} className="flex space-x-4 bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                      {item.variant && (
                        <p className="text-xs text-gray-600 mb-2">
                          Variant: {item.variant}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-stone-700">
                          GH₵{item.price.toFixed(2)}
                        </span>

                        <div className="flex items-center border border-gray-300 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            {item.quantity <= (item.moq || 1) ? (
                              <i className="ri-delete-bin-line text-red-500"></i>
                            ) : (
                              <i className="ri-subtract-line text-gray-700"></i>
                            )}
                          </button>
                          <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                            disabled={item.quantity >= item.maxStock}
                          >
                            <i className="ri-add-line text-gray-700"></i>
                          </button>
                        </div>
                      </div>
                      {item.quantity >= item.maxStock && (
                        <p className="text-xs text-amber-600 mt-1">Max stock reached</p>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id, item.variant)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-red-600"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 sm:px-6 sm:py-5 bg-gray-50 flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-700 font-medium text-sm">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">GH₵{subtotal.toFixed(2)}</span>
              </div>

              <p className="text-xs text-gray-500 mb-4 text-left">
                Shipping calculated at checkout
              </p>

              <div className="flex gap-3">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer text-sm"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex-[1.5] py-2.5 bg-stone-800 text-white text-center rounded-lg font-semibold hover:bg-stone-900 transition-colors whitespace-nowrap cursor-pointer text-sm"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
