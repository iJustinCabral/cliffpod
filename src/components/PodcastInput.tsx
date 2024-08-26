'use client';

import React, { useState } from 'react';
import { fetchPodcastFeed, Episode, transcribeEpisode, summarizeTranscription } from '@/services/PodcastService';

const PodcastInput: React.FC = () => {
  const [url, setUrl] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [splitProgress, setSplitProgress] = useState(0);
  const [transcribeProgress, setTranscribeProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fetchedEpisodes = await fetchPodcastFeed(url);
      setEpisodes(fetchedEpisodes);
    } catch (err) {
      setError('Failed to fetch podcast feed. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSelect = async (episode: Episode) => {
    setSelectedEpisode(episode);
    setTranscription('');
    setSummary('');
    setDownloadProgress(0);
    setSplitProgress(0);
    setTranscribeProgress(0);
    setError('');
    setLoading(true);
  
    if (!episode.audioUrl) {
      setError('Audio URL is missing from the episode data');
      setLoading(false);
      return;
    }
  
    try {
      const result = await transcribeEpisode(episode.audioUrl, {
        onDownloadProgress: setDownloadProgress,
        onSplitProgress: setSplitProgress,
        onTranscribeProgress: setTranscribeProgress,
      });
  
      if (!result.transcription) {
        throw new Error('Transcription is empty');
      }
  
      setTranscription(result.transcription);
  
      const summaryResult = await summarizeTranscription(result.transcription);
      setSummary(summaryResult.summary);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to process episode: ${err.message}`);
      } else {
        setError('Failed to process episode. Please try again.');
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
              <li key={episode.guid} className="p-2 bg-gray-800 rounded">
                <h3 className="font-semibold">{episode.title}</h3>
                <p className="text-sm text-gray-400">{episode.pubDate}</p>
                <button
                  onClick={() => handleEpisodeSelect(episode)}
                  className="mt-2 px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                  disabled={loading}
                >
                  Process
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedEpisode && (
        <div>
          <h2 className="text-xl font-bold mb-2">Selected Episode: {selectedEpisode.title}</h2>
          <div className="space-y-4">
            <ProgressBar label="Downloading" progress={downloadProgress} />
            <ProgressBar label="Splitting" progress={splitProgress} />
            <ProgressBar label="Transcribing" progress={transcribeProgress} />
          </div>
          <div className="mt-4 flex space-x-4">
            <div className="w-1/2">
              <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
              <div className="h-96 overflow-y-auto bg-gray-800 p-4 rounded">
                <p className="text-white whitespace-pre-wrap">{transcription}</p>
              </div>
            </div>
            <div className="w-1/2">
              <h3 className="text-lg font-semibold mb-2">Summary:</h3>
              <div className="h-96 overflow-y-auto bg-gray-800 p-4 rounded">
                <p className="text-white whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedEpisode(null);
              setTranscription('');
              setSummary('');
              setDownloadProgress(0);
              setSplitProgress(0);
              setTranscribeProgress(0);
            }}
            className="mt-4 px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
          >
            Back to Episodes
          </button>
        </div>
      )}
    </div>
  );
};

const ProgressBar: React.FC<{ label: string; progress: number }> = ({ label, progress }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-base font-medium text-white">{label}</span>
      <span className="text-sm font-medium text-white">{progress}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

export default PodcastInput;