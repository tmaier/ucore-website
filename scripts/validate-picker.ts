import fullManifest from '../src/data/picker.json';
import reducedManifest from '../src/data/picker-reduced.json';
import { validatePicker } from '../src/lib/picker';

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function assertInvalid(input: unknown, message: string) {
	let rejected = false;
	try {
		validatePicker(input);
	} catch {
		rejected = true;
	}
	assert(rejected, message);
}

const published = validatePicker(fullManifest);
assert(published.combinations.length === 27, `Expected 27 published combinations, found ${published.combinations.length}.`);
assert(published.dimensions.find(({ id }) => id === 'image')?.default === 'ucore', 'The default image must be ucore.');
assert(published.dimensions.find(({ id }) => id === 'stream')?.default === 'stable', 'The default stream must be stable.');
assert(published.dimensions.find(({ id }) => id === 'gpu')?.default === 'none', 'The default NVIDIA option must be none.');

const reduced = validatePicker(reducedManifest);
assert(reduced.images.length === 1, 'The reduced fixture should contain one image.');
assert(!reduced.dimensions.some(({ id }) => id === 'gpu'), 'The reduced fixture should not require a GPU dimension.');
assert(reduced.dimensions.some(({ control }) => control === 'radio'), 'The reduced fixture should exercise a radio control.');

const extraDimensionFixture = structuredClone(reducedManifest);
extraDimensionFixture.dimensions.push({
	id: 'edition',
	label: 'Edition',
	control: 'radio',
	default: 'standard',
	options: [{ id: 'standard', label: 'Standard' }, { id: 'compact', label: 'Compact' }],
});
extraDimensionFixture.combinations = extraDimensionFixture.combinations.flatMap((combination) =>
	extraDimensionFixture.dimensions.at(-1)!.options.map((option) => ({
		...structuredClone(combination),
		id: `${combination.id}-${option.id}`,
		selection: { ...combination.selection, edition: option.id },
		imageRef: `${combination.imageRef}-${option.id}`,
	})),
);
validatePicker(extraDimensionFixture);

const invalidOption = structuredClone(reducedManifest);
invalidOption.combinations[0]!.selection.stream = 'unknown';
assertInvalid(invalidOption, 'Unknown manifest options must be rejected.');

const unsafeLink = structuredClone(reducedManifest);
unsafeLink.workflows.fresh!.steps[2] = { type: 'link', text: 'unsafe', href: 'javascript:alert(1)' };
assertInvalid(unsafeLink, 'Unsafe workflow links must be rejected.');

console.log('PASS: 27 published references, reduced fixture, extra-dimension fixture, and invalid-manifest checks.');
