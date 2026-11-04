/** API proxy: visitors call the same website domain, never their own localhost:4000. */
export default {
  // Allow at most one 45s free-model retry and optional 60s local-model fallback.
  experimental:{proxyTimeout:180_000},
  // Local IPv4 URL used by the browser smoke test and Windows developers.
  // Explicit dev origins are required by upcoming versions of Next.js.
  allowedDevOrigins:['127.0.0.1','localhost'],
  async rewrites(){return [{source:'/api/:path*',destination:`${process.env.INTERNAL_API_ORIGIN || 'http://127.0.0.1:4000'}/api/:path*`}];}
};
