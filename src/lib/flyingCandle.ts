export const ICED_LATTE_CANDLE =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/iced%20latte%20moon%20candles/iced%20strawberry%20matcha%20latte.png";
  export function sameImage(a: string, b: string) {
  const norm = (u: string) => {
    try {
      return decodeURIComponent(u).split("?")[0];
    } catch {
      return u.split("?")[0];
    }
  };
  return norm(a) === norm(b);
}