// components/VirtualTour.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  CircularProgress,
  Fab,
  Zoom,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ThreeSixty as ThreeSixtyIcon,
  PhotoCamera as PhotoCameraIcon,
  Videocam as VideocamIcon,
  Info as InfoIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

interface VirtualTourProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  tourData?: {
    type: '360' | 'video' | 'gallery';
    sources: {
      url: string;
      title?: string;
      description?: string;
      hotspots?: {
        x: number;
        y: number;
        label: string;
        description?: string;
      }[];
    }[];
    floorPlan?: string;
  };
  onSaveRoom?: (roomId: string) => void;
  isSaved?: boolean;
}

interface PanoramaViewer {
  container: HTMLDivElement | null;
  scene: any;
  camera: any;
  renderer: any;
  controls: any;
  raycaster: any;
  mouse: { x: number; y: number };
  hotspots: any[];
}

const VirtualTour: React.FC<VirtualTourProps> = ({
  open,
  onClose,
  roomId,
  roomName,
  tourData,
  onSaveRoom,
  isSaved = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'tour' | 'floorplan'>('tour');
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PanoramaViewer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize 360 viewer
  useEffect(() => {
    if (open && tourData?.type === '360' && containerRef.current) {
      initialize360Viewer();
    }

    return () => {
      cleanup360Viewer();
    };
  }, [open, tourData, currentIndex]);

  const initialize360Viewer = async () => {
    if (!containerRef.current || !tourData?.sources[currentIndex]) return;

    setLoading(true);

    try {
      // Using Three.js for 360 panorama (simplified version)
      // In production, you'd use a library like Pannellum or Photo Sphere Viewer
      const container = containerRef.current;
      
      // Create a mock 360 viewer
      const viewer = document.createElement('div');
      viewer.style.width = '100%';
      viewer.style.height = '100%';
      viewer.style.background = `url(${tourData.sources[currentIndex].url}) center/cover`;
      viewer.style.cursor = 'grab';
      viewer.style.transition = 'transform 0.1s ease-out';
      
      // Add pan and zoom functionality
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;

      viewer.addEventListener('mousedown', (e) => {
        isDragging = true;
        viewer.style.cursor = 'grabbing';
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
      });

      viewer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        viewer.style.transform = `rotateY(${currentX * 0.2}deg) rotateX(${-currentY * 0.1}deg) scale(${zoom})`;
      });

      viewer.addEventListener('mouseup', () => {
        isDragging = false;
        viewer.style.cursor = 'grab';
      });

      viewer.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
      });

      container.innerHTML = '';
      container.appendChild(viewer);

      // Add hotspots
      if (tourData.sources[currentIndex].hotspots) {
        tourData.sources[currentIndex].hotspots?.forEach((hotspot) => {
          const spot = document.createElement('div');
          spot.className = 'hotspot';
          spot.style.position = 'absolute';
          spot.style.left = `${hotspot.x}%`;
          spot.style.top = `${hotspot.y}%`;
          spot.style.width = '30px';
          spot.style.height = '30px';
          spot.style.background = 'rgba(255, 120, 0, 0.8)';
          spot.style.borderRadius = '50%';
          spot.style.border = '2px solid white';
          spot.style.cursor = 'pointer';
          spot.style.display = 'flex';
          spot.style.alignItems = 'center';
          spot.style.justifyContent = 'center';
          spot.style.color = 'white';
          spot.style.fontSize = '16px';
          spot.innerHTML = '📍';
          
          spot.title = hotspot.label;
          
          spot.addEventListener('click', () => {
            alert(`${hotspot.label}: ${hotspot.description || 'No description'}`);
          });

          viewer.appendChild(spot);
        });
      }

    } catch (error) {
      console.error('Failed to initialize 360 viewer:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanup360Viewer = () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev * 0.8));
  };

  const handleReset = () => {
    setZoom(1);
    if (containerRef.current?.firstChild) {
      (containerRef.current.firstChild as HTMLElement).style.transform = 'none';
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/room/${roomId}/tour`;
    navigator.clipboard.writeText(url);
    alert('Tour link copied to clipboard!');
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!tourData?.sources) return;
    
    if (direction === 'prev') {
      setCurrentIndex((prev) => 
        prev > 0 ? prev - 1 : tourData.sources.length - 1
      );
    } else {
      setCurrentIndex((prev) => 
        prev < tourData.sources.length - 1 ? prev + 1 : 0
      );
    }
  };

  const renderTourContent = () => {
    if (!tourData) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          <ThreeSixtyIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6">No virtual tour available</Typography>
          <Typography variant="body2">
            Virtual tour will be available soon for this room
          </Typography>
        </Box>
      );
    }

    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%' 
        }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (tourData.type) {
      case '360':
        return (
          <Box
            ref={containerRef}
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#000'
            }}
          />
        );

      case 'video':
        return (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <video
              ref={videoRef}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={tourData.sources[currentIndex]?.url}
              onLoadedData={() => setLoading(false)}
            />
          </Box>
        );

      case 'gallery':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <img
              src={tourData.sources[currentIndex]?.url}
              alt={tourData.sources[currentIndex]?.title || 'Room view'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom})`
              }}
              onLoad={() => setLoading(false)}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '90vw',
          height: '80vh',
          maxWidth: '1400px',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#800000',
        color: 'white',
        py: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">{roomName} - Virtual Tour</Typography>
          {tourData?.sources && tourData.sources.length > 1 && (
            <Chip
              label={`${currentIndex + 1} / ${tourData.sources.length}`}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isSaved ? "Remove from saved" : "Save room"}>
            <IconButton
              onClick={() => onSaveRoom?.(roomId)}
              sx={{ color: 'white' }}
            >
              {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Share tour">
            <IconButton onClick={handleShare} sx={{ color: 'white' }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton onClick={handleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', backgroundColor: '#f5f5f5' }}>
        {/* Main viewing area */}
        <Box sx={{ 
          height: 'calc(100% - 60px)',
          position: 'relative'
        }}>
          {viewMode === 'tour' ? (
            renderTourContent()
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={tourData?.floorPlan || '/placeholder-floorplan.png'}
                alt="Floor plan"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}

          {/* Navigation controls */}
          {tourData?.sources && tourData.sources.length > 1 && (
            <>
              <Fab
                size="small"
                onClick={() => handleNavigate('prev')}
                sx={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(128, 0, 0, 0.9)',
                  color: 'white',
                  '&:hover': { backgroundColor: '#800000' }
                }}
              >
                <NavigateBeforeIcon />
              </Fab>
              
              <Fab
                size="small"
                onClick={() => handleNavigate('next')}
                sx={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(128, 0, 0, 0.9)',
                  color: 'white',
                  '&:hover': { backgroundColor: '#800000' }
                }}
              >
                <NavigateNextIcon />
              </Fab>
            </>
          )}

          {/* Zoom controls */}
          {tourData?.type !== 'video' && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                p: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <Tooltip title="Zoom in" placement="left">
                <IconButton size="small" onClick={handleZoomIn}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset" placement="left">
                <IconButton size="small" onClick={handleReset}>
                  <ResetIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Zoom out" placement="left">
                <IconButton size="small" onClick={handleZoomOut}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
            </Paper>
          )}

          {/* Info panel */}
          {tourData?.sources[currentIndex]?.description && (
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                maxWidth: 300,
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {tourData.sources[currentIndex].title || `View ${currentIndex + 1}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tourData.sources[currentIndex].description}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Bottom toolbar */}
        <Box sx={{ 
          height: 60, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          px: 2
        }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={tourData?.type === '360' ? <ThreeSixtyIcon /> : 
                       tourData?.type === 'video' ? <VideocamIcon /> :
                       <PhotoCameraIcon />}
              variant={viewMode === 'tour' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('tour')}
            >
              Virtual Tour
            </Button>
            <Button
              startIcon={<InfoIcon />}
              variant={viewMode === 'floorplan' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('floorplan')}
              disabled={!tourData?.floorPlan}
            >
              Floor Plan
            </Button>
          </ButtonGroup>

          {/* View thumbnails */}
          {tourData?.sources && tourData.sources.length > 1 && (
            <Stack direction="row" spacing={1}>
              {tourData.sources.map((source, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: currentIndex === index ? 2 : 1,
                    borderColor: currentIndex === index ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    opacity: currentIndex === index ? 1 : 0.7,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <img
                    src={source.url}
                    alt={`View ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTour;
