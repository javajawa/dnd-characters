.PHONY: all

all: character.json schema.json
	true

%.json: %.yaml
	python3 ./convert.py $<
