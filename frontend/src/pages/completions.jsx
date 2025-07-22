import React, { useState } from 'react';
import { 
  View, 
  Heading, 
  TextArea, 
  TextInput,
  Button, 
  Text,
  Alert,
  Spinner,
  Link
} from '@instructure/ui';

const CompletionsPage = () => {
  const [message, setMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('http://localhost:8000/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          system: systemPrompt
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response || JSON.stringify(data, null, 2));
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
        AI Completions Testing
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Test single message AI completions using the /api/completions endpoint.
      </Text>

      <form onSubmit={handleSubmit}>
        <View margin="0 0 medium 0">
          <TextInput
            renderLabel="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant."
          />
        </View>

        <View margin="0 0 medium 0">
          <TextArea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            height="100px"
            required
          />
        </View>

        <View margin="0 0 large 0">
          <Button 
            type="submit" 
            color="primary" 
            disabled={loading || !message.trim()}
          >
            {loading ? <Spinner renderTitle="Loading" size="x-small" /> : 'Send Message'}
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

      {response && (
        <View>
          <Heading level="h3" margin="0 0 small 0">
            Response:
          </Heading>
          <View 
            as="div" 
            background="secondary" 
            padding="medium" 
            borderRadius="medium"
            borderWidth="small"
          >
            <Text as="pre" fontFamily="monospace" size="small">
              {response}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CompletionsPage;