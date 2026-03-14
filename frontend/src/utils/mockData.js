// Navigation menu data
export const navMenus = [
  { title: 'Home', path: '/' },
  {
    title: 'Phones',
    children: [
      { title: 'iPhone 16', path: '/collections/iphone16' },
      { title: 'iPhone 15', path: '/collections/iphone15' },
      { title: 'iPhone 14', path: '/collections/iphone14' },
      { title: 'iPhone 13', path: '/collections/iphone13' },
      { title: 'iPhone 12', path: '/collections/iphone12' },
      { title: 'Samsung Phones', path: '/collections/samsung-iphone' },
    ],
  },
  {
    title: 'Tablets',
    children: [
      { title: 'iPad Pro', path: '/collections/ipad-pro' },
      { title: 'iPad mini', path: '/collections/ipad-mini' },
      { title: 'iPad Air', path: '/collections/ipad-air' },
      { title: 'Samsung iPad', path: '/collections/samsung-pad' },
    ],
  },
  {
    title: 'Computers',
    children: [
      { title: 'MacBook Air', path: '/collections/macbook-air' },
      { title: 'MacBook Pro', path: '/collections/macbook-pro' },
      { title: 'Laptop', path: '/collections/laptop' },
    ],
  },
  {
    title: 'Audio & Gaming',
    children: [
      { title: 'PlayStation 5', path: '/collections/playstation-5' },
      { title: 'Nintendo Switch OLED', path: '/collections/nintendo-switch-oled' },
      { title: 'Xbox Series X', path: '/collections/xbox-series-x' },
      { title: 'Steam Deck', path: '/collections/steam-deck' },
      { title: 'PlayStation Portal', path: '/collections/playstation-portal' },
      { title: 'ASUS ROG Ally', path: '/collections/asus-rog-ally' },
    ],
  },
  { title: 'Apple AirPods', path: '/collections/apple-airpods' },
  {
    title: 'Electronics',
    children: [
      { title: 'Drone', path: '/collections/dji' },
      { title: 'DSLR Camera', path: '/collections/mirrorless' },
      { title: 'Generator', path: '/collections/generator' },
    ],
  },
]

// Collections data
export const collections = [
  { slug: 'iphone16', title: 'iPhone 16', image: 'https://picsum.photos/seed/iphone16/400/400', count: 320 },
  { slug: 'iphone15', title: 'iPhone 15', image: 'https://picsum.photos/seed/iphone15/400/400', count: 280 },
  { slug: 'iphone14', title: 'iPhone 14', image: 'https://picsum.photos/seed/iphone14/400/400', count: 245 },
  { slug: 'iphone13', title: 'iPhone 13', image: 'https://picsum.photos/seed/iphone13/400/400', count: 210 },
  { slug: 'iphone12', title: 'iPhone 12', image: 'https://picsum.photos/seed/iphone12/400/400', count: 190 },
  { slug: 'samsung-iphone', title: 'Samsung Phones', image: 'https://picsum.photos/seed/samsung/400/400', count: 356 },
  { slug: 'ipad-pro', title: 'iPad Pro', image: 'https://picsum.photos/seed/ipadpro/400/400', count: 178 },
  { slug: 'ipad-mini', title: 'iPad mini', image: 'https://picsum.photos/seed/ipadmini/400/400', count: 134 },
  { slug: 'ipad-air', title: 'iPad Air', image: 'https://picsum.photos/seed/ipadair/400/400', count: 156 },
  { slug: 'samsung-pad', title: 'Samsung iPad', image: 'https://picsum.photos/seed/samsungpad/400/400', count: 98 },
  { slug: 'macbook-air', title: 'MacBook Air', image: 'https://picsum.photos/seed/macbookair/400/400', count: 223 },
  { slug: 'macbook-pro', title: 'MacBook Pro', image: 'https://picsum.photos/seed/macbookpro/400/400', count: 198 },
  { slug: 'laptop', title: 'Laptop', image: 'https://picsum.photos/seed/laptop/400/400', count: 445 },
  { slug: 'playstation-5', title: 'PlayStation 5', image: 'https://picsum.photos/seed/ps5/400/400', count: 267 },
  { slug: 'nintendo-switch-oled', title: 'Nintendo Switch OLED', image: 'https://picsum.photos/seed/switch/400/400', count: 312 },
  { slug: 'xbox-series-x', title: 'Xbox Series X', image: 'https://picsum.photos/seed/xbox/400/400', count: 189 },
  { slug: 'steam-deck', title: 'Steam Deck', image: 'https://picsum.photos/seed/steamdeck/400/400', count: 145 },
  { slug: 'playstation-portal', title: 'PlayStation Portal', image: 'https://picsum.photos/seed/psportal/400/400', count: 87 },
  { slug: 'asus-rog-ally', title: 'ASUS ROG Ally', image: 'https://picsum.photos/seed/rogally/400/400', count: 76 },
  { slug: 'apple-airpods', title: 'Apple AirPods', image: 'https://picsum.photos/seed/airpods/400/400', count: 234 },
  { slug: 'dji', title: 'DJI Drone', image: 'https://picsum.photos/seed/drone/400/400', count: 123 },
  { slug: 'mirrorless', title: 'Mirrorless Camera', image: 'https://picsum.photos/seed/camera/400/400', count: 167 },
  { slug: 'generator', title: 'Generator', image: 'https://picsum.photos/seed/generator/400/400', count: 54 },
]

