const axios = require('axios');

class CanvasLMSClient {
  constructor(apiKey, canvasDomain) {
    this.apiKey = apiKey || process.env.CANVAS_API_KEY;
    this.canvasDomain = canvasDomain || process.env.CANVAS_DOMAIN;
    
    if (!this.apiKey) {
      throw new Error('Canvas API key is required. Set CANVAS_API_KEY environment variable.');
    }
    
    if (!this.canvasDomain) {
      throw new Error('Canvas domain is required. Set CANVAS_DOMAIN environment variable.');
    }
    
    // Ensure domain has proper format (https://domain.com)
    if (!this.canvasDomain.startsWith('http')) {
      this.canvasDomain = `https://${this.canvasDomain}`;
    }
    
    // Remove trailing slash if present
    this.canvasDomain = this.canvasDomain.replace(/\/$/, '');
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: `${this.canvasDomain}/api/v1`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Perform a smart search across Canvas content
   * @param {string} query - The search query
   * @param {Object} options - Additional search options
   * @param {string} options.context - Search context (optional)
   * @param {number} options.per_page - Results per page (default: 20)
   * @param {string} options.type - Content type filter (optional)
   * @returns {Promise<Object>} Search results
   */
  async smartSearch(query, options = {}) {
    try {
      const params = {
        q: query,
        per_page: options.per_page || 20,
        ...options
      };
      
      const response = await this.client.get('/search/recipients', { params });
      return {
        success: true,
        data: response.data,
        total_count: response.headers['x-total-count'] || response.data.length
      };
    } catch (error) {
      console.error('Canvas Smart Search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Get students enrolled in a specific course
   * @param {string|number} courseId - The Canvas course ID
   * @param {Object} options - Additional options
   * @param {string} options.enrollment_type - Filter by enrollment type (default: 'StudentEnrollment')
   * @param {string} options.enrollment_state - Filter by enrollment state (default: 'active')
   * @param {number} options.per_page - Results per page (default: 100)
   * @param {boolean} options.include_avatar_url - Include user avatar URLs
   * @param {boolean} options.include_enrollments - Include enrollment details
   * @returns {Promise<Object>} List of students
   */
  async getStudentsInCourse(courseId, options = {}) {
    try {
      const params = {
        enrollment_type: options.enrollment_type || 'StudentEnrollment',
        enrollment_state: options.enrollment_state || 'active',
        per_page: options.per_page || 100,
        include: []
      };
      
      // Add optional includes
      if (options.include_avatar_url) {
        params.include.push('avatar_url');
      }
      if (options.include_enrollments) {
        params.include.push('enrollments');
      }
      
      // Convert include array to comma-separated string
      if (params.include.length > 0) {
        params.include = params.include.join(',');
      } else {
        delete params.include;
      }
      
      const response = await this.client.get(`/courses/${courseId}/users`, { params });
      
      return {
        success: true,
        data: response.data,
        course_id: courseId,
        total_count: response.headers['x-total-count'] || response.data.length
      };
    } catch (error) {
      console.error('Canvas Get Students error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        status: error.response?.status,
        course_id: courseId
      };
    }
  }

  /**
   * Test Canvas API connectivity
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection() {
    try {
      const response = await this.client.get('/users/self');
      return {
        success: true,
        user: response.data,
        domain: this.canvasDomain
      };
    } catch (error) {
      console.error('Canvas connection test error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        status: error.response?.status,
        domain: this.canvasDomain
      };
    }
  }

  /**
   * Get current user profile (useful for testing authentication)
   * @returns {Promise<Object>} Current user information
   */
  async getCurrentUser() {
    try {
      const response = await this.client.get('/users/self/profile');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Canvas Get Current User error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        status: error.response?.status
      };
    }
  }
}

module.exports = CanvasLMSClient;