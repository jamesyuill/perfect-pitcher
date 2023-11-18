import { songs } from '../songsData/tempSongs';

export const pickSong = () => {
  let songsAsked = [];
  const song = songs[Math.floor(Math.random() * songs.length)];
  if (songsAsked.length > 0) {
    for (let i = 0; i < songsAsked; i++) {
      if (song.title === songsAsked[i].title) {
        pickSong();
      } else {
        songsAsked.push(song);
        return song;
      }
    }
  }

  return song;
};
