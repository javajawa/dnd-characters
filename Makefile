.PHONY: all

all: site/character.json site/script.jss

site/character.json: character.yaml $(wildcard items/*.yaml) $(wildcard feats/*.yaml) $(wildcard levels/*.yaml)
	python3 ./convert.py $<

node_modules: package.json package-lock.json
	npm install --include=dev
	touch node_modules

site/script.jss: node_modules $(wildcard src/*.ts)
	npm run build