// Sample products
export function generateProducts(count = 48, collection = '') {
  const productNames = {
    'nintendo-switch-oled': [
      'Nintendo Switch OLED Pokemon Scarlet and Violet',
      'OLED Switch + 5 Game Bundle',
      'Nintendo Switch OLED Zelda TOTK Edition',
      'Nintendo Switch OLED with carrying case plus games',
      'Mario Edition Nintendo Switch OLED',
      'Nintendo Switch OLED 64GB with 128GB SD CARD',
      'Brand New Sealed Pokemon Nintendo Switch OLED Console',
      'Nintendo Switch OLED Pokemon Edition',
      'The Legend of Zelda Nintendo Switch OLED',
      'Nintendo Switch OLED White',
      'Nintendo Switch OLED Neon Blue/Red',
      'Nintendo Switch OLED Splatoon Edition',
    ],
    'playstation-5': [
      'PlayStation 5 Digital Edition',
      'PS5 Console with 2 Controllers',
      'PlayStation 5 Slim Bundle',
      'PS5 Disc Edition + 3 Games',
      'PlayStation 5 Spider-Man Edition',
      'PS5 God of War Ragnarok Bundle',
    ],
    'iphone16': [
      'iPhone 16 Pro Max 256GB',
      'iPhone 16 Pro 128GB Natural Titanium',
      'iPhone 16 256GB Blue',
      'iPhone 16 Plus 512GB Black',
      'iPhone 16 Pro Max 1TB Desert Titanium',
      'iPhone 16 128GB Pink',
    ],
    default: [
      'Premium Wireless Headphones',
      'Smart Watch Ultra Series',
      'Portable Bluetooth Speaker',
      'USB-C Fast Charging Hub',
      'Mechanical Gaming Keyboard',
      'Wireless Gaming Mouse',
      'HD Webcam Pro 4K',
      '27" Gaming Monitor',
      'Noise Cancelling Earbuds',
      'Tablet Stand Adjustable',
      'Portable SSD 1TB',
      'Smart Home Hub',
    ],
  }

  const names = productNames[collection] || productNames.default
  const products = []

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length]
    const price = +(Math.random() * 500 + 50).toFixed(2)
    const hasDiscount = Math.random() > 0.4
    const originalPrice = hasDiscount ? +(price * (1.3 + Math.random() * 0.7)).toFixed(2) : null
    const rating = +(3.5 + Math.random() * 1.5).toFixed(1)

    products.push({
      id: `m${Date.now()}${i}`,
      name: i > names.length - 1 ? `${name} #${i + 1}` : name,
      price,
      originalPrice,
      image: `https://picsum.photos/seed/prod${collection}${i}/400/400`,
      images: [
        `https://picsum.photos/seed/prod${collection}${i}/600/600`,
        `https://picsum.photos/seed/prod${collection}${i}b/600/600`,
        `https://picsum.photos/seed/prod${collection}${i}c/600/600`,
      ],
      rating,
      reviews: Math.floor(Math.random() * 200),
      collection: collection || 'all',
      inStock: Math.random() > 0.1,
      discount: hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0,
      description: 'Consignment pre-owned item. Basic functionality tested. Condition varies — please review photos and description carefully.',
    })
  }
  return products
}

// Homepage banner slides
export const bannerSlides = [
  {
    title: 'Gaming',
    subtitle: 'Level up your gaming experience',
    description: 'Discover our collection of pre-owned gaming consoles and accessories.',
    image: 'https://picsum.photos/seed/gaming-banner/1400/500',
    link: '/collections/playstation-5',
    buttonText: 'Shop Gaming',
  },
  {
    title: 'TWS Headphones',
    subtitle: 'An icon, now wireless!',
    description: 'Wireless Over-Ear Headphones are an evolution of our very first headphones.',
    image: 'https://picsum.photos/seed/headphones-banner/1400/500',
    link: '/collections/apple-airpods',
    buttonText: 'Shop Audio',
  },
  {
    title: 'Laptops',
    subtitle: 'Power meets portability',
    description: 'Find your perfect MacBook or laptop at unbeatable prices.',
    image: 'https://picsum.photos/seed/laptop-banner/1400/500',
    link: '/collections/macbook-pro',
    buttonText: 'Shop Laptops',
  },
  {
    title: 'Nintendo Switch',
    subtitle: 'Play anywhere, anytime',
    description: 'Pre-owned Nintendo Switch OLED consoles with verified quality.',
    image: 'https://picsum.photos/seed/switch-banner/1400/500',
    link: '/collections/nintendo-switch-oled',
    buttonText: 'Shop Now',
  },
]

