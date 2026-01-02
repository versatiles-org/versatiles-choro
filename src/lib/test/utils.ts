import { render } from '@testing-library/svelte';
import type { ComponentType } from 'svelte';
import { tick } from 'svelte';

/**
 * Standard render wrapper with common options
 */
export function renderComponent<T extends Record<string, unknown>>(
	component: ComponentType,
	props?: T
) {
	return render(component, { props });
}

/**
 * Render and wait for component to be ready
 */
export async function renderAndWait<T extends Record<string, unknown>>(
	component: ComponentType,
	props?: T
) {
	const result = renderComponent(component, props);
	await tick();
	return result;
}
