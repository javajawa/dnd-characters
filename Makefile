.PHONY: all

all: character.json
	true

%.json: %.yaml
	./convert.py $<
