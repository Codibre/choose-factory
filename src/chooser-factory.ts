/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { fluent, identity } from '@codibre/fluent-iterable';

export type BaseKeyType = string | symbol | number;

export type Indexes = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	-1,
];

export type Range<T> = [KeysOfType<T, number>, KeysOfType<T, number>, number];

export type ChooseMapper<T> = keyof T | Range<T>;

export type KeysOfType<T, V> = {
	[K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export type ToObjectChainValueOf<
	T,
	K extends ChooseMapper<T>,
> = K extends keyof T ? T[K] : K extends Range<T> ? number : never;

export type ItemType<T> = T extends Iterable<infer R> ? R : never;

export type ChooserParams<
	Arr extends Array<ChooseMapper<V>>,
	V,
	R = V[],
	Pos extends number = 0,
> = {
	done: [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any: any[];
	recur: ToObjectChainValueOf<V, Arr[Pos]> extends BaseKeyType
		? [
				ToObjectChainValueOf<V, Arr[Pos]>,
				...ChooserParams<Arr, V, R, Indexes[Pos]>
		  ]
		: ToObjectChainValueOf<V, Arr[Pos]> extends Iterable<BaseKeyType>
		? [
				ItemType<ToObjectChainValueOf<V, Arr[Pos]>>,
				...ChooserParams<Arr, V, R, Indexes[Pos]>
		  ]
		: [];
}[Pos extends Arr['length'] ? 'done' : Pos extends -1 ? 'any' : 'recur'];

export type Chooser<Arr extends Array<ChooseMapper<V>>, V> = (
	...args: ChooserParams<Arr, V>
) => V[] | undefined;

function getMdc(value1: number | undefined, value2: number) {
	if (value1 === undefined) return value2;
	let gcd = 0;
	while (value1 > 0 && value2 > 0) {
		if (value1 > value2) {
			gcd = value2;
			value1 -= value2;
		} else {
			gcd = value1;
			value2 -= value1;
		}
	}
	if (gcd === 0) {
		throw new RangeError('There is no gcd');
	}
	return gcd;
}

const empty = Symbol('empty');
const INFINITY_BOUNDS = new Map([
	[-1, Symbol('NEGATIVE_INFINITY')],
	[1, Symbol('POSITIVE_INFINITY')],
]);

function prepareValue<T>(value: T | undefined, multiplier: number) {
	if (value === undefined) return undefined;
	return Math.round((value as unknown as number) * multiplier);
}

class NormalizedList<
	T,
	Init extends symbol,
	End extends symbol,
	HalfDelimited extends symbol,
> implements Iterable<{ value: T }>
{
	public readonly multiplierSymbol = Symbol('multiplier');
	private current = 0;
	private pivot: T | typeof empty = empty;
	private multiple = 0;
	private iterator: Iterator<{ value: T }>;
	private item: IteratorResult<{ value: T }> | undefined;

	constructor(
		private list: Iterable<{ value: T }>,
		public readonly gcd: number,
		public readonly multiplier: number,
		private init: Init,
		private end: End,
		private halfDelimited: HalfDelimited,
		public lowerBound: number,
		public upperBound: number,
	) {
		this.iterator = this.list[Symbol.iterator]();
	}

	[Symbol.iterator](): IterableIterator<{ value: T }> {
		return this;
	}

	next(): IteratorResult<{ value: T }> {
		if (this.item === undefined) this.item = this.iterator.next();
		if (this.item.done) return { done: true, value: undefined };
		const item = this.item.value as
			| undefined
			| { value: T & { [k in Init | End | HalfDelimited]?: number } };
		if (!item) return { done: false, value: item as unknown as { value: T } };
		const { value } = item;
		const init = value[this.init];
		const end = item.value[this.end];
		if (end === undefined || init === undefined) {
			const halfDelimited = value[this.halfDelimited];
			delete (this.item.value as any)[this.init];
			delete (this.item.value as any)[this.end];
			delete (this.item.value as any)[this.halfDelimited];
			this.item = this.iterator.next();
			return {
				done: false,
				value: {
					value,
					[this.multiplierSymbol]: halfDelimited
						? INFINITY_BOUNDS.get(halfDelimited)
						: empty,
				} as unknown as { value: T },
			};
		}
		if (this.pivot === empty || this.pivot !== value) {
			this.pivot = value;
			this.current = init;
			this.multiple = Math.floor((init - this.lowerBound) / this.gcd);
		}
		if (end < this.current) {
			delete (this.item.value as any)[this.init];
			delete (this.item.value as any)[this.end];
			this.item = this.iterator.next();
		}
		const result = {
			done: false,
			value: {
				value,
				[this.multiplierSymbol]: this.multiple,
			},
		};
		this.current += this.gcd;
		this.multiple++;
		return result;
	}
}

function getItem<
	T extends object,
	Init extends KeysOfType<T, number>,
	End extends KeysOfType<T, number>,
	InitSymbol extends symbol,
	EndSymbol extends symbol,
>(
	base: T | undefined,
	initSymbol: InitSymbol,
	endSymbol: EndSymbol,
	init: Init,
	multiplier: number,
	end: End,
) {
	const item = base as T & {
		[a in typeof initSymbol | typeof endSymbol]: number;
	};
	item[initSymbol] = prepareValue(
		item[init],
		multiplier,
	) as typeof item[typeof initSymbol];
	item[endSymbol] = prepareValue(
		item[end],
		multiplier,
	) as typeof item[typeof endSymbol];
	return item;
}

function partitionRange<
	T extends object,
	Init extends KeysOfType<T, number>,
	End extends KeysOfType<T, number>,
>(
	original: T[],
	list: Iterable<{ value: T }>,
	init: Init,
	end: End,
	precision = 2,
) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const initSymbol = Symbol(init.toString());
	const endSymbol = Symbol(end.toString());
	const halfDelimited = Symbol('halfDelimited');
	const multiplier = 10 ** precision;

	let upperBound: number | undefined;
	let gcd: number | undefined;
	let lowerBound: number;
	let lowestBound: number | undefined;
	let highestBound: number | undefined;

	for (const item of original) {
		const current = getItem(item, initSymbol, endSymbol, init, multiplier, end);
		if (!upperBound) upperBound = current[initSymbol];
		lowerBound = upperBound;
		upperBound = current[initSymbol];
		if (upperBound !== undefined && upperBound > lowerBound) {
			gcd = getMdc(gcd, upperBound - lowerBound);
		}
		lowerBound = upperBound ?? Number.NEGATIVE_INFINITY;
		upperBound = current[endSymbol] ?? Number.POSITIVE_INFINITY;
		if (
			lowerBound === Number.NEGATIVE_INFINITY &&
			upperBound === Number.POSITIVE_INFINITY
		) {
			continue;
		} else if (lowerBound === Number.NEGATIVE_INFINITY) {
			(current as any)[halfDelimited] = -1;
		} else if (upperBound === Number.POSITIVE_INFINITY) {
			(current as any)[halfDelimited] = 1;
		} else {
			if (lowestBound === undefined || lowestBound > lowerBound) {
				lowestBound = lowerBound;
			}
			if (highestBound === undefined || highestBound < upperBound) {
				highestBound = upperBound;
			}
			if (upperBound > lowerBound) {
				gcd = getMdc(gcd, upperBound - lowerBound);
			}
		}
	}
	if (gcd === undefined) {
		throw new RangeError('Could not find GCD');
	}

	return new NormalizedList(
		list,
		gcd,
		multiplier,
		initSymbol,
		endSymbol,
		halfDelimited,
		lowestBound ?? Number.MIN_SAFE_INTEGER,
		highestBound ?? Number.MAX_SAFE_INTEGER,
	);
}

export function chooserFactory<
	T extends object,
	Keys extends Array<ChooseMapper<T>>,
>(list: T[], ...keys: Keys): Chooser<Keys, T> {
	let normalized: Iterable<{ value: T }> = fluent(list).map((value) => ({
		value,
	}));
	const getters: Array<(x: any) => any> = [];

	const prepared = keys.map((key) => {
		if (Array.isArray(key)) {
			const iterator = partitionRange(list, normalized, key[0], key[1], key[2]);
			const result = iterator.multiplierSymbol;
			const { gcd, multiplier, lowerBound, upperBound } = iterator;
			normalized = iterator;
			getters.push((x: number | undefined) => {
				if (x === undefined) return empty;
				const inScale = x * multiplier;
				if (inScale < lowerBound) return INFINITY_BOUNDS.get(-1);
				if (inScale > upperBound) return INFINITY_BOUNDS.get(1);
				return Math.floor((inScale - lowerBound) / gcd);
			});
			return result;
		}
		getters.push(identity);
		return (x: { value: T }) => x.value[key];
	});
	const tree: any = fluent(normalized as Iterable<any>).toObjectChainReduce(
		(): T[] => [],
		(acc, { value }) => {
			acc.push(value);
			return acc;
		},
		...(prepared as any),
	);

	return ((...args) => {
		let result: any = tree;
		for (let i = 0; i < args.length; i++) {
			const item = args[i];
			const getter = getters[i] ?? identity;
			result = result[getter(item)];
			if (result === undefined) break;
		}

		return result ?? [];
	}) as Chooser<Keys, T>;
}
