#!/usr/bin/env python3
"""Extract factual Base_ToolsList entries without evaluating PDF JavaScript.

Input is an already extracted, private static reference stream. Output contains
only tool names, categories, original amounts, weights and prices.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re


def static_object(text, list_name="Base_ToolsList"):
    marker = "var " + list_name + " ="
    start = text.index("{", text.index(marker) + len(marker))
    depth = 0
    quoted = escaped = line_comment = block_comment = False
    output = []
    i = start
    while i < len(text):
        c = text[i]
        following = text[i:i + 2]
        if line_comment:
            if c == "\n":
                line_comment = False
                output.append(c)
        elif block_comment:
            if following == "*/":
                block_comment = False
                i += 1
        elif quoted:
            output.append(c)
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == '"':
                quoted = False
        elif following in ["//", "/*"]:
            line_comment = following == "//"
            block_comment = following == "/*"
            i += 1
        else:
            output.append(c)
            if c == '"':
                quoted = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return "".join(output)
        i += 1
    raise ValueError("Unterminated static tool list")


def records(text, list_name):
    source = static_object(text, list_name)
    literal = re.sub(r'(?m)^(\s*)([A-Za-z_$][\w$]*)\s*:', r'\1"\2":', source)
    literal = re.sub(r'(?<=[\s:,\[])\.(\d)', r'0.\1', literal)
    literal = re.sub(r',\s*([}\]])', r'\1', literal)
    # Expressions, function bodies, imports and calls cannot pass JSON decoding.
    return source, json.loads(literal)


def extract(text):
    source, tools_records = records(text, "Base_ToolsList")
    tools, ids = [], set()
    for original_key, value in tools_records.items():
        name = value.get("name")
        if not isinstance(name, str) or not name or len(name) > 200:
            raise ValueError("Invalid tool name")
        identifier = "tool-" + re.sub(r"[^a-z0-9]+", "-", original_key.lower()).strip("-")
        if identifier in ids:
            raise ValueError("Duplicate tool identifier")
        ids.add(identifier)
        amount, weight = value.get("amount", ""), value.get("weight", "")
        for number in [amount, weight]:
            if number == "":
                continue
            if type(number) not in [int, float] or not math.isfinite(number) or not 0 <= number <= 1000000:
                raise ValueError("Invalid factual amount or weight")
        category = value.get("type", "Tools")
        if not isinstance(category, str) or len(category) > 100:
            raise ValueError("Invalid tool category")
        price = re.search(r"\[([^\]]+)\]", value.get("infoname", ""))
        tools.append({"id": identifier, "name": name, "unitName": name,
                      "sourceAmount": amount, "quantity": 1 if amount == "" else amount,
                      "weight": None if weight == "" else weight,
                      "price": price[1] if price else "", "edition": "2014", "category": category})
    gear_amounts = {}
    if "var Base_GearList =" in text:
        _, gear = records(text, "Base_GearList")
        for original_key, value in gear.items():
            identifier = "gear-" + re.sub(r"[^a-z0-9]+", "-", original_key.lower()).strip("-")
            amount = value.get("amount", "")
            if amount != "" and (type(amount) not in [int, float] or not math.isfinite(amount) or not 0 <= amount <= 1000000):
                raise ValueError("Invalid original gear amount")
            gear_amounts[identifier] = amount
    return {"format": 1, "source": {"list": "Base_ToolsList", "version": "MPMB 13.0.4",
                                    "staticOnly": True, "sha256": hashlib.sha256(source.encode()).hexdigest()},
            "gearAmounts": gear_amounts, "tools": tools}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stream", type=Path)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parents[1] / "data/rules/adobe-tools.json")
    args = parser.parse_args()
    result = extract(args.stream.read_text())
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(result['tools'])} factual tools; no PDF code executed")
