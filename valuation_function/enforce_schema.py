import os
from pydantic import BaseModel, Field
from typing import List
from langchain_groq import ChatGroq
from trustcall import create_extractor


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
    sources: List[ValuationSource] = Field(description="List of sources and references used for the valuation")
    query: str = Field(description="The original query or question that prompted this valuation")


class ExtractorLLM:
    """
    A class that leverages the Trustcall library to create structured LLM
    responses which extract data from unstructured text, and format
     as a Pydantic model.
    """

    def __init__(self, model_name: str = "meta-llama/llama-4-maverick-17b-128e-instruct"):
        """
        Initialize the ExtractorLLM with Groq and Meta Llama model.

        Args:
            model_name (str): The name of the LLM model to use (default is Meta Llama Maverick).
        """
        self.model_name = model_name
        
        # Load GROQ API key from environment variable
        groq_api_key = os.environ.get('GROQ_API_KEY')
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.llm = ChatGroq(
            model=model_name,
            temperature=0.0,
            max_retries=2,
            groq_api_key=groq_api_key
        )


    def create_extraction_prompt(self, content: str, model_schema: BaseModel) -> str:
        """
        Create a prompt for extracting structured data from content.
        
        Args:
            content (str): The content to extract data from
            model_schema (BaseModel): The Pydantic model schema to extract into
            
        Returns:
            str: A formatted prompt for extraction
        """
        schema_json = model_schema.model_json_schema()
        return f"""Extract the following information from the content below and format it according to this JSON schema:

{schema_json}

Content to extract from:
{content}

Please extract and structure the data according to the schema above."""


    def complete(self, prompt: str, model_schema: BaseModel) -> BaseModel:
        """
        Call LLM to populate a Pydantic model schema with structured data.

        Args:
            prompt (str): The prompt to complete.
            model_schema (BaseModel): The Pydantic model schema definition for the response.

        Returns:
            BaseModel: An instance of the Pydantic model populated with the LLM's response.
        """
        bound = create_extractor(
            self.llm,
            tools=[model_schema],
            tool_choice="required",
        )
        result = bound.invoke(prompt)
        return result["responses"][0]


# Example usage and testing code
if __name__ == "__main__":
    # Dummy text data for testing
    dummy_content = """
    I found this amazing vintage Fender Stratocaster guitar at a local pawn shop. 
    It's in excellent condition - looks like it was barely played. The finish is 
    a beautiful sunburst color, and all the original hardware is intact. 
    According to the shop owner, it's from the early 1980s. I've seen similar 
    guitars selling online for around $2,500 to $3,000 in this condition. 
    There's a small article in Guitar World magazine that mentions these early 
    80s Strats are becoming collector's items. The guitar comes with its original 
    hard case, which is also in great shape. I'm thinking this could be worth 
    investing in for resale later.
    """
    
    try:
        # Initialize the extractor
        extractor = ExtractorLLM()
        
        # Create extraction prompt
        prompt = extractor.create_extraction_prompt(dummy_content, ValuationResponse)
        print("Generated Prompt:")
        print(prompt)
        print("\n" + "="*50 + "\n")
        
        # Extract structured data
        result = extractor.complete(prompt, ValuationResponse)
        print("Extracted Result:")
        print(result.model_dump_json(indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure GROQ_API_KEY environment variable is set") 