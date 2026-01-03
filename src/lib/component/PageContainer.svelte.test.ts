import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PageContainerWrapper from './PageContainer.test-wrapper.svelte';

describe('PageContainer', () => {
	it('renders title in header', () => {
		const { container } = render(PageContainerWrapper, {
			props: {
				title: 'Test Page Title',
				content: 'Page content'
			}
		});

		const header = container.querySelector('.page-header h1');
		expect(header).toBeInTheDocument();
		expect(header).toHaveTextContent('Test Page Title');
	});

	it('renders children content', () => {
		const { container } = render(PageContainerWrapper, {
			props: {
				title: 'Title',
				content: 'Test content here'
			}
		});

		const content = container.querySelector('.page-content');
		expect(content).toBeInTheDocument();
		expect(content).toHaveTextContent('Test content here');
	});

	it('renders page container structure', () => {
		const { container } = render(PageContainerWrapper, {
			props: {
				title: 'Title',
				content: 'Content'
			}
		});

		const pageContainer = container.querySelector('.page-container');
		const pageHeader = container.querySelector('.page-header');
		const pageContent = container.querySelector('.page-content');

		expect(pageContainer).toBeInTheDocument();
		expect(pageHeader).toBeInTheDocument();
		expect(pageContent).toBeInTheDocument();
	});

	it('handles empty title', () => {
		const { container } = render(PageContainerWrapper, {
			props: {
				title: '',
				content: 'Content'
			}
		});

		const header = container.querySelector('.page-header h1');
		expect(header).toBeInTheDocument();
		expect(header).toHaveTextContent('');
	});

	it('has correct CSS classes', () => {
		const { container } = render(PageContainerWrapper, {
			props: {
				title: 'Title',
				content: 'Content'
			}
		});

		expect(container.querySelector('.page-container')).toBeInTheDocument();
		expect(container.querySelector('.page-header')).toBeInTheDocument();
		expect(container.querySelector('.page-content')).toBeInTheDocument();
	});
});