// Category quick links for homepage
export const categoryQuickLinks = [
  { title: 'PlayStation 5', image: 'https://picsum.photos/seed/cat-ps5/300/300', link: '/collections/playstation-5' },
  { title: 'iPhone 16', image: 'https://picsum.photos/seed/cat-iphone/300/300', link: '/collections/iphone16' },
  { title: 'Apple AirPods', image: 'https://picsum.photos/seed/cat-airpods/300/300', link: '/collections/apple-airpods' },
  { title: 'Nintendo Switch OLED', image: 'https://picsum.photos/seed/cat-switch/300/300', link: '/collections/nintendo-switch-oled' },
  { title: 'iPad Pro', image: 'https://picsum.photos/seed/cat-ipad/300/300', link: '/collections/ipad-pro' },
  { title: 'MacBook Pro', image: 'https://picsum.photos/seed/cat-macbook/300/300', link: '/collections/macbook-pro' },
]

// FAQ items
export const faqItems = [
  {
    icon: '📦',
    title: 'Item Condition & Contents',
    content: 'All items are consignment pre-owned. Conditions vary. Each product undergoes a basic functionality check before listing. Please review photos and descriptions carefully before purchasing.',
  },
  {
    icon: '🔄',
    title: 'How Consignment Works',
    content: 'We operate on a consignment model — most items are unique, one-of-a-kind pieces from individual sellers. Once an item sells, it may not be available again.',
  },
  {
    icon: '🚚',
    title: 'Shipping & Tracking',
    content: 'All orders include tracking numbers. Delivery times vary by carrier and destination. We offer free worldwide shipping on eligible orders.',
  },
  {
    icon: '↩️',
    title: 'Returns & Refunds',
    content: 'Returns are accepted within the return window. Refunds are processed to the original payment method. Please see our Returns Policy for details.',
  },
  {
    icon: '🛡️',
    title: 'Payment & Buyer Protection',
    content: 'All payments are processed securely. Buyer protection covers every order. Shop with confidence knowing your purchase is protected.',
  },
  {
    icon: '✅',
    title: 'Warranty & Quality Check',
    content: 'Warranty varies by product. All items have passed a basic functionality test. Extended warranty options may be available for select items.',
  },
]

// Service features
export const serviceFeatures = [
  { icon: '🚚', title: 'Free Shipping', description: 'Free Shipping on Eligible Orders (Shown at Checkout)' },
  { icon: '💬', title: 'Support', description: 'Our support team is available 24/7' },
  { icon: '🛡️', title: 'Buyer Protection', description: 'All payments are processed securely' },
  { icon: '⏰', title: '24 Hours', description: 'Available Monday To Friday: 8Am-8:30Pm' },
]

// Sort options
export const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'alpha-asc', label: 'Alphabetically, A-Z' },
  { value: 'alpha-desc', label: 'Alphabetically, Z-A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'date-asc', label: 'Date, old to new' },
  { value: 'date-desc', label: 'Date, new to old' },
]

// Footer links
export const footerLinks = {
  customerCare: [
    { title: 'Shipping Policy', path: '/pages/shipping-policy' },
    { title: 'Returns & Refunds', path: '/pages/returns-refunds' },
    { title: 'Buyer Confidence', path: '/pages/buyer-confidence' },
    { title: 'Buyer Protection', path: '/pages/buyer-protection' },
    { title: 'Warranty Policy', path: '/pages/warranty-policy' },
    { title: 'Consignment Policy', path: '/pages/consignment-policy' },
  ],
  myAccount: [
    { title: 'Sign In', path: '/account/login' },
    { title: 'Register', path: '/account/register' },
    { title: 'Order Tracking', path: '/tracking' },
    { title: 'My Orders', path: '/account/orders' },
  ],
  companyLegal: [
    { title: 'About Us', path: '/pages/about-us' },
    { title: 'Privacy Policy', path: '/pages/privacy-policy' },
    { title: 'Terms of Service', path: '/pages/terms-of-service' },
    { title: 'Contact Us', path: '/pages/contact-us' },
  ],
}
