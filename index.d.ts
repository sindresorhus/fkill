export interface Options {
	/**
	 * Force kill the process.
	 *
	 * @default false
	 */
	readonly force?: boolean;

	/**
	 * Kill all child processes along with the parent process. *(Windows only)*
	 *
	 * @default true
	 */
	readonly tree?: boolean;

	/**
	 * Ignore capitalization when killing a process.
	 *
	 * Note that the case is always ignored on Windows.
	 *
	 * @default false
	 */
	readonly ignoreCase?: boolean;
}

/**
 * Fabulously kill processes. Cross-platform.
 *
 * @param input - One or more process IDs/names/ports to kill. To kill a port, prefix it with a colon. For example: `:8080`.
 */
export default function fkill(
	input: number | string | ReadonlyArray<string | number>,
	options?: Options
): Promise<void>;
