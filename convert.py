#!/usr/bin/env python3

import json
import pathlib
import markdown
import yaml


path = pathlib.Path(".")

with (path / "character.yaml").open("r", encoding="utf-8") as infile:
    character: dict[str, ...] = yaml.load(infile, Loader=yaml.CLoader)

for key in character:
    if not isinstance(character[key], list):
        continue

    if (path / key).is_dir():
        for file in (path / key).iterdir():
            with file.open("r", encoding="utf-8") as infile:
                character[key].extend(yaml.load_all(infile, Loader=yaml.CLoader))

backstory: dict[str, str] = character["backstory"]
for key, value in backstory.items():
    backstory[key] = markdown.markdown(value)


with (path / "character.json").open("w", encoding="utf-8") as outfile:
    json.dump(character, outfile)
