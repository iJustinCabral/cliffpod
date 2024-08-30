import { Episode } from '@/types/Episode';

interface EpisodeListProps {
  episodes: Episode[];
}

const EpisodeList: React.FC<EpisodeListProps> = ({ episodes }) => {
  return (
    <div>
      <h2>Episode List</h2>
      <ul>
        {episodes.map((episode) => (
          <li key={episode.id}>
            <h3>{episode.title}</h3>
            <p>{episode.description}</p>
            <p>Published on: {episode.pubDate}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EpisodeList;