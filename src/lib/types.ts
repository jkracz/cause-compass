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
  openEnded?: string;
  causes?: string[];
  helpMethod?: string[];
  changeScope?: string;
  location?: string;
}

export interface User {
  userId: string;
  preferences: UserPreferences;
  likedOrganizations: string[];
  createdAt: Date;
  updatedAt: Date;
}
