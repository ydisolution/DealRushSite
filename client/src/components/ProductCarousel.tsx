import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ProductCarouselProps {
  images: string[];
  productName: string;
}

export default function ProductCarousel({ images, productName }: ProductCarouselProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">אין תמונות זמינות</p>
      </div>
    );
  }

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-white/80">
        <img 
          src={images[0]} 
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Main Carousel */}
      <Swiper
        modules={[Thumbs]}
        spaceBetween={0}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="product-carousel-main rounded-2xl shadow-lg overflow-hidden"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full aspect-square bg-gray-50">
              <img
                src={image}
                alt={`${productName} - תמונה ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView="auto"
          freeMode={true}
          watchSlidesProgress={true}
          className="product-carousel-thumbs"
        >
          {images.map((image, index) => (
            <SwiperSlide 
              key={index} 
              className="!w-20 !h-20 cursor-pointer"
            >
              <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#7B2FF7] transition-all duration-300 hover:shadow-md">
                <img
                  src={image}
                  alt={`תמונה ממוזערת ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <style>{`
        /* Active thumbnail - highlighted when selected */
        .product-carousel-thumbs .swiper-slide-thumb-active > div {
          border-color: #7B2FF7 !important;
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(123, 47, 247, 0.15);
        }
      `}</style>
    </div>
  );
}
