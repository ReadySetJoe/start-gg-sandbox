import { useRouter } from 'next/router';
import PlayerSearch from '@/components/PlayerSearch';
import SearchHelp from '@/components/SearchHelp';
import { Player } from '@/types/startgg';

export default function Search() {
  const router = useRouter();

  const handlePlayerSelect = (player: Player) => {
    // Navigate to the player profile page with the player ID
    router.push(`/player/${player.id}`);
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-center text-gradient mb-8">
        Search Players
      </h1>
      
      <SearchHelp />
      <PlayerSearch onPlayerSelect={handlePlayerSelect} />
    </>
  );
}