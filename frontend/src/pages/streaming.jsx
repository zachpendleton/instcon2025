import React, { useState, useRef } from 'react';
import { 
  View, 
  Heading, 
  TextArea, 
  TextInput,
  Button, 
  Text,
  Alert,
  Spinner,
  Link,
  List
} from '@instructure/ui';

const StreamingPage = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const eventSourceRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const newMessage = { role: 'user', content: currentMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');
    setLoading(true);
    setError('');
    setStreamingResponse('');

    try {
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create URL with query parameters for streaming
      const url = new URL('http://localhost:8000/api/streaming/chats');
      
      // For streaming, we'll use POST request with fetch and manual stream handling
      const response = await fetch('http://localhost:8000/api/streaming/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          system: systemPrompt
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedResponse += parsed.content;
                  setStreamingResponse(accumulatedResponse);
                }
              } catch (parseError) {
                console.error('Failed to parse streaming data:', parseError);
              }
            }
          }
        }

        // Add the complete response to messages
        const assistantMessage = { 
          role: 'assistant', 
          content: accumulatedResponse
        };
        setMessages([...updatedMessages, assistantMessage]);
        setStreamingResponse('');
        
      } finally {
        reader.releaseLock();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingResponse('');
    setError('');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  return (
    <View as="div" padding="large" maxWidth="800px" margin="0 auto">
      <View margin="0 0 medium 0">
        <Link href="/">← Back to Home</Link>
      </View>
      
      <Heading level="h1" margin="0 0 large 0">
        Streaming Chat Testing
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Test real-time streaming chat responses using the /api/streaming/chats endpoint.
      </Text>

      <View margin="0 0 medium 0">
        <TextInput
          renderLabel="System Prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant."
        />
      </View>

      {(messages.length > 0 || streamingResponse) && (
        <View margin="0 0 medium 0">
          <View display="flex" justifyItems="space-between" alignItems="center" margin="0 0 small 0">
            <Heading level="h3">Conversation:</Heading>
            <Button size="small" onClick={clearChat} color="secondary">
              Clear Chat
            </Button>
          </View>
          
          <View 
            as="div" 
            background="secondary" 
            padding="medium" 
            borderRadius="medium"
            borderWidth="small"
            maxHeight="400px"
            style={{ overflowY: 'auto' }}
          >
            <List variant="unstyled">
              {messages.map((msg, index) => (
                <List.Item key={index} margin="0 0 small 0">
                  <View 
                    as="div" 
                    background={msg.role === 'user' ? 'brand' : 'success'}
                    padding="small"
                    borderRadius="small"
                    margin="0 0 x-small 0"
                  >
                    <Text weight="bold" color="primary-inverse">
                      {msg.role === 'user' ? 'You' : 'Assistant'}:
                    </Text>
                    <Text as="div" color="primary-inverse" margin="x-small 0 0 0">
                      {msg.content}
                    </Text>
                  </View>
                </List.Item>
              ))}
              
              {streamingResponse && (
                <List.Item margin="0 0 small 0">
                  <View 
                    as="div" 
                    background="success"
                    padding="small"
                    borderRadius="small"
                    margin="0 0 x-small 0"
                    borderWidth="small"
                    borderColor="info"
                  >
                    <Text weight="bold" color="primary-inverse">
                      Assistant (streaming...):
                    </Text>
                    <Text as="div" color="primary-inverse" margin="x-small 0 0 0">
                      {streamingResponse}
                      <Text as="span" color="primary-inverse">▊</Text>
                    </Text>
                  </View>
                </List.Item>
              )}
            </List>
          </View>
        </View>
      )}

      <form onSubmit={handleSubmit}>
        <View margin="0 0 medium 0">
          <TextArea
            label="Message"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message here..."
            height="80px"
            required
          />
        </View>

        <View margin="0 0 large 0">
          <Button 
            type="submit" 
            color="primary" 
            disabled={loading || !currentMessage.trim()}
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
    </View>
  );
};

export default StreamingPage;