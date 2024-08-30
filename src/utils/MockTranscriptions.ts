import { summarizeTranscription } from "@/services/PodcastService";

export const mockTranscripts = [
    {
      podcastName: "The Joe Rogan Experience",
      episode: "Episode #1234",
      transcript: "Today we're talking about the latest advancements in AI technology. Our guest, Dr. Jane Smith, explains how machine learning algorithms are revolutionizing healthcare diagnostics. She says, 'The ability to process vast amounts of medical data is leading to earlier disease detection and more personalized treatment plans.'"
    },
    {
      podcastName: "Huberman Lab",
      episode: "Episode #89",
      transcript: "In this episode, we dive into the science of sleep. Recent studies have shown that consistent sleep patterns can significantly improve cognitive function and emotional regulation. One key finding is that exposure to natural light in the morning helps to reset our circadian rhythm, leading to better sleep quality at night."
    },
    {
      podcastName: "Planet Money",
      episode: "Episode #1000",
      transcript: "We're exploring the economic impact of remote work. With more companies adopting flexible work policies, we're seeing shifts in housing markets, commuter patterns, and even local economies. Some experts predict this could lead to a redistribution of wealth from urban centers to smaller towns and rural areas."
    }
  ];

const mockTranscription = `
This is a mock podcast transcription. It contains various topics and discussions.

Topic 1: The importance of unit testing in software development.
Unit testing is crucial for maintaining code quality and catching bugs early in the development process.
It helps developers write more modular and maintainable code.

Topic 2: The rise of artificial intelligence in everyday applications.
AI is becoming increasingly prevalent in our daily lives, from voice assistants to recommendation systems.
There are both exciting possibilities and potential concerns regarding AI's impact on society.

Topic 3: The future of remote work post-pandemic.
Many companies are adopting hybrid work models, allowing employees to split their time between office and remote work.
This shift is changing the way we think about work-life balance and office culture.

In conclusion, these topics represent some of the key trends and discussions in technology and work culture today.
`;

async function testSummarization() {
  try {
    console.log('Starting summarization test...');
    const result = await summarizeTranscription(mockTranscription);
    console.log('Summarization result:', result.newsletter);
  } catch (error) {
    console.error('Error during summarization test:', error);
  }
}

testSummarization();