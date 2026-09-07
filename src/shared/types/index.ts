export interface Word {
  id: string;
  text: string;
  pictureAsset: string;
  audioAsset: string;
  wordSetId: string;
  blankLetterIndex: number;
  letterChoices: [string, string, string];
  /**
   * False when the picture is a card showing the word itself, which is the only
   * honest illustration for `because`, `Friday` or `always`. Such a card *is*
   * the spelling, so the word must be kept out of every activity whose answer
   * is that spelling. Absent means true -- no Starters word needs the flag.
   *
   * Read it through `isPictorial` / `pictorialOnly` rather than testing the
   * field, so the rule lives in one place.
   */
  pictorial?: false;
}

export interface WordSet {
  id: string;
  displayName: string;
  words: Word[];
}

export interface ChildProfile {
  id: string;
  name: string;
  avatarId: string;
  createdAt: number;
}
