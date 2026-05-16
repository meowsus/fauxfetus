import { json } from '@sveltejs/kit';
import { execSync } from 'child_process';
import pkg from '../../../package.json';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	return json(
		{
			name: 'Faux Fetus',
			short_name: 'Faux Fetus',
			description:
				"A collection of experimental music you never heard of or even want to listen to made by people you don't care about.",
			version: `${pkg.version} (${execSync('git rev-parse --short HEAD').toString().trim()})`,
			categories: ['music', 'entertainment'],
			start_url: '/',
			display: 'standalone',
			theme_color: '#ffffff',
			background_color: '#ffffff',
			icons: [
				{
					src: '/icons/icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-192x192-maskable.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'maskable'
				},
				{
					src: '/icons/icon-512x512-maskable.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable'
				}
			]
		},
		{
			headers: {
				'Content-Type': 'application/manifest+json'
			}
		}
	);
};
