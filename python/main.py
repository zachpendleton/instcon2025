from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, AsyncGenerator, Literal
import boto3
from botocore.exceptions import ClientError
import json
import logging
from canvas_client import CanvasLMSClient

# Setup logging
logging.basicConfig(level=logging.INFO)


app = FastAPI(title="Canvas LMS AI Workshop API", description="Sample API for AWS Bedrock integration")

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Initialize Canvas client
canvas_client = None
try:
    canvas_client = CanvasLMSClient()
    logging.info(f"Canvas client initialized for domain: {canvas_client.canvas_domain}")
except ValueError as e:
    logging.warning(f'Canvas client not initialized: {e}')
    logging.warning('Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables to enable Canvas integration.')

# Request/Response models
class CompletionRequest(BaseModel):
    message: str
    system: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 512
    model_id: Optional[str] = "us.amazon.nova-pro-v1:0"

class CompletionResponse(BaseModel):
    response: str
    model_id: str
    usage: dict

# Chat models
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 512
    model_id: Optional[str] = "us.amazon.nova-pro-v1:0"

class ChatResponse(BaseModel):
    response: str
    model_id: str
    usage: dict

# Tool models for Canvas LMS integration
class ToolRequest(BaseModel):
    messages: List[ChatMessage]
    system: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 512
    model_id: Optional[str] = "us.amazon.nova-pro-v1:0"

class ToolResponse(BaseModel):
    response: str
    model_id: str
    usage: dict
    tool_calls: Optional[List[dict]] = None


@app.post("/api/completions")
async def create_completion(request: CompletionRequest):
    try:
        # Prepare messages for Bedrock
        messages = [{"role": "user", "content": [{"text": request.message}]}]
        
        # Prepare system prompt if provided
        system_messages = []
        if request.system:
            system_messages = [{"text": request.system}]
        
        # Prepare inference configuration
        inference_config = {
            "temperature": request.temperature,
            "maxTokens": request.max_tokens
        }
        
        # Call Bedrock Converse API
        response = bedrock.converse(
            modelId=request.model_id,
            messages=messages,
            system=system_messages,
            inferenceConfig=inference_config
        )
        
        # Extract response text
        response_text = response['output']['message']['content'][0]['text']
        
        return CompletionResponse(
            response=response_text,
            model_id=request.model_id,
            usage=response['usage']
        )
        
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Bedrock error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/api/chats")
async def create_chat(request: ChatRequest):
    try:
        # Convert chat messages to Bedrock format
        bedrock_messages = []
        for msg in request.messages:
            bedrock_messages.append({
                "role": msg.role,
                "content": [{"text": msg.content}]
            })
        
        # Prepare system prompt if provided
        system_messages = []
        if request.system:
            system_messages = [{"text": request.system}]
        
        # Prepare inference configuration
        inference_config = {
            "temperature": request.temperature,
            "maxTokens": request.max_tokens
        }
        
        # Call Bedrock Converse API
        response = bedrock.converse(
            modelId=request.model_id,
            messages=bedrock_messages,
            system=system_messages,
            inferenceConfig=inference_config
        )
        
        # Extract response text
        response_text = response['output']['message']['content'][0]['text']
        
        return ChatResponse(
            response=response_text,
            model_id=request.model_id,
            usage=response['usage']
        )
        
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Bedrock error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/api/streaming/chats")
async def create_streaming_chat(request: ChatRequest):
    async def stream_response() -> AsyncGenerator[str, None]:
        try:
            # Convert chat messages to Bedrock format
            bedrock_messages = []
            for msg in request.messages:
                bedrock_messages.append({
                    "role": msg.role,
                    "content": [{"text": msg.content}]
                })
            
            # Prepare system prompt if provided
            system_messages = []
            if request.system:
                system_messages = [{"text": request.system}]
            
            # Prepare inference configuration
            inference_config = {
                "temperature": request.temperature,
                "maxTokens": request.max_tokens
            }
            
            # Call Bedrock Converse Stream API
            response = bedrock.converse_stream(
                modelId=request.model_id,
                messages=bedrock_messages,
                system=system_messages,
                inferenceConfig=inference_config
            )
            
            # Stream the response
            for event in response['stream']:
                if 'contentBlockDelta' in event:
                    delta = event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        # Send each chunk as Server-Sent Events format
                        yield f"data: {json.dumps({'text': delta['text']})}\n\n"
                elif 'messageStop' in event:
                    # Send final event to indicate stream completion
                    yield f"data: {json.dumps({'done': True, 'usage': event['messageStop'].get('stopReason', {})})}\n\n"
                    break
                    
        except ClientError as e:
            yield f"data: {json.dumps({'error': f'Bedrock error: {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Unexpected error: {str(e)}'})}\n\n"
    
    return StreamingResponse(
        stream_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

# Canvas LMS API endpoints

@app.get("/api/canvas/search")
async def canvas_search(
    q: str = Query(..., description="Search query"),
    per_page: int = Query(20, description="Results per page"),
    type: Optional[str] = Query(None, description="Content type filter"),
    context: Optional[str] = Query(None, description="Search context")
):
    """Smart search across Canvas content."""
    if not canvas_client:
        raise HTTPException(
            status_code=503,
            detail="Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables."
        )
    
    try:
        result = canvas_client.smart_search(
            query=q,
            per_page=per_page,
            search_type=type,
            context=context
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=result.get('status', 500),
                detail=result['error']
            )
    except Exception as e:
        logging.error(f"Canvas search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/canvas/courses/{course_id}/students")
async def canvas_get_students(
    course_id: str,
    enrollment_type: str = Query("StudentEnrollment", description="Enrollment type filter"),
    enrollment_state: str = Query("active", description="Enrollment state filter"),
    per_page: int = Query(100, description="Results per page"),
    include_avatar_url: bool = Query(False, description="Include user avatar URLs"),
    include_enrollments: bool = Query(False, description="Include enrollment details")
):
    """Get students enrolled in a specific course."""
    if not canvas_client:
        raise HTTPException(
            status_code=503,
            detail="Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables."
        )
    
    try:
        result = canvas_client.get_students_in_course(
            course_id=course_id,
            enrollment_type=enrollment_type,
            enrollment_state=enrollment_state,
            per_page=per_page,
            include_avatar_url=include_avatar_url,
            include_enrollments=include_enrollments
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=result.get('status', 500),
                detail=result['error']
            )
    except Exception as e:
        logging.error(f"Canvas get students error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/canvas/user")
async def canvas_get_user():
    """Get current Canvas user profile."""
    if not canvas_client:
        raise HTTPException(
            status_code=503,
            detail="Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables."
        )
    
    try:
        result = canvas_client.get_current_user()
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=result.get('status', 500),
                detail=result['error']
            )
    except Exception as e:
        logging.error(f"Canvas get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/canvas/courses")
