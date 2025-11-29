# @fauxfetus/generator

A quick and dirty implementation, compartmentalized in a package for further refinement.

This package contains a `DataGenerator` class, whose `run()` method is called from the main project in `scripts/data/generate.mts` and via `pnpm data:generate`.

The purpose of this class is to create the massive dump of files found in `static/data/`.
