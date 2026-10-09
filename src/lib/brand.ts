// Single source of truth for the shop logo (header, footer, admin, login)
export const LOGO_URL =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/moon%20logo/logo2.png";

// Logo sizes (Tailwind classes). Edit the numbers here and every page follows.
export const LOGO_SIZE = {
  // header image: mobile / desktop
  header: "h-32 w-auto md:h-36",
  // footer: clipping box around the logo, then the image inside it
  footerBox: "h-12 md:h-16",
  footerImg: "h-32 w-auto max-w-none shrink-0 md:h-36",
  // admin: mobile top bar, desktop sidebar, login page
  adminMobile: "h-24 w-auto",
  adminSidebar: "h-14 w-auto",
  login: "h-44 w-auto",
};
