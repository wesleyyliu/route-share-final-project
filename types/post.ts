import { LimbAnnotation } from '@/components/VideoAnnotation';

export interface ClimbMetadata {
  location: string;
  difficulty: string;
  color: string;
}

export interface ClimbPost {
  id: string;
  videoUri: string;
  annotations: LimbAnnotation[];
  metadata: ClimbMetadata;
  description: string;
  createdAt: number;
}

