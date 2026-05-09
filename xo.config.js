/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
	{
		files: ['index.test-d.ts'],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['index.test-d.ts'],
				},
			},
		},
	},
];

export default xoConfig;
