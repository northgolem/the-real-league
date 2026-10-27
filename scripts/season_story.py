"""Verified, season-specific editorial facts for the two historical leagues.

Every observation comes from the full and alternative standings for that year.
Rank changes compare ONLY the surviving teams, so excluded clubs don't create
illusory position gains. Never infer a match result, a real-world trophy, or a
football story from a standing.
"""


def season_facts(data):
    full = data["officialTableApproximation"]
    alt = data["alternativeTable"]
    if len(alt) < 2:
        raise ValueError("Cannot describe a title race with fewer than two teams")
    full_names = [r["name"] for r in full]
    survivor_names = [r["name"] for r in alt]
    if len(full_names) != len(set(full_names)) or len(survivor_names) != len(set(survivor_names)):
        raise ValueError("Duplicate teams in season archive")
    if not set(survivor_names).issubset(set(full_names)):
        raise ValueError("Alternative table contains a club absent from the original")
    old_survivors = [r for r in full if r["name"] in set(survivor_names)]
    original_survivor_rank = {r["name"]: i for i, r in enumerate(old_survivors, 1)}
    full_by_name = {r["name"]: r for r in full}

    winner, runner = alt[0], alt[1]
    margin = winner["Pts"] - runner["Pts"]
    if margin < 0:
        raise ValueError("Alternative table was not sorted by points")
    upward = [
        (original_survivor_rank[r["name"]] - i, r, original_survivor_rank[r["name"]], i)
        for i, r in enumerate(alt, 1)
    ]
    gains = sorted((x for x in upward if x[0] > 0),
                   key=lambda item: (-item[0], item[3], item[1]["name"]))
    biggest_gain = gains[0] if gains else None
    winner_full = full_by_name[winner["name"]]
    all_club_champion = full[0]
    full_match_points = winner_full["Pts"] - winner["Pts"]
    # Positive, negative or zero is possible for inconsistent source data:
    # 0 or positive is required when removing finished fixtures.
    if full_match_points < 0:
        raise ValueError("Excluding matches cannot add points to a club")
    if data["includedMatches"] + data["excludedMatches"] != data["completedMatches"]:
        raise ValueError("Season match accounting does not reconcile")

    return {
        "winner": winner, "runner": runner,
        "full_leader": all_club_champion,
        "same_champion": all_club_champion["name"] == winner["name"],
        "winner_original_position": full_names.index(winner["name"]) + 1,
        "winner_full_points": winner_full["Pts"],
        "winner_excluded_points": full_match_points,
        "margin": margin,
        "biggest_gain": biggest_gain,
        "rank_changed": any(gain != 0 for gain, _, _, _ in upward),
        "survivor_order": old_survivors,
        "number_remaining": len(alt),
        "removed": data["excludedMatches"],
        "kept": data["includedMatches"],
    }
