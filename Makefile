all: player example

.PHONY:example

player:
	rm -f dist/*
	tsc

example:
	cd example && make
