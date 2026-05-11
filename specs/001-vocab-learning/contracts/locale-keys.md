# Contract: i18n Locale Keys

**Date**: 2026-05-10 | **Plan**: [../plan.md](../plan.md)

Locale files live in `src/locales/{lang}/vocab.json`.
No hardcoded UI strings anywhere in source code — all text goes through react-i18next `t()`.

---

## Namespace: `vocab`

```json
{
  "wordSets": {
    "animals": "Animals",
    "food": "Food",
    "clothes": "Clothes",
    "colors": "Colors",
    "body": "Body",
    "toys": "Toys",
    "family": "Family"
  },

  "activities": {
    "introduce": {
      "prompt": "Listen and learn!",
      "replayButton": "Play again",
      "nextButton": "Next"
    },
    "recognize": {
      "prompt": "Tap the picture you hear!",
      "tryAgain": "Try again!",
      "wellDone": "Well done!"
    },
    "unscramble": {
      "prompt": "Make the word!",
      "tryAgain": "Try again!",
      "wellDone": "Amazing spelling!"
    },
    "fillInBlank": {
      "prompt": "Which letter is missing?",
      "tryAgain": "Almost! Try again.",
      "wellDone": "You got it!"
    }
  },

  "session": {
    "celebration": "Well done! 🌟",
    "reviewAllButton": "Review All",
    "exitButton": "Exit",
    "completedBadge": "Completed!"
  },

  "profiles": {
    "selectProfile": "Who are you?",
    "addProfile": "Add child"
  },

  "settings": {
    "title": "Settings",
    "audioToggle": "Sound on / off",
    "backButton": "Back"
  },

  "errors": {
    "audioUnavailable": "Tap to try audio again",
    "offline": "No internet — you can still play!"
  }
}
```

---

## Rules

- All display strings MUST use a key from this namespace or an extension of it.
- Component code uses `const { t } = useTranslation('vocab')` and calls `t('activities.introduce.prompt')`.
- Word display text (`word.text`) is content data, not i18n — it comes from the static word set JSON.
- Avatar names (`childProfile.name`) are user-entered data, not i18n.
- New UI strings require a key added here before the component is implemented.
