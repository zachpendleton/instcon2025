import React from 'react';
import { View, Heading, List, Link, Text } from '@instructure/ui';

const IndexPage = () => {
  const apiEndpoints = [
    {
      title: 'AI Completions',
      description: 'Single message AI completion testing',
      path: '/completions'
    },
    {
      title: 'Chat Conversations',
      description: 'Multi-message chat conversation testing',
      path: '/chat'
    },
    {
      title: 'Streaming Chat',
      description: 'Real-time streaming chat responses',
      path: '/streaming'
    },
    {
      title: 'Canvas Search',
      description: 'Test Canvas LMS search functionality',
      path: '/canvas-search'
    },
    {
      title: 'Canvas Courses',
      description: 'View and manage Canvas courses',
      path: '/canvas-courses'
    },
    {
      title: 'API Health',
      description: 'Check API and service health status',
      path: '/health'
    }
  ];

  return (
    <View as="div" padding="large" maxWidth="800px" margin="0 auto">
      <Heading level="h1" margin="0 0 large 0">
        Canvas LMS AI Workshop
      </Heading>
      <Text as="p" size="large" margin="0 0 medium 0">
        Test and explore the AI and Canvas LMS integration endpoints.
      </Text>
      
      <List variant="unstyled" margin="medium 0">
        {apiEndpoints.map((endpoint, index) => (
          <List.Item key={index} margin="0 0 medium 0">
            <View 
              as="div" 
              background="secondary" 
              padding="medium" 
              borderRadius="medium"
              borderWidth="small"
              borderColor="brand"
            >
              <Link href={endpoint.path} isWithinText={false}>
                <Heading level="h3" margin="0 0 x-small 0">
                  {endpoint.title}
                </Heading>
              </Link>
              <Text size="medium" color="secondary">
                {endpoint.description}
              </Text>
            </View>
          </List.Item>
        ))}
      </List>
    </View>
  );
};

export default IndexPage;
