'use client';

import React, { useState } from 'react';
import { fetchPodcastFeed, Episode, transcribeEpisode } from '@/services/PodcastService';

const PodcastInput: React.FC = () => {
  const [url, setUrl] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [transcription, setTranscription] = useState('');
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Fetching podcast feed:', url);
      const fetchedEpisodes = await fetchPodcastFeed(url);
      console.log('Fetched episodes:', fetchedEpisodes);
      setEpisodes(fetchedEpisodes);
    } catch (err) {
      console.error('Error fetching podcast feed:', err);
      setError('Failed to fetch podcast feed. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSelect = async (episode: Episode) => {
    setSelectedEpisode(episode);
    setTranscription('');
    setProgress(0);
    setError('');
    setLoading(true);
  
    console.log('Selected episode:', episode);
    console.log('Audio URL:', episode.audioUrl);
  
    if (!episode.audioUrl) {
      console.error('Audio URL is missing. Full episode data:', JSON.stringify(episode, null, 2));
      setError('Audio URL is missing from the episode data');
      setLoading(false);
      return;
    }
  
    try {
      const result = await transcribeEpisode(episode.audioUrl);
      setProgress(100);
      setTranscription(result.transcription);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to transcribe episode: ${err.message}`);
      } else {
        setError('Failed to transcribe episode. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter podcast RSS feed URL"
          className="w-full p-2 border border-gray-300 rounded text-black"
        />
        <button
          type="submit"
          className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Episodes'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {!selectedEpisode && episodes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Episodes:</h2>
          <ul className="space-y-2">
            {episodes.map((episode) => (
              <li key={episode.guid} className="p-2 bg-black-100 rounded">
                <h3 className="font-semibold">{episode.title}</h3>
                <p className="text-sm text-white-600">{episode.pubDate}</p>
                <button
                  onClick={() => handleEpisodeSelect(episode)}
                  className="mt-2 px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                  disabled={loading}
                >
                  Transcribe
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedEpisode && (
        <div>
          <h2 className="text-xl font-bold mb-2">Selected Episode:</h2>
          <p className="font-semibold">{selectedEpisode.title}</p>
          {progress > 0 && progress < 100 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2">{progress}% Complete</p>
            </div>
          )}
          {transcription && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
              <p className="whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
          {!loading && !transcription && (
            <button
              onClick={() => handleEpisodeSelect(selectedEpisode)}
              className="mt-2 px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
              disabled={loading}
            >
              Retry Transcription
            </button>
          )}
          <button
            onClick={() => {
              setSelectedEpisode(null);
              setTranscription('');
              setProgress(0);
            }}
            className="mt-2 ml-2 px-3 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
          >
            Back to Episodes
          </button>
        </div>
      )}
    </div>
  );
};

export default PodcastInput;