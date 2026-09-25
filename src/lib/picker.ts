import { z } from 'zod';
import fullManifest from '../data/picker.json';
import reducedManifest from '../data/picker-reduced.json';

const optionSchema = z.object({ id: z.string().min(1), label: z.string().min(1) }).strict();
const stepSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('instruction'), label: z.string(), text: z.string() }).strict(),
	z.object({ type: z.literal('checkpoint'), label: z.string(), text: z.string() }).strict(),
	z.object({ type: z.literal('command'), label: z.string(), command: z.string() }).strict(),
	z.object({ type: z.literal('link'), text: z.string(), href: z.string() }).strict(),
]);

export const pickerSchema = z.object({
	schemaVersion: z.literal(1),
	sources: z.array(z.object({ url: z.url(), revision: z.string().optional(), retrieved: z.string() })),
	dimensions: z.array(z.object({
		id: z.string().min(1),
		label: z.string().min(1),
		control: z.enum(['select', 'radio']),
		default: z.string().optional(),
		options: z.array(optionSchema).min(1),
	}).strict()).min(1),
	images: z.array(z.object({ name: z.string(), relationship: z.string(), description: z.string(), audience: z.string(), hint: z.string().optional() })),
	startingStates: z.array(z.object({ id: z.string(), label: z.string() }).strict()).optional(),
	combinations: z.array(z.object({
		id: z.string(),
		selection: z.record(z.string(), z.string()),
		imageRef: z.string().regex(/^ghcr\.io\/ublue-os\/[a-z0-9-]+:[a-z0-9.-]+$/),
		description: z.string(),
		workflows: z.record(z.string(), z.string()).optional(),
	}).strict()),
	workflows: z.record(z.string(), z.object({ label: z.string(), sources: z.array(z.url()), steps: z.array(stepSchema) }).strict()).optional(),
	verification: z.object({ label: z.string(), command: z.string(), note: z.string(), source: z.url() }).strict().optional(),
	ui: z.record(z.string(), z.string()),
}).strict();

export type PickerManifest = z.infer<typeof pickerSchema>;
export type PickerCombination = PickerManifest['combinations'][number];
export type PickerWorkflow = NonNullable<PickerManifest['workflows']>[string];
export type PickerStep = PickerWorkflow['steps'][number];

export function validatePicker(input: unknown): PickerManifest {
	const data = pickerSchema.parse(input);
	const dimensionIds = data.dimensions.map(({ id }) => id);
	if (new Set(dimensionIds).size !== dimensionIds.length) throw new Error('Picker dimension IDs must be unique.');
	const startingStates = data.startingStates ?? [];
	const stateIds = startingStates.map(({ id }) => id);
	if (new Set(stateIds).size !== stateIds.length) throw new Error('Picker starting-state IDs must be unique.');
	const combinationIds = new Set<string>();
	const selectionTuples = new Set<string>();
	const optionsByDimension = new Map(data.dimensions.map((dimension) => [dimension.id, new Set(dimension.options.map(({ id }) => id))]));

	for (const dimension of data.dimensions) {
		const optionIds = dimension.options.map(({ id }) => id);
		if (new Set(optionIds).size !== optionIds.length) throw new Error(`Duplicate options in ${dimension.id}.`);
		if (dimension.default && !optionIds.includes(dimension.default)) throw new Error(`Invalid default for ${dimension.id}.`);
	}
	for (const combination of data.combinations) {
		if (combinationIds.has(combination.id)) throw new Error(`Duplicate combination ID: ${combination.id}.`);
		combinationIds.add(combination.id);
		const keys = Object.keys(combination.selection).sort();
		if (keys.join('\0') !== [...dimensionIds].sort().join('\0')) throw new Error(`Selection dimensions do not match for ${combination.id}.`);
		for (const [dimension, option] of Object.entries(combination.selection)) {
			if (!optionsByDimension.get(dimension)?.has(option)) throw new Error(`Unknown option ${option} for ${dimension}.`);
		}
		const tuple = dimensionIds.map((id) => combination.selection[id]).join('\0');
		if (selectionTuples.has(tuple)) throw new Error(`Duplicate selection tuple: ${tuple}.`);
		selectionTuples.add(tuple);
		for (const [state, workflow] of Object.entries(combination.workflows ?? {})) {
			if (!stateIds.includes(state)) throw new Error(`Unknown starting state ${state} in ${combination.id}.`);
			if (!data.workflows?.[workflow]) throw new Error(`Unknown workflow ${workflow} in ${combination.id}.`);
		}
	}
	for (const workflow of Object.values(data.workflows ?? {})) {
		for (const step of workflow.steps) {
			if (step.type === 'link' && !isSafeLink(step.href)) throw new Error(`Unsafe picker workflow URL: ${step.href}.`);
			for (const text of step.type === 'command' ? [step.command] : step.type === 'link' ? [step.text] : [step.label, step.text]) {
				const untemplated = text.replaceAll('{imageRef}', '');
				if (untemplated.includes('{') || untemplated.includes('}')) throw new Error(`Unsupported picker template token in: ${text}.`);
			}
		}
	}
	if (data.verification) {
		if (!isSafeLink(data.verification.source)) throw new Error('Unsafe verification source URL.');
		const verificationCommand = data.verification.command.replaceAll('{imageRef}', '');
		if (verificationCommand.includes('{') || verificationCommand.includes('}')) {
			throw new Error('Unsupported picker verification token.');
		}
	}
	return data;
}

function isSafeLink(href: string): boolean {
	return (href.startsWith('/') && !href.startsWith('//')) || /^https:\/\//i.test(href);
}

export const picker = validatePicker(process.env.PICKER_FIXTURE === '1' ? reducedManifest : fullManifest);

export function findCombination(values: Record<string, string>, manifest: PickerManifest = picker) {
	return manifest.combinations.find((combination) => manifest.dimensions.every(({ id }) => combination.selection[id] === values[id]));
}

export function formatCommand(command: string, combination: PickerCombination): string {
	return command.replaceAll('{imageRef}', combination.imageRef);
}
