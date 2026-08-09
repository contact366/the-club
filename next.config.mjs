import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌟 CETTE LIGNE EST LA CLÉ :
  // On définit une config turbopack vide pour dire à Next.js 
  // d'utiliser Webpack s'il voit une config Webpack.
  turbopack: {}, 
  
  // Tes autres options...
  reactStrictMode: true,
};

export default withPWA(nextConfig);