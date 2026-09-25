import type { PickerManifest } from '../lib/picker';

type PickerClientData = {
	dimensions: PickerManifest['dimensions'];
	images: PickerManifest['images'];
	combinations: Array<Pick<PickerManifest['combinations'][number], 'id' | 'selection' | 'imageRef'>>;
	ui: { invalid: string };
};

const manifestNode = document.querySelector<HTMLScriptElement>('#picker-data');
const pickerRoot = document.querySelector<HTMLElement>('[data-picker]');

if (manifestNode && pickerRoot) {
	const root = pickerRoot;
	const data = JSON.parse(manifestNode.textContent ?? '') as PickerClientData;
	const referenceNode = root.querySelector<HTMLElement>('[data-copy-value]');
	const hintNode = root.querySelector<HTMLElement>('[data-image-hint]');
	const statusNode = root.querySelector<HTMLElement>('[data-picker-live]');
	const streamNode = root.querySelector<HTMLElement>('[data-stream-label]');
	const copyButton = root.querySelector<HTMLButtonElement>('[data-copy]');
	const dimensions = new Map(data.dimensions.map((dimension) => [dimension.id, dimension]));
	const selected = Object.fromEntries(data.dimensions.map((dimension) => [
		dimension.id,
		dimension.default ?? dimension.options[0]?.id ?? '',
	]));

	const displayOption = (dimensionId: string, optionId: string) => {
		if (dimensionId === 'stream') return optionId;
		if (dimensionId === 'gpu') return optionId === 'latest' ? 'nvidia' : optionId === 'lts' ? 'nvidia-lts' : 'none';
		return dimensions.get(dimensionId)?.options.find((option) => option.id === optionId)?.label ?? optionId;
	};

	function render() {
		const combination = data.combinations.find((item) => data.dimensions.every(({ id }) => item.selection[id] === selected[id]));
		if (!combination) {
			if (statusNode) statusNode.textContent = data.ui.invalid ?? 'This image combination is unavailable.';
			return;
		}

		const reference = combination.imageRef;
		if (referenceNode) referenceNode.textContent = reference;
		const imageLabel = displayOption('image', combination.selection.image ?? '');
		const image = data.images.find((item) => item.name === imageLabel);
		if (hintNode) hintNode.textContent = image?.hint ?? image?.description ?? '';
		if (streamNode) {
			const stream = displayOption('stream', combination.selection.stream ?? '');
			const driver = displayOption('gpu', combination.selection.gpu ?? 'none');
			streamNode.textContent = stream.toUpperCase() + (driver === 'none' ? '' : ` · ${driver.toUpperCase()}`);
		}
		root.querySelectorAll<HTMLButtonElement>('[data-picker-option]').forEach((button) => {
			const isSelected = selected[button.dataset.dimension ?? ''] === button.dataset.option;
			button.setAttribute('aria-pressed', String(isSelected));
			const marker = button.querySelector<HTMLElement>('.picker-option-mark');
			if (marker) marker.textContent = isSelected ? '✓' : '';
		});
		if (copyButton) copyButton.textContent = 'COPY';
		if (statusNode) statusNode.textContent = `Selected ${reference}.`;
	}

	root.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const button = target.closest<HTMLButtonElement>('[data-picker-option]');
		if (!button) return;
		const dimension = button.dataset.dimension;
		const option = button.dataset.option;
		if (!dimension || !option) return;
		selected[dimension] = option;
		render();
	});

	document.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const slab = target.closest<HTMLButtonElement>('[data-pick-image]');
		if (!slab || !selected.image || !data.dimensions.some(({ id }) => id === 'image')) return;
		selected.image = slab.dataset.pickImage ?? selected.image;
		render();
		const images = document.getElementById('images');
		if (!images) return;
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({
			top: images.getBoundingClientRect().top + window.scrollY - 72,
			behavior: reduceMotion ? 'auto' : 'smooth',
		});
	});

	root.hidden = false;
	render();
}
