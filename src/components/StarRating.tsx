
// FILE: src/components/StarRating.tsx
import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center justify-center" onMouseLeave={() => setHoverRating(0)}>
      {[...Array(10)].map((_, i) => {
        const ratingValue = i + 1;
        return (
          <span key={ratingValue} className="cursor-pointer text-2xl"
            style={{ color: ratingValue <= (hoverRating || rating) ? 'orange' : 'gray' }}
            onMouseEnter={() => setHoverRating(ratingValue)}
            onClick={() => onRate(ratingValue)}>★</span>
        );
      })}
    </div>
  );
};