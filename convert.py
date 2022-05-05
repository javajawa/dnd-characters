#!/usr/bin/env python3
# vim: nospell

import json
import yaml
import sys


name = sys.argv[1]
target = name.replace(".yaml", ".json").replace(".yml", ".json")

print(name, "->", target)

with open(name, "r") as infile:
    data = yaml.load(infile, Loader=yaml.SafeLoader)
    with open(target, "w") as outfile:
        json.dump(data, outfile)
