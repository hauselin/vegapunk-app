/** @type {import('tailwindcss').Config} */

// using mode JIT helps with faster build times 
// and smaller css files: https://v2.tailwindcss.com/docs/just-in-time-mode

export default {
	mode: 'jit',
	content: ['./src/**/*.{html,js,svelte,ts}', "./node_modules/svhighlight/**/*.svelte"],
	theme: {
		extend: {
			maxHeight: {
				'128': '32rem',
				'75vh': '75vh',
			}
		},
		screens: {
			'xs': '450px',
			'sm': '640px',
			// => @media (min-width: 640px) { ... }

			'md': '768px',
			// => @media (min-width: 768px) { ... }

			'lg': '1024px',
			// => @media (min-width: 1024px) { ... }

			'xl': '1280px',
			// => @media (min-width: 1280px) { ... }

			'2xl': '1536px',
			// => @media (min-width: 1536px) { ... }
		}
	},
	plugins: [require('daisyui'), require('@tailwindcss/typography')],
	daisyui: {
		themes: ["light"], // https://daisyui.com/docs/themes/
	},
};
