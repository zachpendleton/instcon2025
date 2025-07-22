import React, { useState, useEffect } from 'react';
import { 
  View, 
  Heading, 
  TextInput,
  Button, 
  Text,
  Alert,
  Spinner,
  Link,
  List,
  Select,
  Tabs
} from '@instructure/ui';

const CanvasCoursesPage = () => {
  const [courses, setCourses] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8000/api/canvas/courses');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8000/api/canvas/user');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId) => {
    if (!courseId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const url = new URL(`http://localhost:8000/api/canvas/courses/${courseId}/students`);
      url.searchParams.append('include_avatar_url', 'true');

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8000/api/canvas/test');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'user') {
      fetchCurrentUser();
    }
  }, [activeTab]);

  const renderCoursesList = () => {
    if (!courses) return null;

    if (!courses.success) {
      return (
        <Alert variant="warning">
          Canvas integration not configured or failed to load courses.
        </Alert>
      );
    }

    if (!Array.isArray(courses.data) || courses.data.length === 0) {
      return <Text>No courses found.</Text>;
    }

    return (
      <View>
        <List variant="unstyled">
          {courses.data.map((course, index) => (
            <List.Item key={index} margin="0 0 small 0">
              <View 
                as="div" 
                background="secondary" 
                padding="medium" 
                borderRadius="medium"
                borderWidth="small"
              >
                <Text weight="bold" as="div" margin="0 0 x-small 0">
                  {course.name}
                </Text>
                {course.course_code && (
                  <Text size="small" color="secondary" as="div">
                    Code: {course.course_code}
                  </Text>
                )}
                {course.id && (
                  <Text size="small" color="secondary" as="div">
                    ID: {course.id}
                  </Text>
                )}
                <View margin="small 0 0 0">
                  <Button 
                    size="small" 
                    onClick={() => {
                      setSelectedCourse(course.id);
                      fetchStudents(course.id);
                    }}
                  >
                    View Students
                  </Button>
                </View>
              </View>
            </List.Item>
          ))}
        </List>
      </View>
    );
  };

  const renderUserInfo = () => {
    if (!currentUser) return null;

    return (
      <View 
        as="div" 
        background="secondary" 
        padding="medium" 
        borderRadius="medium"
        borderWidth="small"
      >
        <Text as="pre" fontFamily="monospace" size="small">
          {JSON.stringify(currentUser, null, 2)}
        </Text>
      </View>
    );
  };

  const renderStudents = () => {
    if (!students) return null;

    if (!students.success) {
      return (
        <Alert variant="warning">
          Failed to load students for selected course.
        </Alert>
      );
    }

    if (!Array.isArray(students.data) || students.data.length === 0) {
      return <Text>No students found in this course.</Text>;
    }

    return (
      <View>
        <Heading level="h4" margin="0 0 small 0">
          Students in Course (ID: {selectedCourse})
        </Heading>
        <List variant="unstyled">
          {students.data.map((student, index) => (
            <List.Item key={index} margin="0 0 small 0">
              <View 
                as="div" 
                background="secondary" 
                padding="medium" 
                borderRadius="medium"
                borderWidth="small"
              >
                <Text weight="bold" as="div" margin="0 0 x-small 0">
                  {student.name}
                </Text>
                {student.email && (
                  <Text size="small" color="secondary" as="div">
                    Email: {student.email}
                  </Text>
                )}
                {student.id && (
                  <Text size="small" color="secondary" as="div">
                    ID: {student.id}
                  </Text>
                )}
                {student.avatar_url && (
                  <View margin="small 0 0 0">
                    <img 
                      src={student.avatar_url} 
                      alt="Avatar" 
                      style={{ width: '32px', height: '32px', borderRadius: '16px' }}
                    />
                  </View>
                )}
              </View>
            </List.Item>
          ))}
        </List>
      </View>
    );
  };

  return (
    <View as="div" padding="large" maxWidth="800px" margin="0 auto">
      <View margin="0 0 medium 0">
        <Link href="/">← Back to Home</Link>
      </View>
      
      <Heading level="h1" margin="0 0 large 0">
        Canvas Courses & Users Testing
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Test Canvas LMS courses and user endpoints.
      </Text>

      <Tabs margin="0 0 medium 0" onRequestTabChange={(e, { index }) => {
        const tabNames = ['courses', 'user', 'test'];
        setActiveTab(tabNames[index]);
      }}>
        <Tabs.Panel renderTitle="Courses" isSelected={activeTab === 'courses'}>
          <View margin="medium 0">
            <View display="flex" alignItems="center" margin="0 0 medium 0">
              <Button onClick={fetchCourses} disabled={loading}>
                {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Refresh Courses'}
              </Button>
            </View>
            {renderCoursesList()}
            {students && (
              <View margin="large 0 0 0">
                {renderStudents()}
              </View>
            )}
          </View>
        </Tabs.Panel>
        
        <Tabs.Panel renderTitle="Current User" isSelected={activeTab === 'user'}>
          <View margin="medium 0">
            <View display="flex" alignItems="center" margin="0 0 medium 0">
              <Button onClick={fetchCurrentUser} disabled={loading}>
                {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Get Current User'}
              </Button>
            </View>
            {renderUserInfo()}
          </View>
        </Tabs.Panel>

        <Tabs.Panel renderTitle="Test Connection" isSelected={activeTab === 'test'}>
          <View margin="medium 0">
            <View display="flex" alignItems="center" margin="0 0 medium 0">
              <Button onClick={testConnection} disabled={loading}>
                {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Test Canvas Connection'}
              </Button>
            </View>
            {currentUser && renderUserInfo()}
          </View>
        </Tabs.Panel>
      </Tabs>

      {error && (
        <View margin="medium 0">
          <Alert variant="error" margin="small 0">
            <Text weight="bold">Error:</Text> {error}
          </Alert>
        </View>
      )}
    </View>
  );
};

export default CanvasCoursesPage;