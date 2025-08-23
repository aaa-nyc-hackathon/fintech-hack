import os
import json
import subprocess
import tempfile
from urllib.parse import urlparse
import cv2
from google.cloud import storage
from flask import Flask, request, jsonify
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def require_api_key(f):
    """Decorator to require API key authentication"""
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('x-api-key')
        if not api_key or api_key != os.environ.get('API_KEY'):
            return jsonify({'error': 'Invalid or missing API key'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def validate_gcs_uri(gcs_uri):
    """Validate GCS URI format"""
    try:
        parsed = urlparse(gcs_uri)
        if parsed.scheme != 'gs':
            return False, "Invalid scheme. Must be 'gs://'"
        if not parsed.netloc or not parsed.path:
            return False, "Invalid GCS URI format"
        return True, None
    except Exception as e:
        return False, f"Error parsing GCS URI: {str(e)}"

def download_video_from_gcs(gcs_uri):
    """Download video from GCS to temporary file"""
    try:
        # Parse GCS URI
        parsed = urlparse(gcs_uri)
        bucket_name = parsed.netloc
        blob_name = parsed.path.lstrip('/')
        
        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        # Check if file exists
        if not blob.exists():
            return None, "Video file not found in GCS"
        
        # Get file metadata
        blob.reload()
        file_size = blob.size
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_path = temp_file.name
        temp_file.close()
        
        # Download file
        blob.download_to_filename(temp_path)
        
        return temp_path, file_size
        
    except Exception as e:
        logger.error(f"Error downloading from GCS: {str(e)}")
        return None, f"Error downloading file: {str(e)}"

def get_video_length_ffmpeg(video_path):
    """Get video length using FFmpeg"""
    try:
        # Use FFmpeg to get video duration
        cmd = [
            'ffprobe', 
            '-v', 'quiet', 
            '-show_entries', 'format=duration', 
            '-of', 'csv=p=0', 
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        duration_seconds = float(result.stdout.strip())
        
        return duration_seconds, None
        
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error: {e.stderr}")
        return None, f"FFmpeg error: {e.stderr}"
    except Exception as e:
        logger.error(f"Error getting video length: {str(e)}")
        return None, f"Error getting video length: {str(e)}"

def get_video_length_opencv(video_path):
    """Get video length using OpenCV as fallback"""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None, "Could not open video file with OpenCV"
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if fps > 0 and frame_count > 0:
            duration_seconds = frame_count / fps
            cap.release()
            return duration_seconds, None
        else:
            cap.release()
            return None, "Could not determine video properties"
            
    except Exception as e:
        logger.error(f"OpenCV error: {str(e)}")
        return None, f"OpenCV error: {str(e)}"

def format_duration(seconds):
    """Format duration in HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@app.route('/analyze_video', methods=['POST'])
@require_api_key
def analyze_video():
    """Main endpoint to analyze video and get duration"""
    try:
        # Parse request
        data = request.get_json()
        if not data or 'video_uri' not in data:
            return jsonify({'error': 'Missing video_uri in request body'}), 400
        
        video_uri = data['video_uri']
        
        # Validate GCS URI
        is_valid, error_msg = validate_gcs_uri(video_uri)
        if not is_valid:
            return jsonify({'error': 'Invalid video URI format'}), 400
        
        # Download video from GCS
        temp_path, file_size = download_video_from_gcs(video_uri)
        if temp_path is None:
            return jsonify({'error': 'Video file not found'}), 404
        
        # Check if file is actually a video file
        file_extension = os.path.splitext(video_uri.lower())[1]
        if file_extension not in ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']:
            return jsonify({
                'error': 'File is not a supported video format',
                'details': f"File extension '{file_extension}' is not supported. Please use MP4, AVI, MOV, MKV, WMV, FLV, or WebM files."
            }), 400
        
        try:
            # Try FFmpeg first (more reliable)
            duration_seconds, error_msg = get_video_length_ffmpeg(temp_path)
            
            # Fallback to OpenCV if FFmpeg fails
            if duration_seconds is None:
                logger.warning(f"FFmpeg failed, trying OpenCV: {error_msg}")
                duration_seconds, error_msg = get_video_length_opencv(temp_path)
                
                if duration_seconds is None:
                    return jsonify({
                        'error': 'Could not determine video length',
                        'details': f"FFmpeg error: {error_msg}",
                        'file_size': format_file_size(file_size) if file_size else 'Unknown'
                    }), 500
            
            # Format response - just duration as string
            response = {
                'duration': f"{round(duration_seconds, 2)} seconds"
            }
            
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Could not delete temporary file {temp_path}: {e}")
                
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=False) 