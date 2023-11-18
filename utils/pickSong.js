import { songs } from '../songsData/tempSongs';

export const pickSong = () => {
  const song = songs[Math.floor(Math.random() * songs.length)];
  return song;
};
