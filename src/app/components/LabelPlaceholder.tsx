"use client";

import { LabelPlate, TextToolbar, type TextBox } from "./CandleLabelWrap";

type Props = {
  boxes: TextBox[];
  onBoxesChange: (b: TextBox[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  photoUrl: string | null;
  onPhotoClick: () => void;
};

export default function LabelPlaceholder({
  boxes,
  onBoxesChange,
  selectedId,
  onSelect,
  photoUrl,
  onPhotoClick,
}: Props) {
  return (
    <>
      <div className="w-full max-w-md" style={{ aspectRatio: "3.1 / 1" }}>
        <LabelPlate
          boxes={boxes}
          onBoxesChange={onBoxesChange}
          selectedId={selectedId}
          onSelect={onSelect}
          photoUrl={photoUrl}
          onPhotoClick={onPhotoClick}
        />
      </div>
      <TextToolbar boxes={boxes} onBoxesChange={onBoxesChange} selectedId={selectedId} />
    </>
  );
}