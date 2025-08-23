#!/usr/bin/env python3
"""
Test script for the Video Length API
"""

import requests
import json
import sys
import os

def test_health_endpoint(api_url):
    """Test the health endpoint"""
    try:
        response = requests.get(f"{api_url}/health")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"Health response: {response.json()}")
            return True
        else:
            print(f"Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"Health check error: {e}")
        return False

def test_analyze_video_endpoint(api_url, api_key, video_uri):
    """Test the analyze video endpoint"""
    try:
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        data = {
            "video_uri": video_uri
        }
        
        print(f"Testing analyze video endpoint with video URI: {video_uri}")
        response = requests.post(f"{api_url}/analyze_video", headers=headers, json=data)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"Duration: {result.get('duration')}")
        else:
            print("❌ Failed!")
            print(f"Error: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Error testing analyze video endpoint: {e}")
        return False

def main():
    """Main test function"""
    if len(sys.argv) < 4:
        print("Usage: python test_api.py <api_url> <api_key> <video_uri>")
        print("Example: python test_api.py https://gateway-url.com abc123 gs://bucket/video.mp4")
        sys.exit(1)
    
    api_url = sys.argv[1].rstrip('/')
    api_key = sys.argv[2]
    gcs_uri = sys.argv[3]
    
    print("🧪 Testing Video Length API")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    health_ok = test_health_endpoint(api_url)
    
    if not health_ok:
        print("❌ Health check failed. Service may not be ready.")
        sys.exit(1)
    
    # Test analyze video endpoint
    print("\n2. Testing analyze video endpoint...")
    video_ok = test_analyze_video_endpoint(api_url, api_key, gcs_uri)
    
    # Summary
    print("\n" + "=" * 50)
    if health_ok and video_ok:
        print("🎉 All tests passed!")
    else:
        print("❌ Some tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main() 