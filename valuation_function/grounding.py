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

from pydantic import BaseModel, Field



SEARCH_PROMPT = "Formulate a search query of what is in the above image so that I can search it on the web. Give me prices for similar items on the web."
OUTPUT_FILE = "Analyze this feedback and output in JSON format with search query: \“query\” and reasoning: \“reasoning\". The JSON schema is as follows: {\"name\": \"string\", \"condition\": \"string\", \"marketvalue\": number, \"image\": \"string\", \"sources\": [{\"title\": \"string\", \"url\": \"string\", \"snippet\": \"string\", \"lowPrice\": \"int\", \"highPrice\": \"int\"}]}. Ensure the output is valid JSON."

DEFAULT_BUCKET = "finteck-hackathon"
DEFAULT_IMAGE = "2025FlatironLounge00092_HERO.jpg"

class ValuationSource(BaseModel):
    """Schema for a valuation source/article"""
    title: str = Field(description="The title or headline of the source article or reference")
    url: str = Field(description="The URL link to the source article or reference")
    snippet: str = Field(description="A brief excerpt or summary from the source article")


class ValuationResponse(BaseModel):
    """Schema for the valuation response containing item details and market analysis"""
    name: str = Field(description="The name or description of the item being valued")
    condition: str = Field(description="The condition of the item (e.g., 'like new', 'good', 'fair', 'poor')")
    marketvalue: int = Field(description="The estimated market value of the item in dollars")
    image: str = Field(description="URL or path to an image of the item (empty string if no image available)")
    sources: list[ValuationSource] = Field(description="List of sources and references used for the valuation")
    query: str = Field(description="The original query or question that prompted this valuation")


A_API_KEY = os.getenv("A_API_KEY")
BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")

def image_to_base64(image_path):
    with open(image_path, "rb") as img:
        return base64.b64encode(img.read()).decode("utf-8")

# vide the actual implementation for now
def download_file(bucket_n_source_blob_name: str, dest_filename: str, client: storage.Client) -> None:
    # TODO: add error handling, add logging, add retry mechanism, factory pattern for different cloud providers
    """ downloads a file from gcs """
    assert bucket_n_source_blob_name.endswith(('.jpg', '.jpeg', '.png')), "only jpg/jpeg images are supported"
    bucket_n_source_blob_name = bucket_n_source_blob_name.lstrip('gs://')
    bucket_name, source_blob_name = bucket_n_source_blob_name.split('/', 1)
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(dest_filename)

def call_anthropic(local_image_file: str) -> str:
    """ placeholder for calling anthropic api """
    assert local_image_file.endswith(('.jpg', '.jpeg', '.png')), "only jpg/jpeg and png images are supported"
    # get the image format jpeg or png
    client = anthropic.Anthropic(
        api_key=A_API_KEY,
    )
    base64_image = image_to_base64(local_image_file)
    image_media_type = "image/jpeg"  # or "image/png" based on your image type
    if local_image_file.endswith('.png'):
        image_media_type = "image/png"

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
      response_format={"type": "json_object", "schema": ValuationResponse.model_json_schema()},
      model="brave",
      stream=False,
    )
    return completions

