import type { Track } from '@fauxfetus/generator';
import { createContext } from 'svelte';
import type { Writable } from 'svelte/store';

export type PlayerState = {
	isLoading: boolean;
	isPlaying: boolean;
	isRadio: boolean;

	allTracks: Track[];
	playlist: Track[];

	currentTrackIndex: number | null;
};

export const [getPlayerContext, setPlayerContext] = createContext<Writable<PlayerState>>();
