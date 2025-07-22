import os
import requests
from typing import Optional, Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class CanvasLMSClient:
    """Canvas LMS API client for interacting with Canvas REST API."""
    
    def __init__(self, api_key: Optional[str] = None, canvas_domain: Optional[str] = None):
        self.api_key = api_key or os.getenv('CANVAS_API_KEY')
        self.canvas_domain = canvas_domain or os.getenv('CANVAS_DOMAIN')
        
        if not self.api_key:
            raise ValueError('Canvas API key is required. Set CANVAS_API_KEY environment variable.')
        
        if not self.canvas_domain:
            raise ValueError('Canvas domain is required. Set CANVAS_DOMAIN environment variable.')
        
        # Ensure domain has proper format (https://domain.com)
        if not self.canvas_domain.startswith('http'):
            self.canvas_domain = f"https://{self.canvas_domain}"
        
        # Remove trailing slash if present
        self.canvas_domain = self.canvas_domain.rstrip('/')
        
        # Setup base configuration
        self.base_url = f"{self.canvas_domain}/api/v1"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        self.timeout = 30
    
    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None, 
                     data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Canvas API."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=data,
                timeout=self.timeout
            )
            
            # Check for successful response
            if response.status_code >= 200 and response.status_code < 300:
                return {
                    'success': True,
                    'data': response.json(),
                    'total_count': response.headers.get('X-Total-Count')
                }
            else:
                logger.error(f"Canvas API error {response.status_code}: {response.text}")
                return {
                    'success': False,
                    'error': response.json() if response.content else response.text,
                    'status': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Canvas API request failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status': 500
            }
    
    def smart_search(self, query: str, per_page: int = 20, search_type: Optional[str] = None,
                    context: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform a smart search across Canvas content.
        
        Args:
            query: The search query
            per_page: Results per page (default: 20)
            search_type: Content type filter (optional)
            context: Search context (optional)
            
        Returns:
            Dict containing search results or error information
        """
        params = {
            'q': query,
            'per_page': per_page
        }
        
        if search_type:
            params['type'] = search_type
        if context:
            params['context'] = context
        
        result = self._make_request('GET', '/search/recipients', params=params)
        
        if result['success']:
            result['query'] = query
        
        return result
    
    def get_students_in_course(self, course_id: str, enrollment_type: str = 'StudentEnrollment',
                             enrollment_state: str = 'active', per_page: int = 100,
                             include_avatar_url: bool = False, 
                             include_enrollments: bool = False) -> Dict[str, Any]:
        """
        Get students enrolled in a specific course.
        
        Args:
            course_id: The Canvas course ID
            enrollment_type: Filter by enrollment type (default: 'StudentEnrollment')
            enrollment_state: Filter by enrollment state (default: 'active')
            per_page: Results per page (default: 100)
            include_avatar_url: Include user avatar URLs
            include_enrollments: Include enrollment details
            
        Returns:
            Dict containing list of students or error information
        """
        params = {
            'enrollment_type': enrollment_type,
            'enrollment_state': enrollment_state,
            'per_page': per_page
        }
        
        # Add optional includes
        includes = []
        if include_avatar_url:
            includes.append('avatar_url')
        if include_enrollments:
            includes.append('enrollments')
        
        if includes:
            params['include[]'] = includes
        
        result = self._make_request('GET', f'/courses/{course_id}/users', params=params)
        
        if result['success']:
            result['course_id'] = course_id
        else:
            result['course_id'] = course_id
        
        return result
    
    def get_current_user(self) -> Dict[str, Any]:
        """
        Get current user profile.
        
        Returns:
            Dict containing current user information or error
        """
        return self._make_request('GET', '/users/self/profile')
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test Canvas API connectivity.
        
        Returns:
            Dict containing connection test results
        """
        result = self._make_request('GET', '/users/self')
        
        if result['success']:
            result['domain'] = self.canvas_domain
        else:
            result['domain'] = self.canvas_domain
        
        return result
    
    def get_courses(self, enrollment_type: Optional[str] = None, 
                   enrollment_state: str = 'active', per_page: int = 20) -> Dict[str, Any]:
        """
        Get courses for the current user.
        
        Args:
            enrollment_type: Filter by enrollment type (optional)
            enrollment_state: Filter by enrollment state (default: 'active')
            per_page: Results per page (default: 20)
            
        Returns:
            Dict containing list of courses or error information
        """
        params = {
            'enrollment_state': enrollment_state,
            'per_page': per_page
        }
        
        if enrollment_type:
            params['enrollment_type'] = enrollment_type
        
        return self._make_request('GET', '/courses', params=params)