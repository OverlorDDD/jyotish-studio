/** API proxy: visitors call the same website domain, never their own localhost:4000. */
export default {
  async rewrites(){return [{source:'/api/:path*',destination:'http://127.0.0.1:4000/api/:path*'}];}
};
