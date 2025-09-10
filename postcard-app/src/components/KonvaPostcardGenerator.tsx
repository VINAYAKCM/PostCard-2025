import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Image, Text, Line, Rect } from 'react-konva';
import Konva from 'konva';

interface KonvaPostcardGeneratorProps {
  recipientName: string;
  message: string;
  handle: string;
  postcardBackgroundColor: string;
  stampImageUrl?: string;
  profileImageUrl?: string;
  backsideImageUrl?: string;
  onImageGenerated: (dataUrl: string) => void;
  scale?: number;
  quality?: number;
}

const KonvaPostcardGenerator: React.FC<KonvaPostcardGeneratorProps> = ({
  recipientName,
  message,
  handle,
  postcardBackgroundColor,
  stampImageUrl,
  profileImageUrl,
  backsideImageUrl,
  onImageGenerated,
  scale = 4,
  quality = 1.0
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stampImage, setStampImage] = React.useState<HTMLImageElement | null>(null);
  const [profileImage, setProfileImage] = React.useState<HTMLImageElement | null>(null);
  const [backsideImage, setBacksideImage] = React.useState<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = React.useState(false);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = [];

      if (stampImageUrl) {
        const stampImg = new window.Image();
        stampImg.crossOrigin = 'anonymous';
        imagePromises.push(
          new Promise<void>((resolve) => {
            stampImg.onload = () => {
              setStampImage(stampImg);
              resolve();
            };
            stampImg.onerror = () => resolve();
            stampImg.src = stampImageUrl;
          })
        );
      }

      if (profileImageUrl) {
        const profileImg = new window.Image();
        profileImg.crossOrigin = 'anonymous';
        imagePromises.push(
          new Promise<void>((resolve) => {
            profileImg.onload = () => {
              setProfileImage(profileImg);
              resolve();
            };
            profileImg.onerror = () => resolve();
            profileImg.src = profileImageUrl;
          })
        );
      }

      if (backsideImageUrl) {
        const backsideImg = new window.Image();
        backsideImg.crossOrigin = 'anonymous';
        imagePromises.push(
          new Promise<void>((resolve) => {
            backsideImg.onload = () => {
              setBacksideImage(backsideImg);
              resolve();
            };
            backsideImg.onerror = () => resolve();
            backsideImg.src = backsideImageUrl;
          })
        );
      }

      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };

    loadImages();
  }, [stampImageUrl, profileImageUrl, backsideImageUrl]);

  // Generate image when ready
  useEffect(() => {
    if (imagesLoaded && stageRef.current) {
      const stage = stageRef.current;
      const dataUrl = stage.toDataURL({
        mimeType: 'image/png',
        quality: quality,
        pixelRatio: scale
      });
      onImageGenerated(dataUrl);
    }
  }, [imagesLoaded, onImageGenerated, quality, scale]);

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = getTextWidth(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Helper function to get text width
  const getTextWidth = (text: string, fontSize: number) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = `${fontSize}px SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
    return context.measureText(text).width;
  };

  // Calculate stamp dimensions maintaining aspect ratio
  const getStampDimensions = (img: HTMLImageElement) => {
    const maxWidth = 80;
    const maxHeight = 60;
    const aspectRatio = img.width / img.height;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width, height };
  };

  // Calculate profile image dimensions maintaining aspect ratio
  const getProfileDimensions = (img: HTMLImageElement) => {
    const maxWidth = 60;
    const maxHeight = 60;
    const aspectRatio = img.width / img.height;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width, height };
  };

  // Calculate backside image dimensions maintaining aspect ratio
  const getBacksideDimensions = (img: HTMLImageElement) => {
    const containerWidth = 512;
    const containerHeight = 347;
    const aspectRatio = img.width / img.height;
    
    let width = containerWidth;
    let height = containerWidth / aspectRatio;
    
    if (height > containerHeight) {
      height = containerHeight;
      width = containerHeight * aspectRatio;
    }
    
    return { width, height };
  };

  const messageLines = wrapText(message, 180, 14);

  return (
    <div style={{ display: 'none' }}>
      <Stage
        ref={stageRef}
        width={512}
        height={694}
        scaleX={1}
        scaleY={1}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={512}
            height={694}
            fill={postcardBackgroundColor}
            cornerRadius={20}
            shadowColor="rgba(0, 0, 0, 0.08)"
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 4 }}
          />

          {/* Front Side */}
          <Rect
            x={0}
            y={0}
            width={512}
            height={347}
            fill={postcardBackgroundColor}
            cornerRadius={[20, 20, 0, 0]}
          />

          {/* Vertical Separator Line */}
          <Line
            points={[256, 23.5, 256, 323.5]}
            stroke="rgba(170, 170, 170, 0.16)"
            strokeWidth={2}
          />

          {/* Greeting Text */}
          <Text
            x={30}
            y={30}
            text={`Hey ${recipientName ? `${recipientName},` : ','}`}
            fontSize={16}
            fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
            fontStyle="bold"
            fill="#000000"
          />

          {/* Message Text */}
          {messageLines.map((line, index) => (
            <Text
              key={index}
              x={30}
              y={60 + (index * 20)}
              text={line}
              fontSize={14}
              fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
              fill="#000000"
            />
          ))}

          {/* Closing Text */}
          <Text
            x={30}
            y={300}
            text={`Sincerely, @${handle || 'handle'}`}
            fontSize={14}
            fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
            fill="#000000"
          />

          {/* Stamp Image */}
          {stampImage ? (
            <Image
              image={stampImage}
              x={512 - 100}
              y={25}
              {...getStampDimensions(stampImage)}
              rotation={-5.96}
              offsetX={getStampDimensions(stampImage).width / 2}
              offsetY={getStampDimensions(stampImage).height / 2}
            />
          ) : (
            // Default stamp placeholder
            <Rect
              x={512 - 100}
              y={25}
              width={80}
              height={60}
              fill="#f0f0f0"
              stroke="#ccc"
              strokeWidth={1}
              rotation={-5.96}
              offsetX={40}
              offsetY={30}
            />
          )}

          {/* Profile Image */}
          {profileImage && (
            <Image
              image={profileImage}
              x={512 - 80}
              y={280}
              {...getProfileDimensions(profileImage)}
            />
          )}

          {/* Back Side */}
          <Rect
            x={0}
            y={347}
            width={512}
            height={347}
            fill={postcardBackgroundColor}
            cornerRadius={[0, 0, 20, 20]}
          />

          {/* Backside Image */}
          {backsideImage && (
            <Image
              image={backsideImage}
              x={(512 - getBacksideDimensions(backsideImage).width) / 2}
              y={347 + (347 - getBacksideDimensions(backsideImage).height) / 2}
              {...getBacksideDimensions(backsideImage)}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaPostcardGenerator;
