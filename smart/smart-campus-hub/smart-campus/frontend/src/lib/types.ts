export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  building: string;
  floor: string;
  description: string;
  amenities: string[];
  imageUrls: string[];
  status: string;
  availabilityWindows: AvailabilityWindow[];
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityWindow {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: number;
  status: string;
  reviewedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  facilityId?: string;
  facilityName?: string;
  location: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  contactEmail?: string;
  contactPhone?: string;
  attachmentUrls: string[];
  resolutionNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId: string;
  referenceType: string;
  read: boolean;
  createdAt: string;
}
