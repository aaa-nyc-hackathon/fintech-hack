from google.cloud import storage
import sys
from scale import upscale_image

def download_public_file(bucket_name, source_blob_name, destination_file_name):
    """Downloads a public blob from the bucket."""
    # bucket_name = "your-bucket-name"
    # source_blob_name = "storage-object-name"
    # destination_file_name = "local/path/to/file"

    storage_client = storage.Client.create_anonymous_client()

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)
    upscale_image(destination_file_name, f"{destination_file_name.split(".")[0]}-scaled.{destination_file_name.split(".")[1]}")

    print(
        "Downloaded public blob {} from bucket {} to {}.".format(
            source_blob_name, bucket.name, destination_file_name
        )
    )

if __name__ == "__main__":
    bucket_name = sys.argv[1]
    source_blob_name = sys.argv[2]
    destination_file_name = sys.argv[3]
    download_public_file(bucket_name, source_blob_name, destination_file_name)
