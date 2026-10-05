#!/usr/bin/env python3
"""Audit MPMB/Adobe class-feature choices against the web choice registry.

The script never executes Acrobat JavaScript. It reads named JavaScript streams
from a user-supplied PDF (pypdf) or extracted .js/.txt sources and discovers
structured choice metadata.

Usage:
  python scripts/audit-class-feature-choices.py sheet.pdf
  python scripts/audit-class-feature-choices.py sheet.pdf extracted-rules.js \
    --markdown docs/adobe-class-feature-choice-audit.md \
    --json data/rules/adobe-class-feature-choice-audit.json
"""
import argparse
import ast
import json
import pathlib
import re
import sys

def norm(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())

def clean(value):
    return re.sub(r"\s*\(prereq:.*$", "", str(value or ""), flags=re.I).strip()

def pdf_sources(path):
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise SystemExit("PDF input requires pypdf: pip install pypdf") from exc
    reader = PdfReader(str(path))
    names = reader.trailer["/Root"].get("/Names")
    if not names:
        return []
    names = names.get_object() if hasattr(names, "get_object") else names
    tree = names.get("/JavaScript")
    if not tree:
        return []
    tree = tree.get_object() if hasattr(tree, "get_object") else tree
    arr = tree.get("/Names", [])
    out = []
    for i in range(0, len(arr), 2):
        name = str(arr[i])
        entry = arr[i + 1].get_object() if hasattr(arr[i + 1], "get_object") else arr[i + 1]
        js = entry.get("/JS") if hasattr(entry, "get") else None
        if hasattr(js, "get_object"):
            js = js.get_object()
        if hasattr(js, "get_data"):
            raw = js.get_data()
            text = raw.decode("utf-8", "replace") if isinstance(raw, (bytes, bytearray)) else str(raw)
        else:
            text = str(js or "")
        if text:
            out.append((path.name + ":" + name, text))
    return out

