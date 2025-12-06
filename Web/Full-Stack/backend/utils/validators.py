def validate_required(data, fields):
    missing = []
    for f in fields:
        if f not in data or data[f] in ("", None):
            missing.append(f)

    if missing:
        return {
            "error": f"Missing required fields: {', '.join(missing)}"
        }
    return None
