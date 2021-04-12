// Models

export enum UserPermissions {
  UNKNOWN = 0,
    ADD_PROJECTS = 1,
    UPLOAD_MEDIA = 2
}

export enum UserStatus {
  UNKNOWN = 0,
    OFLINE = 1,
    ONLINE = 2
}

export interface User {
  id: string;
  status: UserStatus;
  friends: Array < User['id'] > ;
  username: string;
  password: string;
  avatar: AppImage;
  access_token: string;
  permissions: Array < UserPermissions > ;
}

export interface AppImageData {
  url: string;
  width: number;
  height: number;
}

export interface AppMedia {
  id: string;
  isPrivate: boolean;
  canSee: Array < User['id'] > ;
}

export interface AppImage extends AppMedia {
  thumbnail: AppImageData;
  sizes: Array < AppImageData > ;
}

export interface AppVideo extends AppMedia {
  provider: 'youtube' | 'vimeo' | 'remote' | 'local'
  thumbnail: AppImageData;
  data: string;
}

export enum ProjectToolType {
  UNKNOWN = 0,
    CODING = 1,
    GRAPHIC = 2,
    VIDEO = 3
}

export interface ProjectTool {
  icon: AppImageData['id'];
  name: string;
  description: {
    short: string;
    long: string;
  }
  type: ProjectToolType;
}

export enum ProjectAuthorType {
  SINGLE = 0,
    TEAM = 1
}

export interface ProjectTeam {
  id: string;
}

export interface ProjectPublisher {
  id: string;
}

export interface Project {
  id: string;
  name: string;
  url: string;
  rating: number;
  promoted: boolean;
  description: {
    markdown: string;
    images: Array < AppImage['id'] > ;
    videos: Array < AppVideo['id'] > ;
    createdWith: Array < ProjectTool['id'] > ;
  };
  author: { type: ProjectAuthorType.SINGLE;data: AppUser['id']; } | { type: ProjectAuthorType.TEAM;data: ProjectTeam['id']; };
  publisher: ProjectPublisher['id'];
}