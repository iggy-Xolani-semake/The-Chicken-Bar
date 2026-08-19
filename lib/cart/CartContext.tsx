"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  cartReducer,
  cartSubtotal,
  type CartState,
  type CartAction,
  type CartLineItem,
} from "@/lib/cart/cartLogic";

interface CartContextValue {
  lines: CartLineItem[];
  subtotal: number;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = { lines: [] };

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider
      value={{
        lines: state.lines,
        subtotal: cartSubtotal(state.lines),
        dispatch,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return ctx;
}
