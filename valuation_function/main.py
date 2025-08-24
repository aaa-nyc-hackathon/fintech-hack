import functions_framework
import os
import json

from google.cloud import storage

from grounding import download_file, call_anthropic, process_json_response, ValuationResponse

@functions_framework.http
def valuation_function(request):
    """
    HTTP Cloud Function that provides valuation research capabilities.
    This function requires API key authentication via x-api-key header.
    """
    if request.method == "OPTIONS":
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {"Access-Control-Allow-Origin": "*"}

    # Check API key authentication from request body
    request_json = request.get_json(silent=True)
    if not request_json:
        return 'Invalid request. Missing JSON body.', 400
    
    api_key = request_json.get('api_key')
    expected_api_key = os.environ.get('API_KEY')
    
    if not api_key or api_key != expected_api_key:
        return json.dumps({'error': 'Invalid or missing API key'}), 401, {'Content-Type': 'application/json'}

    if request.method != 'POST':
        return 'Only POST requests are accepted', 405

    try:
        # request_json already parsed above for API key validation
        if 'gcs_uri' not in request_json:
            return 'Invalid request. Missing "gcs_uri" in JSON body.', 400

        gcs_uri = request_json['gcs_uri']
        # Log the request for debugging
        client = storage.Client()
        # NOTE: gcloud handles url encoding
        #cloud_image_file = "0c803398-processed-images/potted plant/frame_000004_object_004.png"
        source_file_extension = gcs_uri.split('.')[-1] # get the file extension
        local_image_file = "/tmp/local_image"  + '.' + source_file_extension
        print(f"Downloading image from GCS URI: {gcs_uri} to local file: {local_image_file}")
        download_file(gcs_uri, local_image_file, client)
        print(f"Downloaded image to {local_image_file}")
        stuff = call_anthropic(local_image_file)
        print("Received response from Anthropic...")
        print(stuff)
        results = process_json_response(stuff)
        print("process results done...")
        # now do something with the results, search via brave search api
        print(results)
        # results["sources"].extend(serp) if serp is not None else []
        output = {
            "name": "foo",
            "condition": "like new",
            "marketvalue": 1000,
            "image": "",
            "sources": [
                {"title": "Some Article",
                 "url": "https://example.com/article",
                 "snippet": "This is a snippet from the article."
                 }
                ],
            "query": "What is the market value of a like new foo?"
        }
        # now we need to merge results into output
        estimated_prices = [source.get("lowPrice", 0) for source in results.get("sources", []) if source.get("lowPrice") is not None]
        estimated_prices.extend([source.get("highPrice", 0) for source in results.get("sources", []) if source.get("highPrice") is not None])
        output["name"] = results.get("name", "unknown")
        output["condition"] = results.get("condition", "unknown")
        output["marketvalue"] = sum(estimated_prices) / len(estimated_prices) if len(estimated_prices) > 0 else -1
        output["image"] = gcs_uri
        output["sources"] = results.get("sources", [])
        output["query"] = results.get("query", "unknown")
        output["reasoning"] = results.get("reasoning", "unknown")

        # scratch code to format the serp
        # print(serp.choices[0].message.content)

        print(f"Processing valuation request for: {gcs_uri}")

        # handle all the stuff...
    except Exception as e:
        print(f"An unexpected error occurred in the valuation function: {str(e)!r}")
        error_details = {
            "error_message": str(e)
        }
        return (json.dumps(error_details), 500, {'Content-Type': 'application/json'})
    # regular return
    return (output, 200, headers)