import { Stage, Layer, Rect, Transformer } from "react-konva";
import { useState, useRef, useEffect } from "react";
import api from "../../api/axios";

export default function CanvasStage({ onSelect, onNameChange }) {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const transformerRef = useRef(null);
  const selectedShapeRef = useRef(null);
  const containerRef = useRef(null);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  /* ---------- RESPONSIVE STAGE SIZE ---------- */
  useEffect(() => {
    const resizeStage = () => {
      if (!containerRef.current) return;
      setStageSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };

    resizeStage();
    window.addEventListener("resize", resizeStage);
    return () => window.removeEventListener("resize", resizeStage);
  }, []);

  /* ---------- TRANSFORMER BIND ---------- */
  useEffect(() => {
    if (selectedId && selectedShapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([selectedShapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  /* ---------- KEYBOARD DELETE ---------- */
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === "Delete" && selectedId) {
        await api.delete(`/annotations/${selectedId}`);
        setRectangles((prev) => prev.filter((r) => r.id !== selectedId));
        setSelectedId(null);
        onSelect?.(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, onSelect]);

  /* ---------- LOAD ANNOTATIONS ---------- */
  useEffect(() => {
    const loadAnnotations = async () => {
      const res = await api.get("/annotations");
      setRectangles(
        res.data.map((r) => ({
          id: r._id,
          name: r.name || "",
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        }))
      );
    };
    loadAnnotations();
  }, []);

  const updateName = async (id, name) => {
  setRectangles((prev) =>
    prev.map((r) => (r.id === id ? { ...r, name } : r))
  );

  try {
    await api.put(`/annotations/${id}`, { name });
  } catch (err) {
    console.error("Failed to update name", err);
  }
};

  return (
    <>
      <button
        disabled={!selectedId}
        onClick={async () => {
          await api.delete(`/annotations/${selectedId}`);
          setRectangles((prev) => prev.filter((r) => r.id !== selectedId));
          setSelectedId(null);
          onSelect?.(null);
        }}
        style={{ marginBottom: 10 }}
      >
        Delete Selected
      </button>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid #ccc",
          background: "#f9f9f9",
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
              onSelect?.(null);
              const pos = e.target.getStage().getPointerPosition();
              setNewRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            }
          }}
          onMouseMove={(e) => {
            if (!newRect) return;
            const pos = e.target.getStage().getPointerPosition();
            setNewRect((prev) => ({
              ...prev,
              width: pos.x - prev.x,
              height: pos.y - prev.y,
            }));
          }}
          onMouseUp={async () => {
            if (!newRect) return;
            if (Math.abs(newRect.width) < 5 || Math.abs(newRect.height) < 5) {
              setNewRect(null);
              return;
            }

            const res = await api.post("/annotations", {
              ...newRect,
              name: "",
            });

            setRectangles((prev) => [
              ...prev,
              {
                id: res.data._id,
                x: res.data.x,
                y: res.data.y,
                width: res.data.width,
                height: res.data.height,
              },
            ]);

            setNewRect(null);
          }}
        >
          <Layer>
            {rectangles.map((rect) => (
              <Rect
                key={rect.id}
                ref={rect.id === selectedId ? selectedShapeRef : null}
                {...rect}
                stroke={rect.id === selectedId ? "#2563eb" : "red"}
                strokeWidth={2}
                draggable
                onClick={(e) => {
                  setSelectedId(rect.id);
                  onSelect?.(rect);
                  e.target.moveToTop();
                  e.target.getLayer().batchDraw();
                }}
                onDragStart={(e) => {
                  e.target.moveToTop();
                }}
                onDragEnd={(e) => {
                  const x = e.target.x();
                  const y = e.target.y();

                  setRectangles((prev) =>
                    prev.map((r) =>
                      r.id === rect.id ? { ...r, x, y } : r
                    )
                  );

                  api.put(`/annotations/${rect.id}`, { x, y });
                }}
                onTransformEnd={() => {
                  const node = selectedShapeRef.current;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  node.scaleX(1);
                  node.scaleY(1);

                  let width = node.width() * scaleX;
                  let height = node.height() * scaleY;
                  let x = node.x();
                  let y = node.y();

                  if (width < 0) {
                    width = Math.abs(width);
                    x -= width;
                  }
                  if (height < 0) {
                    height = Math.abs(height);
                    y -= height;
                  }

                  width = Math.max(5, width);
                  height = Math.max(5, height);

                  const updated = { x, y, width, height };

                  setRectangles((prev) =>
                    prev.map((r) =>
                      r.id === rect.id ? { ...r, ...updated } : r
                    )
                  );

                  api.put(`/annotations/${rect.id}`, updated);
                }}
                onMouseEnter={() => (document.body.style.cursor = "move")}
                onMouseLeave={() => (document.body.style.cursor = "default")}
              />
            ))}

            {selectedId && (
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                flipEnabled={false}
              />
            )}

            {newRect && (
              <Rect
                {...newRect}
                stroke="blue"
                dash={[4, 4]}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </>
  );
}
