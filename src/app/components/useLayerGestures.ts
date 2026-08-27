"use client";

import { useRef, useCallback } from "react";

type Layer = {
  id: string;
  x: number;
  y: number;
  scale: number;
  [key: string]: any;
};

/**
 * Adds pinch-to-zoom and single-finger drag directly on a layer element,
 * plus undo support — no sliders needed.
 *
 * Touch:
 * - One finger = drag
 * - Two fingers = pinch to zoom
 *
 * Desktop:
 * - Drag = move
 * - Mouse wheel = zoom
 */
export function useLayerGestures<T extends Layer>(
  layers: T[],
  setLayers: (updater: (prev: T[]) => T[]) => void
) {
  const history = useRef<T[][]>([]);
  const activeId = useRef<string | null>(null);

  const pointers = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );

  const startDistance = useRef(0);
  const startScale = useRef(1);

  const dragStart = useRef({
    x: 0,
    y: 0,
    layerX: 0,
    layerY: 0,
  });

  /**
   * Save the current state so it can be restored with undo.
   */
  function pushHistory() {
    history.current.push(layers.map((layer) => ({ ...layer })));

    // Keep only the last 30 states.
    if (history.current.length > 30) {
      history.current.shift();
    }
  }

  /**
   * Undo the most recent change.
   */
  function undo() {
    const previous = history.current.pop();

    if (previous) {
      setLayers(() => previous);
    }
  }

  /**
   * Update only the requested properties of a layer.
   *
   * Partial<Layer> is used here instead of Partial<T>.
   * This allows us to safely update common Layer properties such
   * as x, y, and scale without TypeScript requiring every property
   * that may exist on the specific T type.
   */
  function updateLayer(id: string, patch: Partial<Layer>) {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === id
          ? ({ ...layer, ...patch } as T)
          : layer
      )
    );
  }

  /**
   * Pointer down:
   * - First pointer starts dragging.
   * - Second pointer starts pinch-to-zoom.
   */
  const onPointerDown = useCallback(
    (id: string, containerEl: HTMLElement | null) =>
      (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;

        target.setPointerCapture(e.pointerId);

        activeId.current = id;

        pointers.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });

        const layer = layers.find((item) => item.id === id);

        if (!layer) return;

        pushHistory();

        /**
         * One finger / pointer:
         * Start a drag.
         */
        if (pointers.current.size === 1) {
          dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            layerX: layer.x,
            layerY: layer.y,
          };
        }

        /**
         * Two fingers / pointers:
         * Start pinch-to-zoom.
         */
        else if (pointers.current.size === 2 && containerEl) {
          const points = Array.from(pointers.current.values());

          const dx = points[0].x - points[1].x;
          const dy = points[0].y - points[1].y;

          startDistance.current = Math.sqrt(
            dx * dx + dy * dy
          );

          startScale.current = layer.scale;
        }
      },
    [layers]
  );

  /**
   * Pointer move:
   * - One pointer = move layer.
   * - Two pointers = zoom layer.
   */
  const onPointerMove = useCallback(
    (containerEl: HTMLElement | null) =>
      (e: React.PointerEvent) => {
        if (
          !activeId.current ||
          !pointers.current.has(e.pointerId)
        ) {
          return;
        }

        pointers.current.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });

        const id = activeId.current;

        /**
         * ONE POINTER
         * Move the layer.
         */
        if (pointers.current.size === 1) {
          const rect = containerEl?.getBoundingClientRect();

          if (!rect) return;

          const deltaXPct =
            ((e.clientX - dragStart.current.x) / rect.width) * 100;

          const deltaYPct =
            ((e.clientY - dragStart.current.y) / rect.height) * 100;

          const newX = Math.min(
            100,
            Math.max(
              0,
              dragStart.current.layerX + deltaXPct
            )
          );

          const newY = Math.min(
            100,
            Math.max(
              0,
              dragStart.current.layerY + deltaYPct
            )
          );

          updateLayer(id, {
            x: newX,
            y: newY,
          });
        }

        /**
         * TWO POINTERS
         * Pinch to zoom.
         */
        else if (pointers.current.size === 2) {
          const points = Array.from(
            pointers.current.values()
          );

          const dx = points[0].x - points[1].x;
          const dy = points[0].y - points[1].y;

          const distance = Math.sqrt(
            dx * dx + dy * dy
          );

          const ratio =
            distance / (startDistance.current || 1);

          const newScale = Math.min(
            3,
            Math.max(
              0.2,
              startScale.current * ratio
            )
          );

          updateLayer(id, {
            scale: newScale,
          });
        }
      },
    []
  );

  /**
   * Pointer up:
   * Remove the pointer.
   *
   * When no pointers remain, stop interacting with
   * the current layer.
   */
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);

      if (pointers.current.size === 0) {
        activeId.current = null;
      }
    },
    []
  );

  /**
   * Desktop fallback:
   * Mouse wheel zooms the selected layer.
   */
  const onWheelZoom = useCallback(
    (id: string) => (e: React.WheelEvent) => {
      e.preventDefault();

      const layer = layers.find(
        (item) => item.id === id
      );

      if (!layer) return;

      pushHistory();

      const delta =
        e.deltaY > 0 ? -0.05 : 0.05;

      const newScale = Math.min(
        3,
        Math.max(
          0.2,
          layer.scale + delta
        )
      );

      updateLayer(id, {
        scale: newScale,
      });
    },
    [layers]
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheelZoom,
    undo,
    canUndo: () => history.current.length > 0,
  };
}