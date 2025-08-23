""" grounding module

    This module does a reverse grounding procedure.
    Given the image we generate some text and take the text
    to generate a search query. The search results are the
    items of grounding but the generation happens beforehand
    so this is a reverse grounding procedure. Just a term I
    heard from Maye Dupp my friend who is also an AI researcher.
"""
import os
from google.cloud import storage
from openai import OpenAI

import anthropic
import base64
import json


SEARCH_PROMPT = "Formulate a search query of what is in the above image so that I can search it on the web. Give me prices for similar items on the web."

OUTPUT_FILE = "Analyze this feedback and output in JSON format with search query: \“query\” and reasoning: \“reasoning\". The JSON schema is as follows: {\"name\": \"string\", \"condition\": \"string\", \"marketvalue\": number, \"image\": \"string\", \"sources\": [{\"title\": \"string\", \"url\": \"string\", \"snippet\": \"string\", \"lowPrice\": \"int\", \"highPrice\": \"int\"}]}. Ensure the output is valid JSON."

DEFAULT_BUCKET = "finteck-hackathon"
DEFAULT_IMAGE = "2025FlatironLounge00092_HERO.jpg"



ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY")
BRAVE_SEARCH_API_KEY = os.environ.get("BRAVE_SEARCH_API_KEY")

def image_to_base64(image_path):
    with open(image_path, "rb") as img:
        return base64.b64encode(img.read()).decode("utf-8")

# vide the actual implementation for now
def download_file(bucket_name: str, source_blob_name: str, dest_filename: str, client: storage.Client) -> None:
    # TODO: add error handling, add logging, add retry mechanism, factory pattern for different cloud providers
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(dest_filename)

def call_anthropic(local_image_file: str) -> str:
    """ placeholder for calling anthropic api """
    assert local_image_file.endswith(('.jpg', '.jpeg', '.png')), "only jpg/jpeg images are supported"
    client = anthropic.Anthropic(
        api_key=ANTHROPIC_API_KEY,
    )
    base64_image = image_to_base64(local_image_file)
    image_media_type = "image/jpeg"  # or "image/png" based on your image type
    message = client.messages.create(
        model="claude-opus-4-1-20250805",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": image_media_type,
                            "data": base64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": SEARCH_PROMPT + "\n" + OUTPUT_FILE,
                    }
                ],
            }
        ],
    )
    return message.content[0].text

def process_json_response(stuff: str) -> dict:
    """ process the json response from anthropic """
    start = stuff.find('{')
    end = stuff.rfind('}') + 1
    json_string = stuff[start:end]
    try:
        data = json.loads(json_string)
        return data
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return {}

def brave_search(query: str) -> dict:
    """ search via brave search api """
    client = OpenAI(
        api_key=BRAVE_SEARCH_API_KEY,
        base_url="https://api.search.brave.com/res/v1",
    )
    completions = client.chat.completions.create(
      messages=[
        {
          "role": "user",
          "content": query,
        }
      ],
      model="brave",
      stream=False,
    )
    return completions

def main():
    pass

