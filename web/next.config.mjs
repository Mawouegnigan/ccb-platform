/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/carte-membre/[id]": ["./node_modules/pdfkit/js/**/*"],
  },
};

export default nextConfig;