#!/usr/bin/env python3

import json
import pathlib
import markdown
import yaml


path = pathlib.Path(".")

with (path / "schema" / "character.yaml").open("r", encoding="utf-8") as infile:
    with (path / "schema" / "character.json").open("w", encoding="utf-8") as outfile:
        json.dump(yaml.load(infile, Loader=yaml.CLoader), outfile, indent=2)

with (path / "character.yaml").open("r", encoding="utf-8") as infile:
    character: dict[str, ...] = yaml.load(infile, Loader=yaml.CLoader)

for key in character:
    if not isinstance(character[key], list):
        continue

    if (path / key).is_dir():
        for file in (path / key).iterdir():
            with file.open("r", encoding="utf-8") as infile:
                if objects := list(yaml.load_all(infile, Loader=yaml.CLoader)):
                    del objects[0]["$schema"]
                    character[key].extend(objects)

backstory: dict[str, str] = character["backstory"]
for key, value in backstory.items():
    backstory[key] = markdown.markdown(value)

abilities = []
attacks = []
for thing in character["items"] + character["levels"] + character["feats"]:
    abilities.extend(x["name"] for x in thing.get("abilities", []))
    attacks.extend(x["name"] for x in thing.get("attacks", []))

print(abilities, attacks)

with (path / "site" / "character.json").open("w", encoding="utf-8") as outfile:
    json.dump(character, outfile, indent=2)
