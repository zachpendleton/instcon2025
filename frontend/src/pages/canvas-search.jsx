import React, { useState } from 'react';
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
  NumberInput
} from '@instructure/ui';

const CanvasSearchPage = () => {
  const [query, setQuery] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const url = new URL('http://localhost:8000/api/canvas/search');
      url.searchParams.append('q', query);
      url.searchParams.append('per_page', perPage.toString());

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View as="div" padding="large" maxWidth="800px" margin="0 auto">
      <View margin="0 0 medium 0">
        <Link href="/">← Back to Home</Link>
      </View>
      
      <Heading level="h1" margin="0 0 large 0">
        Canvas Search Testing
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Test Canvas LMS search functionality using the /api/canvas/search endpoint.
      </Text>

      <form onSubmit={handleSubmit}>
        <View margin="0 0 medium 0">
          <TextInput
            renderLabel="Search Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search terms..."
            required
          />
        </View>

        <View margin="0 0 medium 0">
          <NumberInput
            renderLabel="Results per page"
            value={perPage}
            onChange={(e, value) => setPerPage(value || 10)}
            min={1}
            max={100}
          />
        </View>

        <View margin="0 0 large 0">
          <Button 
            type="submit" 
            color="primary" 
            disabled={loading || !query.trim()}
          >
            {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Search Canvas'}
          </Button>
        </View>
      </form>

      {error && (
        <View margin="0 0 medium 0">
          <Alert variant="error" margin="small 0">
            <Text weight="bold">Error:</Text> {error}
          </Alert>
        </View>
      )}

      {results && (
        <View>
          <Heading level="h3" margin="0 0 small 0">
            Search Results:
          </Heading>
          
          <View margin="0 0 small 0">
            <Text size="small" color="secondary">
              Success: {results.success ? 'Yes' : 'No'}
            </Text>
          </View>

          {results.data && Array.isArray(results.data) ? (
            <View>
              <Text margin="0 0 small 0">
                Found {results.data.length} results
              </Text>
              <List variant="unstyled">
                {results.data.map((item, index) => (
                  <List.Item key={index} margin="0 0 small 0">
                    <View 
                      as="div" 
                      background="secondary" 
                      padding="medium" 
                      borderRadius="medium"
                      borderWidth="small"
                    >
                      <Text weight="bold" as="div" margin="0 0 x-small 0">
                        {item.name || item.full_name || 'Unnamed Item'}
                      </Text>
                      {item.email && (
                        <Text size="small" color="secondary" as="div">
                          Email: {item.email}
                        </Text>
                      )}
                      {item.id && (
                        <Text size="small" color="secondary" as="div">
                          ID: {item.id}
                        </Text>
                      )}
                      {item.avatar_url && (
                        <View margin="small 0 0 0">
                          <img 
                            src={item.avatar_url} 
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
          ) : (
            <View 
              as="div" 
              background="secondary" 
              padding="medium" 
              borderRadius="medium"
              borderWidth="small"
            >
              <Text as="pre" fontFamily="monospace" size="small">
                {JSON.stringify(results, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default CanvasSearchPage;