async def canvas_get_courses(
    enrollment_type: Optional[str] = Query(None, description="Enrollment type filter"),
    enrollment_state: str = Query("active", description="Enrollment state filter"),
    per_page: int = Query(20, description="Results per page")
):
    """Get courses for the current user."""
    if not canvas_client:
        raise HTTPException(
            status_code=503,
            detail="Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables."
        )
    
    try:
        result = canvas_client.get_courses(
            enrollment_type=enrollment_type,
            enrollment_state=enrollment_state,
            per_page=per_page
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=result.get('status', 500),
                detail=result['error']
            )
    except Exception as e:
        logging.error(f"Canvas get courses error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/canvas/test")
async def canvas_test():
    """Test Canvas connectivity."""
    if not canvas_client:
        return {
            "canvas_connected": False,
            "error": "Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables."
        }
    
    try:
        result = canvas_client.test_connection()
        
        if result['success']:
            return {**result, "canvas_connected": True}
        else:
            return {**result, "canvas_connected": False}
    except Exception as e:
        logging.error(f"Canvas connection test error: {e}")
        return {
            "canvas_connected": False,
            "error": str(e)
        }

@app.get("/api/health")
async def health():
    try:
        # Test Bedrock connectivity with a simple request
        test_response = bedrock.converse(
            modelId="us.amazon.nova-pro-v1:0",
            messages=[{"role": "user", "content": [{"text": "Hello"}]}],
            inferenceConfig={"maxTokens": 10}
        )
        return {"status": "ok", "bedrock_connected": True}
    except Exception as e:
        return {"status": "degraded", "bedrock_connected": False, "error": str(e)}


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
