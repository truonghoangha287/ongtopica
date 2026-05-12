export interface Word {
  id: string;
  text: string;
  pictureAsset: string;
  audioAsset: string;
  wordSetId: string;
  blankLetterIndex: number;
  letterChoices: [string, string, string];
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
