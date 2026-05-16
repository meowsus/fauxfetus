// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces.
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

/* eslint-disable @typescript-eslint/no-explicit-any -- types mirror the library's actual API */
declare module '@regosen/gapless-5' {
	export class Gapless5 {
		constructor(options?: { [key: string]: any });

		// Properties
		hasGUI: boolean;
		loop: any;
		singleMode: any;
		exclusive: any;
		volume: any;
		crossfade: any;
		crossfadeShape: any;
		playbackRate: any;
		useWebAudio: boolean;
		useHTML5Audio: boolean;

		// Callbacks
		onplayrequest: (track_path: string) => void;
		onplay: (track_path: string, analyser_node: object) => void;
		onpause: (track_path: string) => void;
		onstop: (track_path: string) => void;
		onprev: (from_track: string, to_track: string) => void;
		onnext: (from_track: string, to_track: string) => void;
		ontimeupdate: (current_track_time: number, current_track_index: number) => void;
		onerror: (track_path: string, error?: Error | string) => void;
		onloadstart: (track_path: string) => void;
		onload: (track_path: string, fully_loaded: boolean) => void;
		onunload: (track_path: string) => void;
		onfinishedtrack: (track_path: string) => void;
		onfinishedall: () => void;
		onswitchtowebaudio: (analyser_node: object) => void;

		// Accessors
		getIndex: (sourceIndex?: boolean) => number;
		totalTracks: () => number;
		getPosition: () => number;
		setPosition: (position: number) => void;
		setVolume: (volume: number) => void;
		getSeekablePercent: () => number;
		currentSource: () => any;
		currentLength: () => number;
		currentPosition: () => number;
		findTrack: (path: string) => number;
		getTracks: () => string[];
		getTrack: () => string;
		isShuffled: () => boolean;
		isPlaying: () => boolean;

		// Track management
		addTrack: (audioPath: string) => void;
		insertTrack: (point: number, audioPath: string) => void;
		replaceTrack: (point: number, audioPath: string) => void;
		removeTrack: (pointOrPath: number | string) => void;
		removeAllTracks: (flushPlaylist?: boolean) => void;

		// Playback actions
		play: () => void;
		pause: () => void;
		playpause: () => void;
		stop: () => void;
		cue: () => void;
		prev: (uiEvent?: any, forceReset?: any) => void;
		prevtrack: () => void;
		next: (uiEvent?: any, forcePlay?: boolean, crossfadeEnabled?: boolean) => void;
		gotoTrack: (
			pointOrPath: number | string,
			forcePlay?: boolean,
			allowOverride?: boolean,
			crossfadeEnabled?: boolean
		) => void;
		queueTrack: (pointOrPath: number | string) => void;

		// Settings
		setCrossfade: (duration: number) => void;
		setCrossfadeShape: (shape: any) => void;
		setPlaybackRate: (rate: number) => void;
		mapKeys: (keyOptions: { [key: string]: string }) => void;
		shuffle: (preserveCurrent?: boolean) => void;
		toggleShuffle: () => void;
	}

	export namespace LogLevel {
		let Debug: number;
		let Info: number;
		let Warning: number;
		let Error: number;
		let None: number;
	}

	export namespace CrossfadeShape {
		let None: number;
		let Linear: number;
		let EqualPower: number;
	}
}
