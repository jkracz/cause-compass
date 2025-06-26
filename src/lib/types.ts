export interface Organization {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  tags: string[];
  founded: string;
  impact: string;
  website: string;
}

export interface UserPreferences {
  userId: string;
  causes: string[];
  location: string | null;
  donationRange: string | null;
  involvement: string | null;
  helpMethod: string[];
  changeScope: 'local' | 'national' | 'global' | null;
  openEnded: string | null;
  createdAt: Date;
  updatedAt: Date;
}
