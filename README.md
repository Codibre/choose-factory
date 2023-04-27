[![Actions Status](https://github.com/Codibre/chooser-factory/workflows/build/badge.svg)](https://github.com/Codibre/chooser-factory/actions)
[![Actions Status](https://github.com/Codibre/chooser-factory/workflows/test/badge.svg)](https://github.com/Codibre/chooser-factory/actions)
[![Actions Status](https://github.com/Codibre/chooser-factory/workflows/lint/badge.svg)](https://github.com/Codibre/chooser-factory/actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/491cc04380c0b2e75200/test_coverage)](https://codeclimate.com/github/Codibre/chooser-factory/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/491cc04380c0b2e75200/maintainability)](https://codeclimate.com/github/Codibre/chooser-factory/maintainability)
[![Packages](https://david-dm.org/Codibre/chooser-factory.svg)](https://david-dm.org/Codibre/chooser-factory)
[![npm version](https://badge.fury.io/js/chooser-factory.svg)](https://badge.fury.io/js/chooser-factory)

This library aims to generates a function that will return any list of items of a given list that meet an established criteria, always with processing complexity O(1).

To achieve such feature, hashmaps are generated based on the number of criteria fields are informed. For now you can use string, numbers and symbol fields, and also provide two fields to define an interval searching, that will also be done in O(1) but it must be used with caution. Finally, array fields with items of the previous types can be used for a "includes" criteria.

## How to Install

```
npm i chooser-factory
```

## How to use it

Just inform the list and the fields you want to use as criteria:

```ts
const personChooser = chooserFactory(people, 'gender', 'nationality', 'age');
```

Then you can use the generate function to find items that meet all the criteria:

```ts
//It will return a list with every male, brazilian person that are 36 years old on the list
const result = personChooser('M', 'brazilian', 36);
```

A range of values can also be used to create a criteria:

```ts
// The tuple ['minIncome', 'maxIncome', 2] defines a lower bound field, an upper bound field and a decimal precision to be considered
const personChooser = chooserFactory(people, 'gender', 'nationality', ['minIncome', 'maxIncome', 2]);

// Will return a list with every female, bolivian person with a minIncome lower or equal than 1400 and a maxIncome greater than 1400
const result = personChooser('F', 'bolivian', 1400);
```

## Shenanigans

* There is no such a thing as a free lunch and being able to get those results in O(1) comes with a price: memory use.
If you generate a function using only primitive values you'll have a memory use of O(N), which is fine.

* if you use an array field of primitive values, the memory consumption can be up to O(N^d), where d is the number of items of the array, which is not as bad as it looks. This worst case scenario would only happen if every item contains all the possible values in the given array, but if you have a pretty evenly distributed list, it is still manageable, keeping the memory consumption near O(N), so you have to know your data before using this option.

* The more dangerous option we have here is really the interval criteria. To achieve an O(1) speed here, this option creates an hashmap based on the GCD of the sizes of the ranges of each item, and also the size of the voids between each item. The precision is an important factor here, so, if you have a really diverse list of ranges, this method can consume up to O(N * d * 10^p), where d is the sum of all the interval sizes, and p the interval precision. So, again, knowing the data before using it is a good way to avoid memory overflow. For example, the higher the GCD the between the interval, the lowest will be the memory consumption, making it even possible to still be O(N) depending on the data.


## Known problems

The interval criteria still need to be improved to deal with overlapping intervals and the list need to be ordered so the algorithm can work.

## License

Licensed under [MIT](https://en.wikipedia.org/wiki/MIT_License).
