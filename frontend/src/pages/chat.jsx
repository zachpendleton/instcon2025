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
  Link,
  List
} from '@instructure/ui';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const newMessage = { role: 'user', content: currentMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          system: systemPrompt
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.response || JSON.stringify(data, null, 2)
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <View as="div" padding="large" maxWidth="800px" margin="0 auto">
      <View margin="0 0 medium 0">
        <Link href="/">← Back to Home</Link>
      </View>
      
      <Heading level="h1" margin="0 0 large 0">
        Chat Conversations Testing
      </Heading>
      
      <Text as="p" margin="0 0 medium 0">
        Test multi-message chat conversations using the /api/chats endpoint.
      </Text>

      <View margin="0 0 medium 0">
        <TextInput
          renderLabel="System Prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant."
        />
      </View>

      {messages.length > 0 && (
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

export default ChatPage;