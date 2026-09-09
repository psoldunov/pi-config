"""Maintenance check: python3 agent/skills/coding-rules/tests/check.py (no dependencies)."""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
CORE = (ROOT / "SKILL.md").read_text(encoding="utf-8")
CARDS = {path.relative_to(ROOT).as_posix(): path.read_text(encoding="utf-8")
         for path in (ROOT / "references").rglob("*.md")}


def byte_size(text):
    return len(text.encode("utf-8"))


class CodingRulesChecks(unittest.TestCase):
    def test_skill_metadata(self):
        self.assertTrue(CORE.startswith("---\n"))
        metadata = CORE.split("---\n", 2)[1]
        self.assertIn("name: coding-rules\n", metadata)
        description = re.findall(r"^description: (.+)$", metadata, re.MULTILINE)
        self.assertEqual(len(description), 1)
        self.assertLessEqual(len(description[0]), 1024)
        self.assertNotIn("disable-model-invocation: true", metadata)

    def test_public_activation_covers_standalone_work(self):
        """Structural vocabulary guard only, not a behavioral compliance test."""
        description = re.findall(r"^description: (.+)$", CORE, re.MULTILINE)[0]
        agents = (ROOT.parents[1] / "AGENTS.md").read_text(encoding="utf-8")
        entry = agents.split("## Coding Rules\n", 1)[1].split("\n## ", 1)[0]
        triggers = (
            "source", "review", "security audits", "authorized commit/push/PR",
            "implementation research", "architecture", "data-access/API",
            "lifecycle hooks", "permissions", "task tracking",
            "specialist roles/delegation", "model/context", "performance/build",
            "standalone", "skip only unrelated prose/questions", "authorization",
        )
        for name, text in {"description": description, "AGENTS": entry}.items():
            with self.subTest(entry=name):
                for trigger in triggers:
                    self.assertIn(trigger.lower(), text.lower())

    def test_cards_are_indexed_once_and_do_not_chain(self):
        paths = re.findall(r"`(references/[^`]+\.md)`", CORE)
        self.assertEqual(len(paths), len(set(paths)))
        self.assertEqual(set(paths), set(CARDS))
        for path, text in CARDS.items():
            with self.subTest(path=path):
                self.assertNotRegex(text, r"\.md\b", "Cards must not load other docs")
                self.assertNotIn("SKILL.md", path)

    def test_context_budgets(self):
        self.assertLessEqual(byte_size(CORE), 3500, "Core budget: 3500 UTF-8 bytes")
        for path, text in CARDS.items():
            with self.subTest(path=path):
                self.assertLessEqual(byte_size(text), 1500, "Card budget: 1500 bytes")
        total = byte_size(CORE) + sum(map(byte_size, CARDS.values()))
        self.assertLessEqual(total, 9500, "Whole rules budget: 9500 bytes")
        self.assertLessEqual(byte_size(CORE + CARDS["references/typescript.md"]), 4000)


if __name__ == "__main__":
    print(f"Core: {byte_size(CORE)} bytes; "
          f"core + TS: {byte_size(CORE + CARDS['references/typescript.md'])} bytes; "
          f"all rules: {byte_size(CORE) + sum(map(byte_size, CARDS.values()))} bytes",
          flush=True)
    unittest.main()
