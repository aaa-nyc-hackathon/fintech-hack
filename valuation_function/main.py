import functions_framework
import os
import json

from grounding import download_file, call_anthropic, process_json_response, ValuationResponse

@functions_framework.http
def valuation_function(request):
    """
    HTTP Cloud Function that provides valuation research capabilities.
    This function requires API key authentication via x-api-key header.
    """

    # Check API key authentication
    api_key = request.headers.get('x-api-key')
    expected_api_key = os.environ.get('API_KEY')
    
    if not api_key or api_key != expected_api_key:
        return json.dumps({'error': 'Invalid or missing API key'}), 401, {'Content-Type': 'application/json'}

    if request.method != 'POST':
        return 'Only POST requests are accepted', 405

    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'gcs_uri' not in request_json:
            return 'Invalid request. Missing "gcs_uri" in JSON body.', 400

        gcs_uri = request_json['gcs_uri']
        # Log the request for debugging
        print(f"Processing valuation request for: {gcs_uri}")

        # handle all the stuff...

    except Exception as e:
        print(f"An unexpected error occurred in the valuation function: {str(e)!r}")
        error_details = {
            "error_message": str(e)
        }
        return (json.dumps(error_details), 500, {'Content-Type': 'application/json'}) 