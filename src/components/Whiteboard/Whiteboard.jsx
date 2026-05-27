import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './Whiteboard.css';

const Whiteboard = ({ isRoom, yDoc, id, initialData, whiteboardSaveRef, apiURL, accessToken }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [color, setColor] = useState('black');
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef(null);
  const yLinesArrayRef = useRef(null);
  
  // CRITICAL FLAG: Tracks whether the background base document snapshot image was loaded
  const isImageLoadedRef = useRef(false);

  const getCanvas = () => canvasRef.current;
  const getCtx = () => canvasRef.current?.getContext('2d') || null;
  const getBounds = () => containerRef.current?.getBoundingClientRect();

  const setupCanvas = () => {
    const canvas = getCanvas();
    const bounds = getBounds();
    if (!canvas || !bounds) return null;

    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(bounds.width * scale);
    canvas.height = Math.floor(bounds.height * scale);
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  const clearCanvas = (ctx) => {
    const bounds = getBounds();
    if (!ctx || !bounds) return;
    ctx.clearRect(0, 0, bounds.width, bounds.height);
  };

  // Loads base template snapshot background from MongoDB storage collections
  const drawImageFromData = (callback) => {
    const ctx = getCtx();
    const bounds = getBounds();
    if (!ctx || !bounds || !initialData) {
      if (callback) callback();
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
      isImageLoadedRef.current = true;
      if (callback) callback(); // Always redraw vector strokes AFTER image overlay settles
    };
    img.src = initialData;
  };

  // Fixed Draw routine layer to safely overlay vector elements on top of image background context maps
  const redrawPaths = (paths) => {
    const ctx = getCtx();
    const bounds = getBounds();
    if (!ctx || !bounds) return;

    clearCanvas(ctx);

    // If initial image database background template is tracking, preserve it beneath drawings
    if (initialData && isImageLoadedRef.current) {
      const img = new Image();
      img.src = initialData;
      ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
    }

    if (!paths || paths.length === 0) return;

    paths.forEach((path) => {
      if (!path || !Array.isArray(path.points) || path.points.length === 0) return;
      ctx.strokeStyle = path.color || 'black';
      ctx.lineWidth = path.width || 4;
      ctx.beginPath();
      const [firstPoint, ...rest] = path.points;
      ctx.moveTo(firstPoint.x, firstPoint.y);
      rest.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  const handleYjsChanges = () => {
    const yArray = yLinesArrayRef.current;
    if (!yArray) return;
    redrawPaths(yArray.toArray());
  };

  useEffect(() => {
    setupCanvas();

    const initializeWhiteboardWorkspace = () => {
      if (isRoom && yDoc) {
        const array = yDoc.getArray('whiteboard-paths-' + id);
        yLinesArrayRef.current = array;
        array.observe(handleYjsChanges);

        const storedPaths = array.toArray();
        if (storedPaths.length > 0) {
          redrawPaths(storedPaths);
        }
      }
    };

    // If initial image payload exists, render it first, then paint vector elements
    if (initialData && !isImageLoadedRef.current) {
      drawImageFromData(initializeWhiteboardWorkspace);
    } else {
      initializeWhiteboardWorkspace();
    }

    return () => {
      if (yLinesArrayRef.current) {
        yLinesArrayRef.current.unobserve(handleYjsChanges);
      }
    };
  }, [isRoom, yDoc, id, initialData]);

  useEffect(() => {
    const handleResize = () => {
      const ctx = setupCanvas();
      if (!ctx) return;
      const yArray = yLinesArrayRef.current;
      if (isRoom && yArray) {
        redrawPaths(yArray.toArray());
      } else {
        redrawPaths([]);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRoom, initialData]);

  // Exposed manual reference connector pipeline bound to the main application navigation header menu bar
  useEffect(() => {
    whiteboardSaveRef.current = async () => {
      const canvas = getCanvas();
      if (!canvas) throw new Error('Whiteboard canvas not available');
      
      const dataURL = canvas.toDataURL('image/png');
      if (!accessToken) throw new Error('Missing access token');

      const config = {
        headers: {
          Authorization: accessToken,
          'Content-Type': 'application/json'
        }
      };

      await axios.put(`${apiURL}/codes/${id}/whiteboard`, { whiteboardData: dataURL }, config);
      return dataURL;
    };

    return () => {
      if (whiteboardSaveRef) {
        whiteboardSaveRef.current = null;
      }
    };
  }, [accessToken, apiURL, id, whiteboardSaveRef]);

  const getPointerCoordinates = (event) => {
    const canvas = getCanvas();
    const bounds = getBounds();
    if (!canvas || !bounds) return null;

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  };

  const drawStrokeSegment = (from, to, strokeColor, strokeWidth) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const commitStroke = () => {
    if (!currentStrokeRef.current) return;
    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setIsDrawing(false);

    if (isRoom && yLinesArrayRef.current) {
      yDoc.transact(() => {
        yLinesArrayRef.current.push([completedStroke]);
      });
    }
  };

  const handleMouseDown = (event) => {
    const point = getPointerCoordinates(event);
    if (!point) return;
    setIsDrawing(true);
    currentStrokeRef.current = {
      points: [point],
      color,
      width: lineWidth
    };
  };

  const handleMouseMove = (event) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const point = getPointerCoordinates(event);
    if (!point) return;

    const stroke = currentStrokeRef.current;
    const lastPoint = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);
    drawStrokeSegment(lastPoint, point, stroke.color, stroke.width);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    commitStroke();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      commitStroke();
    }
  };

  const handleClearCanvas = () => {
    const ctx = getCtx();
    if (!ctx) return;
    
    // Explicitly reset base template trackers so cleared rooms remain blank
    isImageLoadedRef.current = false;
    clearCanvas(ctx);

    if (isRoom && yLinesArrayRef.current) {
      yDoc.transact(() => {
        yLinesArrayRef.current.delete(0, yLinesArrayRef.current.length);
      });
    }
  };

  return (
    <div className="whiteboard__container" ref={containerRef}>
      <div className="whiteboard__toolbar">
        <div className="whiteboard__colors">
          {['black', 'red', 'blue', 'green'].map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={`whiteboard__color-option ${color === swatch ? 'selected' : ''}`}
              style={{ backgroundColor: swatch }}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
        <button type="button" className="whiteboard__button" onClick={handleClearCanvas}>
          Clear Canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="whiteboard__canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default Whiteboard;
