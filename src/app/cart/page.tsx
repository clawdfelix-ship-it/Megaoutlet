import { permanentRedirect } from 'next/navigation';

export default function CartRedirectPage() {
  permanentRedirect('/shop/cart');
}

