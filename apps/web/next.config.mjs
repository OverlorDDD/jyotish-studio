/** API proxy: visitors call the same website domain, never their own localhost:4000. */
export default {
  // OpenRouter free models may take up to 45s; allow the proxy more time.
  experimental:{proxyTimeout:90_000},
  async rewrites(){return [{source:'/api/:path*',destination:'http://127.0.0.1:4000/api/:path*'}];}
};
