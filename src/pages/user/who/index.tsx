// TODO: Add real player avatars
// TODO: Add real player names
// TODO: Allow players to be edited
// TODO: Allow players to be deleted
// TODO: Allow players to be added
// TODO: Allow players to remix their avatars with AI
import { Box, Button, Input } from '@mui/material';
import { useState } from 'react';

interface Player {
  name: string;
  avatar: string;
}

const snipName = (name: string) => {
  if (name.length > 10) {
    return `${name.slice(0, 10)}...`;
  }
  return name;
};

const testPlayers: Player[] = [
  {
    name: 'Player 1',
    avatar: 'https://i.pravatar.cc/300'
  },
  {
    name: 'Player 2',
    avatar: 'https://i.pravatar.cc/300'
  },
  {
    name: 'Player with long name',
    avatar: 'https://i.pravatar.cc/300'
  }
];

const Who = () => {
  const [players, setPlayers] = useState<Player[]>(testPlayers);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState<string>('');

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      name: newPlayerName,
      avatar: newPlayerAvatar
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setNewPlayerAvatar('');
  };

  return (
    <div className="container h-full flex justify-center items-center">
      <Box sx={{ width: '80%', height: '80%' }}>
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8">{`Who's Playing?`}</h1>
          <div className="mb-8">
            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center mb-4 w-40 h-40 rounded-full background-cover"
                title={player.name}
                style={{ backgroundImage: `url(${player.avatar})` }}
              >
                <div className="bg-black bg-opacity-50 text-white text-xl font-bold p-2 m-auto rounded-md">
                  {snipName(player.name)}
                </div>
              </div>
            ))}
            <div
              className="flex items-center mb-4 w-40 h-40 rounded-full background-cover bg-gray-300"
              title="Add new player"
            ></div>
          </div>
          {/* <div className="flex items-center mb-4">
            <Input
              placeholder="Player Name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="mr-2"
            />
            <Input
              placeholder="Avatar URL"
              value={newPlayerAvatar}
              onChange={(e) => setNewPlayerAvatar(e.target.value)}
              className="mr-2"
            />
            <Button variant="contained" onClick={handleAddPlayer}>
              Add Player
            </Button>
          </div> */}
        </div>
      </Box>
    </div>
  );
};

export default Who;
