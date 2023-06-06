.PHONY: all

all: site/character.json
	true

site/character.json: character.yaml $(wildcard items/*.yaml) $(wildcard feats/*.yaml) $(wildcard levels/*.yaml)
	python3 ./convert.py $<
