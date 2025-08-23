import cv2
import numpy as np
import tempfile
import os
from ultralytics import YOLO
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class YOLOInference:
    """YOLO model inference for object detection and image cropping"""
    
    def __init__(self, model_path: str = 'yolov8n-seg.pt'):
        """Initialize YOLO model
        
        Args:
            model_path: Path to YOLO model file
        """
        try:
            self.model = YOLO(model_path)
            logger.info(f"YOLO model loaded successfully from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    
    def detect_and_crop(self, image_path: str, padding: int = 20, 
                       confidence_threshold: float = 0.5) -> List[Dict]:
        """Detect objects in image and return cropped images with metadata
        
        Args:
            image_path: Path to input image
            padding: Pixels to pad around bounding boxes
            confidence_threshold: Minimum confidence for detections
            
        Returns:
            List of dictionaries containing cropped image data and metadata
        """
        try:
            # Load image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            h, w = img.shape[:2]
            logger.info(f"Processing image: {w}x{h} pixels")
            
            # Run YOLO inference
            results = self.model(img, conf=confidence_threshold)
            result = results[0]  # Get first result
            
            # Extract detection information
            boxes = result.boxes.xyxy.cpu().numpy()  # Bounding boxes (x1, y1, x2, y2)
            classes = result.boxes.cls.cpu().numpy()  # Class IDs
            confidences = result.boxes.conf.cpu().numpy()  # Confidence scores
            class_names = result.names  # Class ID to name mapping
            
            logger.info(f"Detected {len(boxes)} objects")
            
            # Process each detection
            cropped_objects = []
            for i, (box, class_id, confidence) in enumerate(zip(boxes, classes, confidences)):
                try:
                    x1, y1, x2, y2 = map(int, box)
                    
                    # Add padding, ensuring coordinates stay within image bounds
                    x1_padded = max(0, x1 - padding)
                    y1_padded = max(0, y1 - padding)
                    x2_padded = min(w, x2 + padding)
                    y2_padded = min(h, y2 + padding)
                    
                    # Crop the image
                    cropped_img = img[y1_padded:y2_padded, x1_padded:x2_padded]
                    
                    # Get class information
                    category_id = int(class_id)
                    category_name = class_names[category_id]
                    
                    # Save cropped image to temporary file
                    temp_file = tempfile.NamedTemporaryFile(
                        delete=False, 
                        suffix=f'_{category_name}_{i}.png'
                    )
                    temp_path = temp_file.name
                    temp_file.close()
                    
                    # Save cropped image
                    cv2.imwrite(temp_path, cropped_img)
                    
                    # Create metadata
                    object_data = {
                        'object_id': i,
                        'category_id': category_id,
                        'category_name': category_name,
                        'confidence': float(confidence),
                        'bbox': {
                            'x1': x1,
                            'y1': y1,
                            'x2': x2,
                            'y2': y2,
                            'width': x2 - x1,
                            'height': y2 - y1
                        },
                        'padded_bbox': {
                            'x1': x1_padded,
                            'y1': y1_padded,
                            'x2': x2_padded,
                            'y2': y2_padded,
                            'width': x2_padded - x1_padded,
                            'height': y2_padded - y1_padded
                        },
                        'cropped_image_path': temp_path,
                        'cropped_image_size': {
                            'width': cropped_img.shape[1],
                            'height': cropped_img.shape[0]
                        }
                    }
                    
                    cropped_objects.append(object_data)
                    logger.info(f"Processed object {i}: {category_name} (confidence: {confidence:.3f})")
                    
                except Exception as e:
                    logger.error(f"Error processing object {i}: {e}")
                    continue
            
            return cropped_objects
            
        except Exception as e:
            logger.error(f"Error in detect_and_crop: {e}")
            raise
    
    def cleanup_temp_files(self, cropped_objects: List[Dict]):
        """Clean up temporary files created during inference
        
        Args:
            cropped_objects: List of object data from detect_and_crop
        """
        for obj in cropped_objects:
            try:
                temp_path = obj.get('cropped_image_path')
                if temp_path and os.path.exists(temp_path):
                    os.unlink(temp_path)
                    logger.debug(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Could not clean up temporary file: {e}")
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded YOLO model
        
        Returns:
            Dictionary containing model information
        """
        try:
            return {
                'model_path': self.model.ckpt_path if hasattr(self.model, 'ckpt_path') else 'Unknown',
                'model_type': type(self.model).__name__,
                'available_classes': list(self.model.names.values()) if hasattr(self.model, 'names') else []
            }
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {'error': str(e)}

# Convenience function for quick inference
def quick_detect(image_path: str, model_path: str = 'yolov8n-seg.pt', 
                padding: int = 20, confidence_threshold: float = 0.5) -> List[Dict]:
    """Quick detection function for simple use cases
    
    Args:
        image_path: Path to input image
        model_path: Path to YOLO model file
        padding: Pixels to pad around bounding boxes
        confidence_threshold: Minimum confidence for detections
        
    Returns:
        List of dictionaries containing cropped image data and metadata
    """
    yolo = YOLOInference(model_path)
    try:
        return yolo.detect_and_crop(image_path, padding, confidence_threshold)
    finally:
        # Clean up temporary files
        yolo.cleanup_temp_files([]) 