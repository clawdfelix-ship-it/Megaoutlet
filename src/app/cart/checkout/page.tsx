import { permanentRedirect } from 'next/navigation';

export default function CheckoutRedirectPage() {
  permanentRedirect('/shop/cart/checkout');
}

