/** API proxy: visitors call the same website domain, never their own localhost:4000. */
export default {
  // Allow at most one 45s free-model retry and optional 60s local-model fallback.
  experimental:{proxyTimeout:180_000},
  async rewrites(){return [{source:'/api/:path*',destination:'http://127.0.0.1:4000/api/:path*'}];}
};
