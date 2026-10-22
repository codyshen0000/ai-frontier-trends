"""#53 regression: full sync must not wipe same-origin covers. Run:
python -m unittest discover -s site-data/tests -p 'test_cover*.py' -v"""
import json, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cover_preserve import preserve_covers

SO = {"url": "assets/covers/hot-x-1600.webp", "width": 1600, "height": 890, "alt": "示意", "valueClass": "official_explainer"}


def tip(files):
    d = Path(tempfile.mkdtemp())
    for n, o in files.items():
        (d / n).parent.mkdir(parents=True, exist_ok=True)
        (d / n).write_text(json.dumps(o))
    return d


def hot(pid, cover):
    return {"entries": [{"rank": 1, "story": {"publicId": pid}, "cover": cover}, {"rank": 2, "story": {"publicId": "b"}, "cover": None}]}


class CoverPreserve(unittest.TestCase):
    def test_hot_null_keeps_tip_cover(self):
        new = {"hot.json": hot("a", None)}
        self.assertEqual(preserve_covers(new, tip({"hot.json": hot("a", SO)})), ["hot.json"])
        self.assertEqual(new["hot.json"]["entries"][0]["cover"], SO)

    def test_hot_remote_url_replaced_by_tip_cover(self):
        new = {"hot.json": hot("a", {"url": "https://cdn.example/x.png", "alt": "x"})}
        preserve_covers(new, tip({"hot.json": hot("a", SO)}))
        self.assertEqual(new["hot.json"]["entries"][0]["cover"]["url"], SO["url"])

    def test_hot_lead_changed_does_not_carry_cover(self):
        new = {"hot.json": hot("other", None)}
        self.assertEqual(preserve_covers(new, tip({"hot.json": hot("a", SO)})), [])
        self.assertIsNone(new["hot.json"]["entries"][0]["cover"])

    def test_new_same_origin_cover_wins(self):
        mine = dict(SO, url="assets/covers/new.webp")
        new = {"hot.json": hot("a", mine)}
        preserve_covers(new, tip({"hot.json": hot("a", SO)}))
        self.assertEqual(new["hot.json"]["entries"][0]["cover"]["url"], "assets/covers/new.webp")

    def test_event_and_daily_absent_cover_kept(self):
        new = {"events/a.json": {"publicId": "a"}, "daily.json": {"key": "2026-10-22", "cover": None}}
        t = tip({"events/a.json": {"publicId": "a", "cover": SO}, "daily.json": {"key": "2026-10-22", "cover": SO}})
        self.assertEqual(sorted(preserve_covers(new, t)), ["daily.json", "events/a.json"])

    def test_remote_tip_cover_never_kept(self):
        new = {"events/a.json": {"publicId": "a"}}
        preserve_covers(new, tip({"events/a.json": {"publicId": "a", "cover": {"url": "https://x/y.png"}}}))
        self.assertNotIn("cover", new["events/a.json"])

    def test_no_prev_tip_is_noop(self):
        self.assertEqual(preserve_covers({"hot.json": hot("a", None)}, None), [])


if __name__ == "__main__":
    unittest.main()
