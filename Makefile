.PHONY: all

all: character.json
	true

%.json: %.yaml
	python3 ./convert.py $<
