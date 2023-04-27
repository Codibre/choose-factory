import { chooserFactory } from '../../src';

interface Item {
	strValue: string;
	numberValue: number;
	startValue: number;
	endValue: number;
}

describe(chooserFactory.name, () => {
	const list: Item[] = [
		{
			strValue: 'test1',
			numberValue: 1,
			startValue: 1000,
			endValue: 2000,
		},
		{
			strValue: 'test1',
			numberValue: 3,
			startValue: 3000,
			endValue: 3250,
		},
		{
			strValue: 'test1',
			numberValue: 2,
			startValue: 2500,
			endValue: 3000,
		},
	];

	it('should return a function that returns the object based on the informed functions', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue');

		const result = chooser('test1', 3);

		expect(result).toEqual([list[1]]);
	});

	it('should return a function that returns an empty array when some of the middle parameters does not have a match', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue');

		const result = chooser('test2', 3);

		expect(result).toEqual([]);
	});

	it('should return a function that returns an empty array when the end parameter does not have a match', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue');

		const result = chooser('test1', 4);

		expect(result).toEqual([]);
	});

	it('should return a function that returns the correspondent object when a range parameter is used', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue', [
			'startValue',
			'endValue',
			0,
		]);

		const result = chooser('test1', 2, 2750);

		expect(result).toEqual([list[2]]);
	});

	it('should return a function that returns an empty array when a value for a range filter is below every ranges', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue', [
			'startValue',
			'endValue',
			0,
		]);

		const result = chooser('test1', 2, 500);

		expect(result).toEqual([]);
	});

	it('should return a function that returns an empty array when a value for a range filter is over every ranges', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue', [
			'startValue',
			'endValue',
			0,
		]);

		const result = chooser('test1', 2, 5000);

		expect(result).toEqual([]);
	});

	it('should return a function that returns an empty array when a value for a range filter is on a uncovered range', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue', [
			'startValue',
			'endValue',
			0,
		]);

		const result = chooser('test1', 2, 2250);

		expect(result).toEqual([]);
	});

	it('should return a function that returns an empty array when a value for a range is undefined and there is no item without range', () => {
		const chooser = chooserFactory(list, 'strValue', 'numberValue', [
			'startValue',
			'endValue',
			0,
		]);

		const result = chooser('test1', 2, undefined as any);

		expect(result).toEqual([]);
	});

	it('should return a function that returns items without range when a value for a range is undefined and they exist', () => {
		const noRange = {
			strValue: 'test1',
			numberValue: 1,
		} as Item;

		const chooser = chooserFactory(
			[...list, noRange],
			'strValue',
			'numberValue',
			['startValue', 'endValue', 0],
		);

		const result = chooser('test1', 1, undefined as any);

		expect(result).toEqual([noRange]);
	});

	it('should return a function that returns items with range without lower bound when a value for the range is lower than the lowest bound and they exist', () => {
		const noLowerBound = {
			strValue: 'test1',
			numberValue: 1,
			endValue: 4000,
		} as Item;

		const chooser = chooserFactory(
			[...list, noLowerBound],
			'strValue',
			'numberValue',
			['startValue', 'endValue', 0],
		);

		const result = chooser('test1', 1, -500);

		expect(result).toEqual([noLowerBound]);
	});

	it('should return a function that returns items with range without upper bound when a value for the range is higher than the highest bound and they exist', () => {
		const noUpperBound = {
			strValue: 'test1',
			numberValue: 1,
			startValue: -500,
		} as Item;

		const chooser = chooserFactory(
			[...list, noUpperBound],
			'strValue',
			'numberValue',
			['startValue', 'endValue', 0],
		);

		const result = chooser('test1', 1, 15000);

		expect(result).toEqual([noUpperBound]);
	});
});
