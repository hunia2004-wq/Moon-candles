"use client";

import { LabelPlate } from "./CandleLabelWrap";

type Props = {
  message: string;
  onMessageChange: (v: string) => void;
  photoUrl: string | null;
  onPhotoClick: () => void;
  maxLen: number;
  fontFamily?: string;
};

export default function LabelPlaceholder({
  message,
  onMessageChange,
  photoUrl,
  onPhotoClick,
  maxLen,
  fontFamily = "inherit",
}: Props) {
  return (
    <div className="w-full max-w-md" style={{ aspectRatio: "3.1 / 1" }}>
      <LabelPlate
        message={message}
        onMessageChange={onMessageChange}
        photoUrl={photoUrl}
        onPhotoClick={onPhotoClick}
        fontFamily={fontFamily}
        maxLen={maxLen}
      />
    </div>
  );
}