def text_sources(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    stripped = text.lstrip()
    if stripped.startswith("({"):
        try:
            obj = ast.literal_eval(text)
            if isinstance(obj, dict):
                return [(path.name + ":" + str(name), str(value)) for name, value in obj.items()]
        except Exception:
            pass
    return [(path.name, text)]

def load_sources(paths):
    out = []
    for path in paths:
        if path.is_dir():
            for child in sorted(path.rglob("*")):
                if child.is_file() and child.suffix.lower() in {".js", ".txt"}:
                    out.extend(text_sources(child))
        elif path.suffix.lower() == ".pdf":
            out.extend(pdf_sources(path))
        else:
            out.extend(text_sources(path))
    return out

def balanced(text, start, opening="(", closing=")"):
    depth = 0
    quote = None
    escape = False
    regex = False
    char_class = False
    i = start
    while i < len(text):
        ch = text[i]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = None
        elif regex:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif char_class:
                if ch == "]":
                    char_class = False
            elif ch == "[":
                char_class = True
            elif ch == "/":
                regex = False
        else:
            if ch in "'\"":
                quote = ch
            elif ch == "/" and i + 1 < len(text) and text[i + 1] not in "/*" and (i == 0 or text[i - 1] in ":,=([!&|?{;"):
                regex = True
            elif ch == opening:
                depth += 1
            elif ch == closing:
                depth -= 1
                if depth == 0:
                    return text[start:i + 1], i + 1
        i += 1
    raise ValueError("unterminated balanced block")

def split_args(block):
    source = block[1:-1]
    out = []
    start = 0
    stack = []
    quote = None
    escape = False
    pairs = {")": "(", "]": "[", "}": "{"}
    for i, ch in enumerate(source):
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = None
            continue
        if ch in "'\"":
            quote = ch
        elif ch in "([{":
            stack.append(ch)
        elif ch in ")]}" and stack and stack[-1] == pairs[ch]:
            stack.pop()
        elif ch == "," and not stack:
            out.append(source[start:i].strip())
            start = i + 1
    out.append(source[start:].strip())
    return out

def js_string(token):
    token = token.strip()
    if len(token) >= 2 and token[0] in "'\"" and token[-1] == token[0]:
        try:
            return ast.literal_eval(token)
        except Exception:
            return token[1:-1]
    return None

def strings(text):
    out = []
    for match in re.finditer(r"""(["'])(.*?)(?<!\\)\1""", text, re.S):
        raw = match.group(0)
        try:
            out.append(ast.literal_eval(raw))
        except Exception:
            out.append(match.group(2))
    return out

def calls(js, name):
    pattern = re.compile(r"\b" + re.escape(name) + r"\s*\(")
    for match in pattern.finditer(js):
        start = js.find("(", match.start())
        try:
            block, _ = balanced(js, start)
        except ValueError:
            continue
        yield split_args(block)

def assigned_object(js, name):
    match = re.search(r"\b" + re.escape(name) + r"\s*=\s*\{", js)
    if not match:
        return None
    start = js.find("{", match.start())
    try:
        return balanced(js, start, "{", "}")[0]
    except ValueError:
        return None

def keyed_object(text, key):
    match = re.search(r"(?<![\w$])" + re.escape(key) + r"\s*:\s*\{", text)
    if not match:
        return None
    start = text.find("{", match.start())
    try:
        return balanced(text, start, "{", "}")[0]
    except ValueError:
        return None

def top_objects(obj):
    source = obj[1:-1]
    i = 0
    while i < len(source):
        while i < len(source) and (source[i].isspace() or source[i] == ","):
            i += 1
        if i >= len(source):
            break
        if source[i] in "'\"":
            quote = source[i]
            j = i + 1
            escape = False
            while j < len(source):
                if escape:
                    escape = False
                elif source[j] == "\\":
                    escape = True
                elif source[j] == quote:
                    break
                j += 1
            key = js_string(source[i:j + 1]) or source[i + 1:j]
            i = j + 1
        else:
            match = re.match(r"[A-Za-z_$][\w$ .-]*?(?=\s*:)", source[i:])
            if not match:
                i += 1
                continue
            key = match.group(0).strip()
            i += len(match.group(0))
        while i < len(source) and source[i].isspace():
            i += 1
        if i >= len(source) or source[i] != ":":
            i += 1
            continue
        i += 1
        while i < len(source) and source[i].isspace():
            i += 1
        if i < len(source) and source[i] == "{":
            try:
                value, end = balanced(source, i, "{", "}")
            except ValueError:
                i += 1
                continue
            yield key, value
            i = end
        else:
            while i < len(source) and source[i] != ",":
                i += 1

def value_string(obj, key):
    match = re.search(r"(?<![\w$])" + re.escape(key) + r"\s*:\s*([\"'])(.*?)(?<!\\)\1", obj, re.S)
    return match.group(2) if match else ""

def value_int(obj, key):
    match = re.search(r"(?<![\w$])" + re.escape(key) + r"\s*:\s*(\d+)", obj)
    return int(match.group(1)) if match else 0

def value_array(obj, key):
    match = re.search(r"(?<![\w$])" + re.escape(key) + r"\s*:\s*\[", obj)
    if not match:
        return []
    start = obj.find("[", match.start())
    try:
        block, _ = balanced(obj, start, "[", "]")
    except ValueError:
        return []
    return strings(block)

def choice_group(owner_type, class_id, subclass_id, key, obj, pattern, source):
    choices = value_array(obj, "choices")
    extra = value_array(obj, "extrachoices")
    if not choices and not extra:
        return None
    options = [clean(x) for x in (extra or choices)]
    return {
        "ownerType": owner_type,
        "classId": class_id,
        "subclassId": subclass_id or "",
        "featureKey": key,
        "featureName": value_string(obj, "name") or key,
        "minLevel": value_int(obj, "minlevel"),
        "choiceMode": "extrachoices" if extra else "choices",
        "options": options,
        "sourcePattern": pattern,
        "sourceName": source,
        "hasExtraTimes": "extraTimes" in obj,
        "hasPrereq": "prereqeval" in obj or any("prereq:" in x.lower() for x in (extra or choices)),
    }

def scan_object_list(js, source, variable, owner_type):
    root = assigned_object(js, variable)
    if not root:
        return []
    out = []
    for owner, obj in top_objects(root):
        features = keyed_object(obj, "features")
        if not features:
            continue
        class_id, subclass_id = (owner, "") if owner_type == "class" else ((owner.split("-", 1) + [""])[:2])
        for key, feature in top_objects(features):
            row = choice_group(owner_type, class_id, subclass_id, key, feature, variable, source)
            if row:
                out.append(row)
    return out

def scan_subclasses(js, source):
    out = []
    for args in calls(js, "AddSubClass"):
        if len(args) < 3:
            continue
        class_id = js_string(args[0])
        subclass_id = js_string(args[1])
        if not class_id or not subclass_id or not args[2].lstrip().startswith("{"):
            continue
        features = keyed_object(args[2], "features")
        if not features:
            continue
        for key, feature in top_objects(features):
            row = choice_group("subclass", class_id, subclass_id, key, feature, "AddSubClass", source)
            if row:
                out.append(row)
    return out

def scan_helpers(js, source):
    out = []
    for args in calls(js, "AddFeatureChoice"):
        if len(args) < 3:
            continue
        name = js_string(args[2])
        match = re.search(r"ClassList\.([A-Za-z0-9_-]+)\.features(?:\.([A-Za-z0-9_.-]+)|\[[\"']([^\"']+)[\"']\])", args[0])
        if name and match:
            out.append((match.group(1), match.group(2) or match.group(3), clean(name), "AddFeatureChoice", source))
    for args in calls(js, "AddWarlockInvocation"):
        name = js_string(args[0]) if args else None
        if name:
            out.append(("warlock", "eldritch invocations", clean(name), "AddWarlockInvocation", source))
    for args in calls(js, "AddFightingStyle"):
        if len(args) < 2:
            continue
        name = js_string(args[1])
        if name:
            for class_id in strings(args[0]):
                out.append((class_id, "fighting style", clean(name), "AddFightingStyle", source))
    return out

def discover(sources):
    groups = []
    additions = []
    for source, js in sources:
        groups += scan_object_list(js, source, "Base_ClassList", "class")
        groups += scan_object_list(js, source, "Base_ClassSubList", "subclass")
        groups += scan_subclasses(js, source)
        additions += scan_helpers(js, source)
    unique = {}
    for row in groups:
        key = (norm(row["classId"]), norm(row["subclassId"]), norm(row["featureName"]), tuple(norm(x) for x in row["options"]))
        if key not in unique or unique[key]["sourcePattern"] == "AddSubClass":
            unique[key] = row
    return list(unique.values()), additions

def option_hits(options, registry):
    compact = norm(registry)
    return [option for option in options if norm(option) and norm(option) in compact]

def build_coverage(groups, additions, registry):
    rows = []
    def finish(row):
        hits = option_hits(row["options"], registry)
        feature_hit = norm(row["featureName"]) in norm(registry)
        status = "covered" if feature_hit and len(hits) == len(row["options"]) else ("partial" if feature_hit or hits else "missing")
        return {**row, "status": status, "implementedOptions": len(hits), "optionCount": len(row["options"]), "missingOptions": [x for x in row["options"] if x not in hits]}
    rows.extend(finish(row) for row in groups)
    aggregate = {}
    for class_id, feature, option_name, pattern, source in additions:
        key = (class_id, feature)
        entry = aggregate.setdefault(key, {"options": [], "patterns": set(), "sources": set()})
        if option_name not in entry["options"]:
            entry["options"].append(option_name)
        entry["patterns"].add(pattern)
        entry["sources"].add(source)
    for (class_id, feature), entry in sorted(aggregate.items()):
        rows.append(finish({
            "ownerType": "class-extension", "classId": class_id, "subclassId": "",
            "featureKey": norm(feature), "featureName": feature, "minLevel": 0,
            "choiceMode": "extension-options", "options": entry["options"],
            "sourcePattern": "+".join(sorted(entry["patterns"])),
            "sourceName": "; ".join(sorted(entry["sources"])),
            "hasExtraTimes": False, "hasPrereq": True,
        }))
    return rows

def markdown_report(report):
    counts = report["coverage"]
    lines = [
        "# Adobe / MPMB class-feature choice coverage", "",
        "Generated from structured choice metadata in the user-supplied MPMB/Adobe sheet and optional MPMB rule sources. The auditor does not execute Acrobat JavaScript or copy long rules descriptions.", "",
        "Discovered **%d** choice groups or extension sets: **%d covered**, **%d partial**, **%d missing**." % (report["discoveredGroups"], counts["covered"], counts["partial"], counts["missing"]), "",
        "Core/base feature groups: **%d**. Subclass/add-on direct groups: **%d**. Helper-added option records scanned: **%d**." % (report["coreGroups"], report["subclassGroups"], report["helperOptionAdditions"]), "",
        "| Status | Class | Subclass | Feature | Options | Missing | Source |",
        "|---|---|---|---|---:|---:|---|",
    ]
    order = {"missing": 0, "partial": 1, "covered": 2}
    for row in sorted(report["rows"], key=lambda x: (order[x["status"]], x["classId"], x["subclassId"], x["featureName"])):
        lines.append("| %s | %s | %s | %s | %d/%d | %d | %s |" % (
            row["status"], row["classId"], row["subclassId"] or "—", row["featureName"],
            row["implementedOptions"], row["optionCount"], len(row["missingOptions"]), row["sourcePattern"]))
    lines += ["", "## Missing / partial option names", ""]
    for row in report["rows"]:
        if row["status"] != "covered":
            label = row["classId"] + ((" / " + row["subclassId"]) if row["subclassId"] else "")
            missing = ", ".join(row["missingOptions"]) if row["missingOptions"] else "feature group not explicitly represented"
            lines.append("- **%s — %s**: %s" % (label, row["featureName"], missing))
    lines += ["", "## Interpretation", "",
        "- covered: feature name and every discovered option name are represented in the web choice registry.",
        "- partial: the group or some options are represented, but source-discovered options remain.",
        "- missing: no matching feature/option representation was found.",
        "- Coverage is not automation. A covered option can still have a manual mechanical effect.", ""]
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Audit MPMB/Adobe class feature choices against the web choice registry.")
    parser.add_argument("source", nargs="+", type=pathlib.Path, help="MPMB PDF, extracted JS/text file, or directory")
    parser.add_argument("--registry", type=pathlib.Path, default=pathlib.Path("js/modules/character-class-feature-choices.js"))
    parser.add_argument("--json", type=pathlib.Path)
    parser.add_argument("--markdown", type=pathlib.Path)
    parser.add_argument("--strict", action="store_true", help="Exit non-zero while any groups are partial/missing")
    args = parser.parse_args()

    sources = load_sources(args.source)
    if not sources:
        raise SystemExit("No JavaScript source could be extracted from the supplied input.")
    registry = args.registry.read_text(encoding="utf-8")
    groups, additions = discover(sources)
    rows = build_coverage(groups, additions, registry)
    counts = {status: sum(row["status"] == status for row in rows) for status in ("covered", "partial", "missing")}
    report = {
        "format": 1,
        "sources": [name for name, _ in sources],
        "discoveredGroups": len(rows),
        "coreGroups": sum(row["ownerType"] == "class" for row in groups),
        "subclassGroups": sum(row["ownerType"] == "subclass" for row in groups),
        "helperOptionAdditions": len(additions),
        "coverage": counts,
        "rows": rows,
    }

    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown = markdown_report(report)
    if args.markdown:
        args.markdown.parent.mkdir(parents=True, exist_ok=True)
        args.markdown.write_text(markdown + "\n", encoding="utf-8")
    print(markdown)
    if args.strict and (counts["partial"] or counts["missing"]):
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
