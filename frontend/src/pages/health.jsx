import React, { useState, useEffect } from 'react';
import { 
  View, 
  Heading, 
  Button, 
  Text,
  Alert,
  Spinner,
  Link,
  List
} from '@instructure/ui';

const HealthPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8000/api/health');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
      setLastCheck(new Date().toLocaleString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'connected' || status === true) {
      return 'success';
    } else if (status === 'error' || status === false) {
      return 'error';
    } else {
      return 'warning';
    }
  };

  const renderHealthStatus = () => {
    if (!healthData) return null;

    const renderValue = (value) => {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    return (
      <View>
        <View margin="0 0 medium 0">
          <Text weight="bold">Health Check Results</Text>
          {lastCheck && (
            <Text size="small" color="secondary" as="div">
              Last checked: {lastCheck}
            </Text>
          )}
        </View>

        <List variant="unstyled">
          {Object.entries(healthData).map(([key, value], index) => (
            <List.Item key={index} margin="0 0 small 0">
              <View 
                as="div" 
                background="secondary" 
                padding="medium" 
                borderRadius="medium"
                borderWidth="small"
                borderColor={getStatusColor(value)}
              >
                <Text weight="bold" as="div" margin="0 0 x-small 0">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </Text>
                <Text 
                  as="div" 
                  color={getStatusColor(value) === 'success' ? 'success' : getStatusColor(value) === 'error' ? 'danger' : 'warning'}
                >
                  {renderValue(value)}
                </Text>
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
        API Health Check
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Monitor the health status of the API and its dependencies using the /api/health endpoint.
      </Text>

      <View margin="0 0 large 0">
        <Button onClick={checkHealth} disabled={loading} color="primary">
          {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Check Health Status'}
        </Button>
      </View>

      {error && (
        <View margin="0 0 medium 0">
          <Alert variant="error" margin="small 0">
            <Text weight="bold">Error:</Text> {error}
          </Alert>
        </View>
      )}

      {healthData && renderHealthStatus()}

      <View margin="large 0 0 0">
        <Text size="small" color="secondary">
          <Text weight="bold">Health Check Information:</Text>
          <br />
          • Green border: Service is healthy/connected
          <br />
          • Red border: Service has errors or is disconnected  
          <br />
          • Yellow border: Service status is unknown or warning
          <br />
          • This endpoint typically checks AWS Bedrock connectivity and other service dependencies
        </Text>
      </View>
    </View>
  );
};

export default HealthPage;